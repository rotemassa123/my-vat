/**
 * Migration script to copy summary_content data from Summary collection to Invoice collection.
 * 
 * This script:
 * 1. Finds all Summary documents
 * 2. For each Summary, finds the corresponding Invoice by file_id
 * 3. Copies summary_content fields to Invoice if not already present
 * 4. Validates data integrity
 * 5. Creates a backup report
 * 
 * Usage:
 *   ts-node scripts/migrate-summary-to-invoice.ts [--dry-run] [--no-backup]
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

interface MigrationStats {
  totalSummaries: number;
  invoicesFound: number;
  invoicesUpdated: number;
  invoicesSkipped: number;
  errors: number;
  backupData: Array<{
    summaryId: string;
    invoiceId: string;
    fileId: string;
    updatedFields: string[];
    timestamp: string;
  }>;
}

interface SummaryDocument {
  _id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  file_id: string;
  file_name: string;
  summary_content?: {
    country?: string;
    supplier?: string;
    date?: string;
    invoice_id?: string;
    id?: string;
    description?: string;
    classification?: string;
    subclassification?: string;
    currency?: string;
    total_amount?: string | number;
    net_amount?: string | number;
    vat_amount?: string | number;
    vat_rate?: string | number;
    detailed_items?: any[];
  };
  created_at?: Date;
}

interface InvoiceDocument {
  _id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  entity_id?: mongoose.Types.ObjectId;
  name: string;
  source_id: string;
  country?: string | null;
  supplier?: string | null;
  invoice_date?: string | null;
  invoice_id?: string | null;
  description?: string | null;
  total_amount?: number | null;
  classification?: string | null;
  subclassification?: string | null;
  net_amount?: number | null;
  vat_amount?: number | null;
  vat_rate?: number | null;
  currency?: string | null;
  detailed_items?: any[] | null;
}

async function migrateSummaryToInvoice(
  dryRun: boolean = false,
  createBackup: boolean = true
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalSummaries: 0,
    invoicesFound: 0,
    invoicesUpdated: 0,
    invoicesSkipped: 0,
    errors: 0,
    backupData: [],
  };

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 
    `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '27017'}/${process.env.DB_DATABASE || 'myvat'}`;
  
  console.log(`Connecting to MongoDB at ${mongoUri.replace(/\/\/.*@/, '//***@')}...`);
  
  await mongoose.connect(mongoUri);
  console.log('MongoDB connection successful');

  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get collections
    const summaryCollection = db.collection('summaries');
    const invoiceCollection = db.collection('invoices');

    // Get all summaries with summary_content
    console.log('Fetching all summaries with summary_content...');
    const summaries = await summaryCollection.find({ 
      summary_content: { $exists: true, $ne: null },
      success: true 
    }).toArray() as SummaryDocument[];
    stats.totalSummaries = summaries.length;
    console.log(`Found ${stats.totalSummaries} summaries to process`);

    if (stats.totalSummaries === 0) {
      console.log('No summaries found. Migration complete.');
      return stats;
    }

    // Process each summary
    for (let idx = 0; idx < summaries.length; idx++) {
      const summary = summaries[idx];
      try {
        console.log(`[${idx + 1}/${stats.totalSummaries}] Processing summary for file_id: ${summary.file_id}`);

        // Find corresponding invoice by _id (file_id in summary is the invoice _id as string)
        let invoiceId: mongoose.Types.ObjectId;
        try {
          invoiceId = new mongoose.Types.ObjectId(summary.file_id);
        } catch (e) {
          console.warn(`  Invalid file_id format: ${summary.file_id}`);
          stats.errors++;
          continue;
        }

        const invoice = await invoiceCollection.findOne({ _id: invoiceId }) as InvoiceDocument | null;

        if (!invoice) {
          console.warn(`  Invoice not found for file_id: ${summary.file_id}`);
          stats.errors++;
          continue;
        }

        stats.invoicesFound++;

        // Check if already migrated (has summary data)
        if (invoice.country || invoice.supplier || invoice.invoice_date) {
          console.log(`  Invoice already has summary data, skipping`);
          stats.invoicesSkipped++;
          continue;
        }

        // Prepare update data
        const updateData: any = {};
        let needsUpdate = false;

        // Copy summary_content fields to Invoice if not already present
        if (summary.summary_content) {
          const content = summary.summary_content;

          // Map summary_content fields to Invoice fields
          const fieldMappings: Record<string, string> = {
            country: 'country',
            supplier: 'supplier',
            date: 'invoice_date',
            invoice_id: 'invoice_id',
            id: 'invoice_id', // Alternative field name
            description: 'description',
            classification: 'classification',
            subclassification: 'subclassification',
            currency: 'currency',
            detailed_items: 'detailed_items',
          };

          for (const [summaryField, invoiceField] of Object.entries(fieldMappings)) {
            const value = content[summaryField as keyof typeof content];
            if (value !== undefined && value !== null) {
              const currentValue = invoice[invoiceField as keyof InvoiceDocument];
              if (currentValue === undefined || currentValue === null) {
                updateData[invoiceField] = value;
                needsUpdate = true;
              }
            }
          }

          // Handle numeric fields with type conversion
          const numericFields: Record<string, string> = {
            total_amount: 'total_amount',
            net_amount: 'net_amount',
            vat_amount: 'vat_amount',
            vat_rate: 'vat_rate',
          };

          for (const [summaryField, invoiceField] of Object.entries(numericFields)) {
            const value = content[summaryField as keyof typeof content];
            if (value !== undefined && value !== null) {
              const currentValue = invoice[invoiceField as keyof InvoiceDocument];
              if (currentValue === undefined || currentValue === null) {
                try {
                  // Convert string to number if needed
                  let numValue: number;
                  if (typeof value === 'string') {
                    // Remove currency symbols and whitespace
                    const cleaned = value.replace(/[€$£¥,]/g, '').trim();
                    numValue = parseFloat(cleaned);
                  } else {
                    numValue = Number(value);
                  }
                  if (!isNaN(numValue)) {
                    updateData[invoiceField] = numValue;
                    needsUpdate = true;
                  }
                } catch (e) {
                  console.warn(`  Could not convert ${summaryField} to number: ${e}`);
                }
              }
            }
          }
        }

        // Update invoice if needed
        if (needsUpdate) {
          if (dryRun) {
            console.log(`  [DRY RUN] Would update invoice with: ${Object.keys(updateData).join(', ')}`);
            stats.invoicesUpdated++;
          } else {
            // Update invoice
            await invoiceCollection.updateOne(
              { _id: invoiceId },
              { $set: updateData }
            );
            console.log(`  ✅ Updated invoice with ${Object.keys(updateData).length} fields`);
            stats.invoicesUpdated++;

            // Store backup data
            if (createBackup) {
              stats.backupData.push({
                summaryId: summary._id.toString(),
                invoiceId: invoice._id.toString(),
                fileId: summary.file_id,
                updatedFields: Object.keys(updateData),
                timestamp: new Date().toISOString(),
              });
            }
          }
        } else {
          console.log(`  No updates needed for invoice`);
          stats.invoicesSkipped++;
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing summary ${summary.file_id}: ${error.message}`);
        stats.errors++;
        continue;
      }
    }

    // Create backup report
    if (createBackup && stats.backupData.length > 0 && !dryRun) {
      const backupFile = path.join(
        __dirname,
        `../migration_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.json`
      );
      const backupReport = {
        migrationDate: new Date().toISOString(),
        statistics: {
          totalSummaries: stats.totalSummaries,
          invoicesFound: stats.invoicesFound,
          invoicesUpdated: stats.invoicesUpdated,
          invoicesSkipped: stats.invoicesSkipped,
          errors: stats.errors,
        },
        backupData: stats.backupData,
      };
      fs.writeFileSync(backupFile, JSON.stringify(backupReport, null, 2));
      console.log(`Backup report saved to: ${backupFile}`);
    }

    return stats;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const noBackup = args.includes('--no-backup');

  if (dryRun) {
    console.log('='.repeat(60));
    console.log('DRY RUN MODE - No changes will be made');
    console.log('='.repeat(60));
  }

  try {
    const stats = await migrateSummaryToInvoice(dryRun, !noBackup);

    console.log('='.repeat(60));
    console.log('Migration completed!');
    console.log(`
Migration Statistics:
  Total summaries processed: ${stats.totalSummaries}
  Invoices found: ${stats.invoicesFound}
  Invoices updated: ${stats.invoicesUpdated}
  Invoices skipped (already migrated): ${stats.invoicesSkipped}
  Errors: ${stats.errors}
`);
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('This was a dry run. Run without --dry-run to apply changes.');
    }
  } catch (error: any) {
    console.error(`Migration failed: ${error.message}`, error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { migrateSummaryToInvoice };


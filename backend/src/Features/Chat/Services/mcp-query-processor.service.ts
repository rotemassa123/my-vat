import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IInvoiceRepository } from '../../../Common/ApplicationCore/Services/IInvoiceRepository';
import { IProfileRepository } from '../../../Common/ApplicationCore/Services/IProfileRepository';
import { InvoiceFilters } from '../../../Common/ApplicationCore/Services/IInvoiceRepository';
import { SummaryFilters } from '../../../Common/ApplicationCore/Services/IInvoiceRepository';

interface DataRequest {
  source: string;
  filters: Record<string, any>;
  fields: string[];
}

interface UserContext {
  userId: string;
}

@Injectable()
export class MCPQueryProcessor {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private invoiceService: IInvoiceRepository,
    private profileService: IProfileRepository
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY')
    });
  }

  async processQuery(query: string, userContext: UserContext): Promise<any> {
    console.log('🔍 MCP: Starting processQuery for:', query);
    try {
      // Step 1: Analyze query to determine data needs
      const dataRequests = await this.analyzeDataNeeds(query);
      console.log('🔍 MCP: Data requests:', dataRequests);
      
      // If no data requests, return null (general question)
      if (!dataRequests || dataRequests.length === 0) {
        console.log('🔍 MCP: No data requests, treating as general question');
        return null;
      }
      
      // Step 2: Fetch relevant data
      const contextData = await this.fetchRelevantData(dataRequests, userContext);
      console.log('🔍 MCP: Fetched context data:', contextData);
      
      return contextData;
    } catch (error) {
      console.log('🔍 MCP: Error in processQuery:', error.message);
      console.log('MCP Query Processor: General question detected, no additional data needed');
      return null; // Return null for general questions
    }
  }

  private async analyzeDataNeeds(query: string): Promise<DataRequest[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: `You are a data analyst for a VAT system. 
          Given a user query, determine what specific data you need to answer it.
          
          Available data sources:
          - invoices: {id, amount, date, supplier, vat_amount, status, category}
          - entities: {id, name, vat_number, address, vat_settings}
          - summaries: {processed invoices, totals, trends}
          
          IMPORTANT: Return JSON for ANY question about user's data, invoices, totals, counts, or specific information.
          For general questions (greetings, VAT rules, general help), return an empty array: []
          
          Return JSON array of data requests:
          [{"source": "invoices", "filters": {"date_range": "2024-01-01 to 2024-03-31", "status": "completed"}, "fields": ["amount", "vat_amount", "supplier"]}]
          
              Examples:
              - "Hello" -> []
              - "What is VAT?" -> []
              - "How many invoices do I have?" -> [{"source": "invoices", "filters": {}, "fields": []}]
              - "Show me my invoices" -> [{"source": "invoices", "filters": {}, "fields": ["id", "amount", "date", "supplier"]}]
              - "What's my total VAT?" -> [{"source": "invoices", "filters": {}, "fields": ["vat_amount"]}]
              - "How much did I spend this month?" -> [{"source": "invoices", "filters": {}, "fields": ["amount", "date"]}]
          
          Be specific about filters and only request fields you actually need.`
        }, {
          role: "user",
          content: query
        }],
        temperature: 0.1
      });
      
      const content = response.choices[0].message.content;
      
      // Try to parse as JSON, if it fails, assume it's a general question
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.log('AI response not JSON, treating as general question:', content);
        return []; // Return empty array for general questions
      }
    } catch (error) {
      console.log('Error in analyzeDataNeeds, treating as general question:', error.message);
      return []; // Return empty array for general questions
    }
  }

  private async fetchRelevantData(requests: DataRequest[], userContext: UserContext): Promise<any> {
    const data: any = {};
    
    for (const request of requests) {
      switch (request.source) {
        case 'invoices':
          data.invoices = await this.getInvoices(userContext.userId, request.filters, request.fields);
          break;
          
        case 'entities':
          data.entities = await this.getEntities(userContext.userId, request.filters, request.fields);
          break;
          
        case 'summaries':
          data.summaries = await this.getSummaries(userContext.userId, request.filters, request.fields);
          break;
      }
    }
    
    return data;
  }

  // REAL IMPLEMENTATION - Fetch actual invoice data
  private async getInvoices(userId: string, filters: any, fields: string[]): Promise<any[]> {
    console.log('🔍 MCP: Fetching real invoices for user:', userId);
    console.log('🔍 MCP: Requested fields:', fields);
    
    try {
      // Convert MCP filters to InvoiceFilters
      const invoiceFilters: InvoiceFilters = {
        account_id: userId, // Assuming userId maps to account_id
        ...filters
      };
      
      // Fetch real invoices from database
      const invoices = await this.invoiceService.findInvoices(invoiceFilters, 100, 0);
      
      console.log('🔍 MCP: Found', invoices.length, 'real invoices');
      
      // Debug: Log the first invoice to see its structure
      if (invoices.length > 0) {
        console.log('🔍 MCP: First invoice structure:', Object.keys(invoices[0]));
        console.log('🔍 MCP: First invoice sample:', JSON.stringify(invoices[0], null, 2));
      }
      
      // Debug: Count invoices by status
      const statusCounts = invoices.reduce((acc, invoice) => {
        const status = invoice.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      console.log('🔍 MCP: Invoice status breakdown:', statusCounts);
      console.log('🔍 MCP: Total invoices being sent to AI:', invoices.length);
      
      // If no specific fields requested, return all data
      if (!fields || fields.length === 0) {
        console.log('🔍 MCP: No fields specified, returning all invoice data');
        return invoices;
      }
      
      // Return only requested fields
      return invoices.map(invoice => {
        const result: any = {};
        fields.forEach(field => {
          // Check if field exists in invoice (case-insensitive)
          const invoiceKey = Object.keys(invoice).find(key => 
            key.toLowerCase() === field.toLowerCase()
          );
          
          if (invoiceKey) {
            result[field] = invoice[invoiceKey];
            console.log(`🔍 MCP: Added field ${field} = ${invoice[invoiceKey]}`);
          } else {
            console.log(`🔍 MCP: Field ${field} not found in invoice. Available fields:`, Object.keys(invoice));
          }
        });
        
        // If no fields were found, return the full invoice
        if (Object.keys(result).length === 0) {
          console.log('🔍 MCP: No requested fields found, returning full invoice');
          return invoice;
        }
        
        return result;
      });
    } catch (error) {
      console.error('🔍 MCP: Error fetching invoices:', error);
      return [];
    }
  }

  // REAL IMPLEMENTATION - Fetch actual entity data
  private async getEntities(userId: string, filters: any, fields: string[]): Promise<any[]> {
    console.log('🔍 MCP: Fetching real entities for user:', userId);
    
    try {
      // Fetch real entities from database
      const entities = await this.profileService.getEntitiesForAccount();
      
      console.log('🔍 MCP: Found', entities.length, 'real entities');
      
      // Return only requested fields
      return entities.map(entity => {
        const result: any = {};
        fields.forEach(field => {
          if (field in entity) {
            result[field] = entity[field];
          }
        });
        return result;
      });
    } catch (error) {
      console.error('🔍 MCP: Error fetching entities:', error);
      return [];
    }
  }

  // REAL IMPLEMENTATION - Fetch actual summary data
  private async getSummaries(userId: string, filters: any, fields: string[]): Promise<any[]> {
    console.log('🔍 MCP: Fetching real summaries for user:', userId);
    
    try {
      // Convert MCP filters to SummaryFilters
      const summaryFilters: SummaryFilters = {
        account_id: userId, // Assuming userId maps to account_id
        ...filters
      };
      
      // Fetch real summaries from database
      const summaries = await this.invoiceService.findSummaries(summaryFilters, 100, 0);
      
      console.log('🔍 MCP: Found', summaries.length, 'real summaries');
      
      // Return only requested fields
      return summaries.map(summary => {
        const result: any = {};
        fields.forEach(field => {
          if (field in summary) {
            result[field] = summary[field];
          }
        });
        return result;
      });
    } catch (error) {
      console.error('🔍 MCP: Error fetching summaries:', error);
      return [];
    }
  }
}

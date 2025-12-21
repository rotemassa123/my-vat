import { Agent, setDefaultOpenAIKey } from '@openai/agents';
import { IInvoiceRepository } from '../../../Common/ApplicationCore/Services/IInvoiceRepository';
import { IProfileRepository } from '../../../Common/ApplicationCore/Services/IProfileRepository';
import { createInvoiceTools } from './Tools/invoice.tools';
import { createEntityTools } from './Tools/entity.tools';
import { createUserTools } from './Tools/user.tools';
import { createAccountTools } from './Tools/account.tools';
import { createSummaryTools } from './Tools/summary.tools';

// Initialize API key
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}
setDefaultOpenAIKey(apiKey);

/**
 * System prompt for the VAT assistant agent
 */
const SYSTEM_PROMPT = `You are a VAT (Value Added Tax) expert assistant for a VAT processing system.

Your role is to help users understand and manage their VAT-related data, including:
- Invoice information and status
- VAT claim amounts and processing
- Entity and account details
- User management
- Account statistics and analytics

You have access to the following tools:
- Invoice tools: Query invoices, get invoice details, count invoices, get invoice statistics, get invoice summaries (with extracted data like supplier, amounts, VAT details, etc.)
- Summary tools: Query document summaries (extracted data from processed files), get summary by ID or file ID, count summaries
- Entity tools: Get entities, get entity details
- User tools: Get users, get user details
- Account tools: Get account info, get account statistics

IMPORTANT GUIDELINES:
1. When users ask about invoices, ALWAYS use the invoice tools to fetch real data - even if no status or filter is mentioned
2. When users ask about totals, counts, or statistics, use the appropriate tools to get accurate numbers - don't assume zero without checking
3. Be specific and accurate - always use tools to get real data rather than making assumptions
4. If a user asks a general VAT question (not specific to their data), you can answer directly without using tools
5. When presenting data, format it clearly and provide context
6. If tool calls fail, explain the error to the user in a friendly way
7. Always be helpful, professional, and concise

Use tools proactively when the user asks about their data. IMPORTANT: Use tools even if the user doesn't specify filters. For example:
- "How many invoices do I have?" → Use count_invoices tool (WITHOUT status filter to get total count)
- "How many unclaimed invoices?" → Use count_invoices tool WITH status="claimable" (claimable = unclaimed)
- "Show me my invoices" → Use get_invoice_summaries tool (WITHOUT status filter to get ALL invoices)
- "What invoices do I have?" → Use get_invoice_summaries tool to get ALL invoices with their extracted data
- "What's my total VAT claim amount?" → Use get_invoice_statistics tool (WITHOUT status filter to get overall statistics)
- "Tell me about my account" → Use get_account_info tool
- "Show me invoice details" or "What are the details of my invoices?" → Use get_invoice_summaries tool

Valid invoice statuses: "processing", "failed", "not_claimable", "claimable" (unclaimed), "awaiting_claim_result", "claim_accepted", "claim_rejected"
Note: "claimable" status means the invoice is claimable but not yet submitted (unclaimed).`;

/**
 * Create the main VAT agent with all tools
 */
export function createMainAgent(
  invoiceRepository: IInvoiceRepository,
  profileRepository: IProfileRepository,
): Agent {
  // Create all tools with injected repositories
  const invoiceTools = createInvoiceTools(invoiceRepository);
  const entityTools = createEntityTools(profileRepository);
  const userTools = createUserTools(profileRepository);
  const accountTools = createAccountTools(profileRepository);
  const summaryTools = createSummaryTools(invoiceRepository);

  // Create agent with all tools
  const agent = new Agent({
    name: 'VATAssistant',
    instructions: SYSTEM_PROMPT,
    model: 'gpt-4o-mini', // Using cheaper model to reduce costs
    tools: [
      invoiceTools.getInvoicesTool,
      invoiceTools.getInvoiceByIdTool,
      invoiceTools.countInvoicesTool,
      invoiceTools.getInvoiceStatisticsTool,
      invoiceTools.getInvoiceSummariesTool,
      summaryTools.getSummariesTool,
      summaryTools.getSummaryByIdTool,
      summaryTools.getSummaryByFileIdTool,
      summaryTools.countSummariesTool,
      entityTools.getEntitiesTool,
      entityTools.getEntityByIdTool,
      userTools.getUsersTool,
      userTools.getUserByIdTool,
      accountTools.getAccountInfoTool,
      accountTools.getAccountStatisticsTool,
    ],
  });

  return agent;
}


import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { UserProfile } from './user-profile.service';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private assistantId: string;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY')
    });
    this.assistantId = this.configService.get('OPENAI_ASSISTANT_ID');
  }

  async processMessage(
    message: string,
    threadId: string,
    contextData?: any,
    isFirstMessage: boolean = false,
    userProfile?: UserProfile
  ): Promise<AsyncGenerator<string, void, unknown>> {
    // Add context data to message if provided
    let enrichedMessage = message;
    
    if (isFirstMessage && userProfile) {
      // Personalized greeting for first message
      enrichedMessage = `Good morning ${userProfile.firstName}! I am your MyVAT personal assistant. I can help with your invoices and data, or general VAT rules. How can I help?`;
    } else if (contextData) {
      enrichedMessage = `${message}\n\nContext Data: ${JSON.stringify(contextData, null, 2)}`;
    }

    // Send message to persistent thread (AI remembers conversation)
    return this.streamAssistantResponse(threadId, enrichedMessage, userProfile);
  }

  /**
   * Phase 1: Ask the LLM what data it needs to answer the user's question
   * Returns the LLM's response in MCP format (JSON array of data requests)
   * Uses a simple chat completion (not thread) since we just need the JSON response
   */
  async requestDataRequirements(
    message: string,
    userProfile?: UserProfile
  ): Promise<string> {
    const systemPrompt = `You are a data analyst for a VAT system. 
Analyze the user's question and determine what specific data you need to answer it accurately.

Available data sources:
- invoices: {id, amount, date, supplier, vat_amount, status, category}
- entities: {id, name, vat_number, address, vat_settings}
- summaries: {processed invoices, totals, trends}

IMPORTANT: Return ONLY valid JSON array. For general questions (greetings, VAT rules, general help), return an empty array: []

Format your response as a JSON array of data requests:
[{"source": "invoices", "filters": {"date_range": "2024-01-01 to 2024-03-31", "status": "completed"}, "fields": ["amount", "vat_amount", "supplier"]}]

Examples:
- "Hello" -> []
- "What is VAT?" -> []
- "How many invoices do I have?" -> [{"source": "invoices", "filters": {}, "fields": []}]
- "Show me my invoices" -> [{"source": "invoices", "filters": {}, "fields": ["id", "amount", "date", "supplier"]}]
- "What's my total VAT?" -> [{"source": "invoices", "filters": {}, "fields": ["vat_amount"]}]

Be specific about filters and only request fields you actually need. Return ONLY the JSON array, no other text.`;

    try {
      // Use simple chat completion for Phase 1 (no thread needed)
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.1
      });

      const content = response.choices[0].message.content || '[]';
      console.log('🔍 Phase 1 - LLM data requirements response:', content);
      
      // Try to parse JSON array from response
      // The response might be just the array, or wrapped in markdown code blocks
      let cleanedContent = content.trim();
      
      // Remove markdown code blocks if present
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/g, '').replace(/\n?```$/g, '');
      }
      
      try {
        const parsed = JSON.parse(cleanedContent);
        if (Array.isArray(parsed)) {
          return JSON.stringify(parsed);
        }
        // If it's an object, try to find an array property
        const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (arrayKey) {
          return JSON.stringify(parsed[arrayKey]);
        }
        return '[]';
      } catch {
        // If parsing fails, return empty array
        console.warn('Failed to parse data requirements response as JSON, returning empty array');
        return '[]';
      }
    } catch (error) {
      console.error('Error requesting data requirements:', error);
      return '[]'; // Return empty array on error
    }
  }

  /**
   * Phase 2: Process the final message with fetched data and stream the response
   */
  async processMessageWithData(
    message: string,
    threadId: string,
    contextData: any,
    isFirstMessage: boolean = false,
    userProfile?: UserProfile
  ): Promise<AsyncGenerator<string, void, unknown>> {
    // Add context data to message
    let enrichedMessage = message;
    
    if (isFirstMessage && userProfile) {
      // Personalized greeting for first message
      enrichedMessage = `Good morning ${userProfile.firstName}! I am your MyVAT personal assistant. I can help with your invoices and data, or general VAT rules. How can I help?`;
    } else if (contextData) {
      // Optimize context data - don't send full invoice objects if there are too many
      let optimizedContext = { ...contextData };
      
      if (contextData.invoices && Array.isArray(contextData.invoices)) {
        const invoiceCount = contextData.invoices.length;
        console.log(`\n📤 Sending to LLM (Phase 3):`);
        console.log(`   Original Message: "${message}"`);
        console.log(`   📊 INVOICES IN CONTEXT: ${invoiceCount} invoices`);
        
        // If we have many invoices, send summary instead of full data
        if (invoiceCount > 20) {
          console.log(`   ⚠️  Too many invoices (${invoiceCount}), sending summary instead of full data`);
          
          // Create summary with counts by status
          const statusCounts = contextData.invoices.reduce((acc: any, inv: any) => {
            const status = inv.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
          
          // Calculate totals
          const totalAmount = contextData.invoices.reduce((sum: number, inv: any) => {
            return sum + (parseFloat(inv.amount) || 0);
          }, 0);
          
          const totalVat = contextData.invoices.reduce((sum: number, inv: any) => {
            return sum + (parseFloat(inv.vat_amount) || 0);
          }, 0);
          
          // Replace full invoice array with summary
          optimizedContext.invoices = {
            total_count: invoiceCount,
            status_breakdown: statusCounts,
            total_amount: totalAmount,
            total_vat_amount: totalVat,
            sample_invoices: contextData.invoices.slice(0, 5).map((inv: any) => ({
              id: inv._id || inv.id,
              amount: inv.amount,
              date: inv.date,
              supplier: inv.supplier,
              status: inv.status
            }))
          };
          
          console.log(`   📊 Summary: ${invoiceCount} total, ${Object.keys(statusCounts).length} status types`);
        } else {
          // For smaller sets, send full data but limit fields
          optimizedContext.invoices = contextData.invoices.map((inv: any) => ({
            id: inv._id || inv.id,
            amount: inv.amount,
            date: inv.date,
            supplier: inv.supplier,
            vat_amount: inv.vat_amount,
            status: inv.status,
            category: inv.category
          }));
          console.log(`   📊 Sending ${invoiceCount} invoices with limited fields`);
        }
      }
      
      const contextDataString = JSON.stringify(optimizedContext, null, 2);
      console.log(`   Context Data Size: ${contextDataString.length} characters`);
      
      enrichedMessage = `${message}\n\nContext Data:\n${contextDataString}`;
      console.log(`   Enriched Message Length: ${enrichedMessage.length} characters`);
    } else {
      console.log(`\n📤 Sending to LLM (Phase 3):`);
      console.log(`   Original Message: "${message}"`);
      console.log(`   No context data (general question)`);
    }

    // Send message to persistent thread (AI remembers conversation)
    return this.streamAssistantResponse(threadId, enrichedMessage, userProfile);
  }

  private async *streamAssistantResponse(
    threadId: string, 
    message: string,
    userProfile?: UserProfile
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Build system prompt with user context
      const systemPrompt = this.buildSystemPrompt(userProfile);
      
      console.log('🔍 Debug - Starting streamAssistantResponse');
      console.log('🔍 Debug - Message length:', message.length);
      console.log('🔍 Debug - Thread ID:', threadId);
      
      // Add the user message to the thread first
      console.log('🔍 Debug - Adding message to thread...');
      await this.openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message
      });
      console.log('🔍 Debug - Message added to thread');
      
      // Use OpenAI Assistant with persistent thread
      console.log('🔍 Debug - Creating stream...');
      const stream = await this.openai.beta.threads.runs.createAndStream(
        threadId,
        { 
          assistant_id: this.assistantId,
          additional_instructions: systemPrompt
        }
      );
      console.log('🔍 Debug - Stream created, waiting for chunks...');

      let chunkReceived = false;
      for await (const chunk of stream) {
        chunkReceived = true;
        if (chunk.event === 'thread.message.delta') {
          const content = chunk.data.delta.content?.[0];
          if (content && 'text' in content) {
            yield content.text?.value || '';
          }
        } else if (chunk.event === 'thread.run.completed') {
          console.log('🔍 Debug - Run completed');
        } else if (chunk.event === 'thread.run.failed') {
          console.error('🔍 Debug - Run failed:', chunk.data);
          throw new Error(`OpenAI run failed: ${JSON.stringify(chunk.data)}`);
        }
      }
      
      if (!chunkReceived) {
        console.warn('🔍 Debug - No chunks received from stream');
      }
      
      console.log('🔍 Debug - Stream completed');
    } catch (error) {
      console.error('🔍 Debug - Error in streamAssistantResponse:', error);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      throw error;
    }
  }

  private buildSystemPrompt(userProfile?: UserProfile): string {
    if (!userProfile) {
      return "You are a VAT expert assistant. Help with invoices and VAT questions.";
    }

    return `You are a VAT expert assistant for ${userProfile.companyName || 'the user'}.

IMPORTANT: You have FULL ACCESS to the user's data including:
- Invoice data (amounts, dates, suppliers, VAT amounts, status)
- Entity information (company details, VAT numbers)
- Summary data (totals, trends, processed invoices)

User Context:
- Name: ${userProfile.firstName} ${userProfile.lastName}
- Company: ${userProfile.companyName || 'Not specified'}
- Email: ${userProfile.email}
- VAT Number: ${userProfile.vatNumber || 'Not specified'}
- Default Currency: ${userProfile.defaultCurrency || 'GBP'}
- Default VAT Rate: ${userProfile.defaultVatRate || '20%'}

When users ask about their data (invoices, totals, etc.), you can access and provide specific information from their system. You have the ability to:
- Count invoices and provide exact numbers (COUNT ALL INVOICES regardless of status - failed, processing, completed, etc.)
- Calculate totals and VAT amounts
- Show specific invoice details
- Provide data insights and analysis

CRITICAL: When counting invoices, count EVERY SINGLE invoice in the data provided, regardless of status (failed, processing, completed, etc.). Do not filter or exclude any invoices unless explicitly asked to filter by status.

Be confident and specific when providing data-driven answers. Use the actual data available to give precise responses.`;
  }

  async createThread(): Promise<string> {
    const thread = await this.openai.beta.threads.create();
    return thread.id;
  }

  async getThreadMessages(threadId: string): Promise<any[]> {
    const messages = await this.openai.beta.threads.messages.list(threadId);
    return messages.data;
  }
}

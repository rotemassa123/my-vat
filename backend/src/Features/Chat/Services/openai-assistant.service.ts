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

  private async *streamAssistantResponse(
    threadId: string, 
    message: string,
    userProfile?: UserProfile
  ): AsyncGenerator<string, void, unknown> {
    // Build system prompt with user context
    const systemPrompt = this.buildSystemPrompt(userProfile);
    
    console.log('🔍 Debug - User message:', message);
    console.log('🔍 Debug - System prompt:', systemPrompt);
    console.log('🔍 Debug - User profile:', userProfile);
    
    // Add the user message to the thread first
    await this.openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message
    });
    
    // Use OpenAI Assistant with persistent thread
    const stream = await this.openai.beta.threads.runs.createAndStream(
      threadId,
      { 
        assistant_id: this.assistantId,
        additional_instructions: systemPrompt
      }
    );

    for await (const chunk of stream) {
      if (chunk.event === 'thread.message.delta') {
        const content = chunk.data.delta.content?.[0];
        if (content && 'text' in content) {
          yield content.text?.value || '';
        }
      }
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

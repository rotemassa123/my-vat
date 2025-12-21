import { Injectable } from '@nestjs/common';
import { run, system, assistant } from '@openai/agents';
import type { AgentInputItem, AgentOutputItem } from '@openai/agents';
import { Agent } from '@openai/agents';
import * as httpContext from 'express-http-context';
import { UserContext } from '../../../Common/Infrastructure/types/user-context.type';
import { IInvoiceRepository } from '../../../Common/ApplicationCore/Services/IInvoiceRepository';
import { IProfileRepository } from '../../../Common/ApplicationCore/Services/IProfileRepository';
import { createMainAgent } from './main.agent';

@Injectable()
export class AgentGateway {
  private agent: Agent | null = null;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly profileRepository: IProfileRepository,
  ) {}

  /**
   * Get or create the agent instance
   */
  private getAgent(): Agent {
    if (!this.agent) {
      this.agent = createMainAgent(this.invoiceRepository, this.profileRepository);
    }
    return this.agent;
  }

  /**
   * Execute agent with user context injection
   */
  async runAgent(messages: AgentInputItem[]): Promise<AgentOutputItem[]> {
    try {
      // Get user context from httpContext
      const userContext = httpContext.get('user_context') as UserContext | undefined;
      
      // Build user context system message
      const contextParts: string[] = [];
      
      if (userContext?.userId) {
        contextParts.push(`- User ID: ${userContext.userId}`);
      }
      
      if (userContext?.accountId) {
        contextParts.push(`- Account ID: ${userContext.accountId}`);
      }
      
      if (userContext?.entityId) {
        contextParts.push(`- Entity ID: ${userContext.entityId}`);
      }

      // Inject user context as system message at the start
      const contextMessage = contextParts.length > 0
        ? system(`CURRENT USER CONTEXT:\n${contextParts.join('\n')}\n\nAll queries and data access will be automatically scoped to this account and entity.`)
        : null;

      const messagesWithContext = contextMessage
        ? [contextMessage, ...messages]
        : messages;

      // Get agent and execute
      const agent = this.getAgent();
      const result = await run(agent, messagesWithContext);

      return result.output;
    } catch (error) {
      // Log error and return error message as output
      console.error('Agent execution error:', error);
      
      // Return error as an assistant message using the assistant() helper
      const errorMessage = `I'm sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
      return [assistant(errorMessage)];
    }
  }
}


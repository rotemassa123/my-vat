import { user, system, assistant } from '@openai/agents';
import type { AgentInputItem, AgentOutputItem } from '@openai/agents';
import { MessageDocument } from '../../../Common/Infrastructure/DB/schemas/message.schema';
import { CreateMessageData } from '../Repositories/message.repository';

/**
 * Format database messages to AgentSDK input format
 */
export function formatMessagesForAgent(
  messages: MessageDocument[],
): AgentInputItem[] {
  return messages.map((msg) => {
    const role = msg.role || msg.sender_type || 'user';
    const content = msg.content || '';

    switch (role) {
      case 'system':
        return system(content);
      case 'user':
        return user(content);
      case 'assistant':
        return assistant(content);
      case 'tool':
        // Tool messages are typically not sent as input to the agent
        // They are handled internally by the SDK
        // For now, skip them or handle as assistant messages
        return assistant(content);
      default:
        return user(content);
    }
  });
}

/**
 * Format AgentSDK output to database entities
 */
export function formatAgentOutputToEntities(
  output: AgentOutputItem[],
  conversationId: string,
  userId: string,
): CreateMessageData[] {
  const messages: CreateMessageData[] = [];

  for (const item of output) {
    // Handle message type (most common for assistant responses)
    if (item.type === 'message' && 'content' in item && Array.isArray(item.content)) {
      // Extract text from content array
      const textParts: string[] = [];
      for (const contentItem of item.content) {
        if (typeof contentItem === 'object' && contentItem !== null) {
          if (contentItem.type === 'output_text' && 'text' in contentItem) {
            textParts.push(String(contentItem.text));
          } else if (contentItem.type === 'input_text' && 'text' in contentItem) {
            textParts.push(String(contentItem.text));
          } else if ('text' in contentItem) {
            textParts.push(String(contentItem.text));
          }
        } else if (typeof contentItem === 'string') {
          textParts.push(contentItem);
        }
      }
      
      const combinedText = textParts.join('').trim();
      if (combinedText) {
        messages.push({
          conversation_id: conversationId,
          role: ('role' in item ? item.role : 'assistant') as 'system' | 'user' | 'assistant' | 'tool',
          sender_type: ('role' in item ? item.role : 'assistant') as 'user' | 'assistant' | 'system' | 'tool',
          content: combinedText,
        });
      }
    }
    // Handle function calls (agent calling a tool)
    else if (item.type === 'function_call') {
      messages.push({
        conversation_id: conversationId,
        role: 'assistant',
        sender_type: 'assistant',
        content: `Calling tool: ${item.name}`,
        name: item.name,
        tool_call_id: item.callId,
        metadata: {
          arguments: typeof item.arguments === 'string' 
            ? item.arguments 
            : JSON.stringify(item.arguments),
        },
      });
    }
    // Handle function call results (tool response)
    else if (item.type === 'function_call_result') {
      const outputContent = extractContent(item.output);
      messages.push({
        conversation_id: conversationId,
        role: 'tool',
        sender_type: 'tool',
        content: outputContent,
        name: item.name,
        tool_call_id: item.callId,
        metadata: {
          output: item.output,
        },
      });
    }
    // Handle regular messages with role
    else if ('role' in item && item.role) {
      const content = extractContent(item);
      if (content) {
        messages.push({
          conversation_id: conversationId,
          role: item.role as 'system' | 'user' | 'assistant' | 'tool',
          sender_type: item.role as 'user' | 'assistant' | 'system' | 'tool',
          content: content,
        });
      }
    }
    // Handle text output (fallback)
    else if ('text' in item && item.text) {
      const textContent = typeof item.text === 'string' ? item.text : String(item.text);
      messages.push({
        conversation_id: conversationId,
        role: 'assistant',
        sender_type: 'assistant',
        content: textContent,
      });
    }
  }

  return messages;
}

/**
 * Extract text content from various message output formats
 */
function extractContent(output: any): string {
  if (typeof output === 'string') {
    return output;
  }
  
  if (output?.text) {
    return output.text;
  }
  
  if (Array.isArray(output)) {
    return output
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        if (item?.type === 'output_text' || item?.type === 'input_text') {
          return item.text || '';
        }
        return '';
      })
      .join('');
  }
  
  if (typeof output === 'object') {
    return JSON.stringify(output);
  }
  
  return '';
}


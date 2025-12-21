# AI Chat with OpenAI Agents SDK - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Installation](#setup--installation)
4. [Core Concepts](#core-concepts)
5. [Creating Agents](#creating-agents)
6. [Creating Tools](#creating-tools)
7. [Agent-as-Tool Pattern](#agent-as-tool-pattern)
8. [Message Formatting](#message-formatting)
9. [Tool Execution Flow](#tool-execution-flow)
10. [Complete Examples](#complete-examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This application uses **OpenAI Agents SDK** (`@openai/agents`) to create an interactive AI chat system that can:
- Have natural conversations with users
- Call tools to perform actions (create tasks, log moods, etc.)
- Use nested agents (agents that act as tools for other agents)
- Maintain conversation history and context

### Key Benefits
- **Interactive**: AI can perform actions, not just respond
- **Extensible**: Easy to add new tools and capabilities
- **Type-safe**: Uses Zod schemas for validation
- **Modular**: Agents can be composed and reused

---

## Architecture

### High-Level Flow

```
User Message (Frontend)
    ↓
HTTP POST /api/messages (Backend API)
    ↓
messagesController → messagesService
    ↓
Format DB messages → AgentInputItem[]
    ↓
run(moodyAgent, messages)
    ↓
Agent decides to call tool(s)
    ↓
Tool executes → Returns result
    ↓
Agent formats response
    ↓
Format AgentOutputItem[] → DB entities
    ↓
Save to database
    ↓
Return to frontend
```

### Component Structure

```
backend/src/
├── messages/
│   ├── controller/          # HTTP request handlers
│   ├── services/            # Business logic
│   ├── model/
│   │   ├── gateway/        # AgentSDK integration
│   │   │   ├── messagesAgent.ts    # Main agent definition
│   │   │   ├── messagesGateway.ts  # Agent execution
│   │   │   └── messagesTools.ts    # Direct tools
│   │   └── repository/     # Database operations
│   └── utils/
│       └── openaiMessageFormatter.ts  # Message conversion
├── tasks/
│   └── model/gateway/
│       ├── tasksAgent.ts    # Tasks agent
│       └── tasksTools.ts    # Task-specific tools
└── moodLog/
    └── model/gateway/
        ├── moodAgent.ts     # Mood agent
        └── moodTools.ts     # Mood-specific tools
```

---

## Setup & Installation

### 1. Install Dependencies

```bash
npm install @openai/agents zod
```

**Version used in this project:**
- `@openai/agents`: `^0.1.9`
- `zod`: `^3.25.76` (peer dependency)

### 2. Set Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Initialize AgentSDK

In your agent file, set the default API key:

```typescript
import { Agent, setDefaultOpenAIKey } from "@openai/agents";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}
setDefaultOpenAIKey(apiKey);
```

---

## Core Concepts

### 1. Agent
An **Agent** is an AI assistant with:
- **Instructions**: System prompt defining behavior
- **Model**: LLM to use (e.g., `gpt-4o`)
- **Tools**: Functions the agent can call

### 2. Tool
A **Tool** is a function the agent can execute:
- Has a name and description
- Takes parameters (Zod schema)
- Executes business logic
- Returns results

### 3. AgentInputItem & AgentOutputItem
- **AgentInputItem**: Messages sent TO the agent (`user()`, `system()`, `assistant()`)
- **AgentOutputItem**: Messages returned FROM the agent (responses, tool calls, results)

### 4. Message Types
- `system()`: System instructions
- `user()`: User messages
- `assistant()`: Assistant responses
- `tool()`: Tool execution results

---

## Creating Agents

### Basic Agent Structure

```typescript
import { Agent, setDefaultOpenAIKey } from "@openai/agents";

// Set API key
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set');
}
setDefaultOpenAIKey(apiKey);

// Define system prompt
const systemPrompt = `You are a helpful assistant.
Your role is to support users with tasks and questions.
Be friendly and concise.`;

// Create agent
export const myAgent = new Agent({
  name: 'MyAgent',
  instructions: systemPrompt,
  model: 'gpt-4o',           // or 'gpt-4', 'gpt-3.5-turbo'
  tools: [],                  // Tools array (we'll add these next)
});
```

### Example: Main Moody Agent

```typescript
// backend/src/messages/model/gateway/messagesAgent.ts
import { Agent, setDefaultOpenAIKey } from "@openai/agents";
import { getTimeTool } from "./messagesTools.js";
import { system_prompt_main_moody } from "@/messages/utils/systemPrompts.js";
import { tasksAgentTool } from "@/tasks/model/gateway/tasksAgent.js";
import { moodAgentTool } from "@/moodLog/model/gateway/moodAgent.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set');
}
setDefaultOpenAIKey(apiKey);

export const moodyAgent = new Agent({
  name: 'Moody',
  instructions: system_prompt_main_moody,
  model: 'gpt-4o',
  tools: [getTimeTool, tasksAgentTool, moodAgentTool],
});
```

**Key Points:**
- `name`: Identifier for the agent
- `instructions`: Detailed system prompt (see System Prompts section)
- `model`: OpenAI model to use
- `tools`: Array of tools the agent can call

---

## Creating Tools

### Basic Tool Structure

```typescript
import { tool } from "@openai/agents";
import { z } from "zod";

export const myTool = tool({
  name: 'tool_name',                    // Unique identifier
  description: 'What the tool does',    // Agent uses this to decide when to call
  parameters: z.object({                // Zod schema for parameters
    param1: z.string(),
    param2: z.number().optional(),
  }),
  async execute(input) {                // Execution function
    // Your business logic here
    return result;
  }
});
```

### Example: Get Current Time Tool

```typescript
// backend/src/messages/model/gateway/messagesTools.ts
import { tool } from "@openai/agents";
import { z } from "zod";

export const getTimeTool = tool({
  name: 'get_current_time',
  description: 'Returns the current date and time when the user asks for the time',
  parameters: z.object({}),  // No parameters needed
  execute: async () => {
    return new Date().toString();
  }
});
```

### Example: Create Task Tool

```typescript
// backend/src/tasks/model/gateway/tasksTools.ts
import { tool } from "@openai/agents";
import { taskCreateSchema } from "@/tasks/domain/tasksEntity.js";
import { tasksService } from "@/tasks/services/tasksService.js";

export const createTasksTool = tool({
  name: 'createTasks',
  description: 'Creates daily tasks or updates task list based on user input',
  parameters: taskCreateSchema,  // Zod schema from domain entity
  async execute(input) {
    console.log("createTasksTool called with:", input);
    // Call service layer
    return tasksService.create(input);
  }
});
```

### Example: Tool with Complex Logic

```typescript
// backend/src/tasks/model/gateway/tasksTools.ts
export const similarityMatchTool = tool({
  name: 'similarityMatch',
  description: 'Finds tasks that match user input based on text similarity',
  parameters: z.object({
    allTasks: z.array(z.any()),
    search_query: z.string(),
    max_results: z.number().optional().default(3),
    min_similarity: z.number().optional().default(0.3)
  }),
  async execute(input) {
    // Complex similarity calculation
    const tasksWithSimilarity = input.allTasks.map(task => {
      const similarity = calculateSimilarity(input.search_query, task.title);
      return { ...task, similarity_score: similarity };
    });
    
    const matches = tasksWithSimilarity
      .filter(task => task.similarity_score >= input.min_similarity)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, input.max_results);
    
    return {
      matches,
      total_tasks: input.allTasks.length,
      message: `Found ${matches.length} matching task(s)`
    };
  }
});
```

### Tool Best Practices

1. **Clear Descriptions**: The agent uses the description to decide when to call the tool
2. **Type Safety**: Always use Zod schemas for parameters
3. **Error Handling**: Handle errors gracefully and return meaningful messages
4. **Logging**: Log tool calls for debugging
5. **Idempotency**: Make tools safe to call multiple times when possible

---

## Agent-as-Tool Pattern

**Agents can be used as tools for other agents!** This enables:
- Specialized agents for specific domains
- Separation of concerns
- Reusable agent components

### Step 1: Create the Specialized Agent

```typescript
// backend/src/tasks/model/gateway/tasksAgent.ts
import { Agent, setDefaultOpenAIKey } from "@openai/agents";
import { createTasksTool, getAllTasksTool, updateTaskTool } from "./tasksTools.js";
import { system_prompt_tasks_agent } from "@/tasks/utils/systemPrompts.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set');
}
setDefaultOpenAIKey(apiKey);

export const tasksAgent = new Agent({
  name: 'TasksAgent',
  instructions: system_prompt_tasks_agent,  // Specialized instructions for tasks
  model: 'gpt-4o',
  tools: [createTasksTool, getAllTasksTool, updateTaskTool],
});
```

### Step 2: Convert Agent to Tool

```typescript
// Same file: tasksAgent.ts
export const tasksAgentTool = tasksAgent.asTool({
  toolName: 'tasks_agent_create_task',
  toolDescription: 'Manages daily tasks including creating, retrieving, and updating tasks. Format: "user_id: [ID] | request: [task description]"'
});
```

### Step 3: Use in Parent Agent

```typescript
// backend/src/messages/model/gateway/messagesAgent.ts
import { tasksAgentTool } from "@/tasks/model/gateway/tasksAgent.js";

export const moodyAgent = new Agent({
  name: 'Moody',
  instructions: system_prompt_main_moody,
  model: 'gpt-4o',
  tools: [getTimeTool, tasksAgentTool, moodAgentTool],  // Agent as tool!
});
```

### How It Works

1. User asks: "Remind me to call mom tomorrow"
2. Main agent receives message and decides to call `tasksAgentTool`
3. Tasks agent receives input: `"user_id: user_123 | request: Remind me to call mom tomorrow"`
4. Tasks agent processes request and calls its own tools (`createTasksTool`)
5. Tasks agent formats response
6. Main agent receives tasks agent response
7. Main agent formats final user-friendly message

### Benefits

- **Specialization**: Each agent focuses on one domain
- **Complexity Management**: Main agent doesn't need to know task details
- **Reusability**: Tasks agent can be used by multiple parent agents
- **Better Prompts**: Each agent has focused, domain-specific instructions

---

## Message Formatting

The agentSDK uses specific message types. You need to convert between:
- **Database entities** (stored in DB)
- **AgentInputItem[]** (input to agent)
- **AgentOutputItem[]** (output from agent)

### Formatting Messages FOR Agent (DB → AgentSDK)

```typescript
// backend/src/messages/utils/openaiMessageFormatter.ts
import { user, system, assistant } from '@openai/agents';
import type { AgentInputItem } from '@openai/agents';

export const formatMessagesForAgent = (
  messages: MessageCreateEntityType[]
): AgentInputItem[] => {
  return messages.map(msg => {
    switch (msg.role) {
      case "system":
        return system(msg.content || "");
      
      case "user":
        return user(msg.content || "");
      
      case "assistant":
        return assistant(msg.content || "");
      
      default:
        return user(msg.content || "");
    }
  });
};
```

### Formatting Messages FROM Agent (AgentSDK → DB)

```typescript
export const formatAgentMessagesToEntity = (
  agentMessages: any[], 
  user_id: string
): MessageCreateEntityType[] => {
  return agentMessages.map(msg => {
    let role: "system" | "user" | "assistant" | "tool" = "assistant";
    let content = "";
    let name: string | undefined;
    let args: string | undefined;
    
    // Handle function calls (agent calling a tool)
    if (msg.type === 'function_call') {
      role = "assistant";
      content = `Calling tool: ${msg.name}`;
      name = msg.name;
      args = msg.arguments;
    }
    
    // Handle function call results (tool response)
    else if (msg.type === 'function_call_result') {
      role = "tool";
      content = typeof msg.output === 'string' 
        ? msg.output 
        : (msg.output?.text || JSON.stringify(msg.output));
      name = msg.name;
    }
    
    // Handle regular messages
    else if ('role' in msg) {
      role = msg.role as "system" | "user" | "assistant" | "tool";
      
      if ('content' in msg) {
        if (typeof msg.content === 'string') {
          content = msg.content;
        } else if (Array.isArray(msg.content)) {
          // Extract text from content array
          const textContent = msg.content
            .filter((c: any) => c.type === 'output_text' || c.type === 'input_text')
            .map((c: any) => c.text)
            .join('');
          content = textContent;
        } else {
          content = JSON.stringify(msg.content);
        }
      }
    }
    
    const messageEntity: MessageCreateEntityType = {
      user_id,
      role,
      content,
      ...(name && { name }),
      ...(args && { arguments: args }),
    };

    return messageEntity;
  });
};
```

**Key Message Types to Handle:**
1. `function_call`: Agent is calling a tool (store as `assistant` with `name` and `arguments`)
2. `function_call_result`: Tool has returned a result (store as `tool` with `name`)
3. Regular messages: Standard user/assistant/system messages

---

## Tool Execution Flow

### Complete Flow Example

Let's trace what happens when a user says: **"Remind me to call mom tomorrow at 3pm"**

#### Step 1: User Sends Message
```typescript
// Frontend
POST /api/messages
{
  "role": "user",
  "user_id": "user_123",
  "content": "Remind me to call mom tomorrow at 3pm"
}
```

#### Step 2: Backend Receives & Saves User Message
```typescript
// messagesService.create()
const userMessage = await messagesRepository.create({
  role: "user",
  user_id: "user_123",
  content: "Remind me to call mom tomorrow at 3pm"
});
```

#### Step 3: Load Conversation History
```typescript
const allUserMessages = await messagesRepository.getAll("user_123");
// Returns: [previous messages...]
```

#### Step 4: Format Messages for Agent
```typescript
const formattedMessages = formatMessagesForAgent(allUserMessages);
// Converts to: [user("..."), assistant("..."), ...]
```

#### Step 5: Run Agent
```typescript
const newOutputItems = await runMoodyAgent(formattedMessages, "user_123");
```

**Inside `runMoodyAgent`:**
```typescript
export const runMoodyAgent = async (
  messages: AgentInputItem[], 
  userId: string
): Promise<AgentOutputItem[]> => {
  // Inject user context
  const userContextMessage = system(
    `CURRENT USER CONTEXT:\n- user_id: "${userId}"\n\nIMPORTANT: When creating tasks, you MUST use this exact user_id value.`
  );
  
  const messagesWithContext = [userContextMessage, ...messages];
  
  // Execute agent
  const result = await run(moodyAgent, messagesWithContext);
  return result.output;
};
```

#### Step 6: Agent Decides to Call Tool

Agent analyzes the message and decides to call `tasksAgentTool`:

**Agent Output Items:**
```javascript
[
  {
    type: 'function_call',
    name: 'tasks_agent_create_task',
    arguments: '{"user_id": "user_123", "request": "Remind me to call mom tomorrow at 3pm"}'
  },
  // ... tool execution happens here ...
  {
    type: 'function_call_result',
    name: 'tasks_agent_create_task',
    output: {
      text: "Task 'Call mom' has been created successfully for tomorrow at 3pm"
    }
  },
  {
    role: 'assistant',
    content: "I'll remind you to call mom tomorrow at 3pm! ✅"
  }
]
```

#### Step 7: Tasks Agent Processes Request

The `tasksAgentTool` internally:
1. Receives input: `"user_id: user_123 | request: Remind me to call mom tomorrow at 3pm"`
2. Tasks agent parses the request
3. Tasks agent calls `createTasksTool` with:
   ```json
   {
     "user_id": "user_123",
     "title": "Call mom",
     "status": "todo",
     "time": "2025-10-24T15:00:00.000Z",
     "reminder": null
   }
   ```
4. `createTasksTool.execute()` calls `tasksService.create()`
5. Task is saved to database
6. Tool returns created task object
7. Tasks agent formats response

#### Step 8: Format Agent Output to DB Entities

```typescript
const newMessages = formatAgentMessagesToEntity(newOutputItems, "user_123");
```

Results in:
```javascript
[
  {
    role: "assistant",
    content: "Calling tool: tasks_agent_create_task",
    name: "tasks_agent_create_task",
    arguments: '{"user_id": "user_123", "request": "..."}'
  },
  {
    role: "tool",
    content: "Task 'Call mom' has been created successfully...",
    name: "tasks_agent_create_task"
  },
  {
    role: "assistant",
    content: "I'll remind you to call mom tomorrow at 3pm! ✅"
  }
]
```

#### Step 9: Save All Messages to Database

```typescript
let savedAssistantMessage;
for (const newMsg of newMessages) {
  savedAssistantMessage = await messagesRepository.create(newMsg);
}
```

#### Step 10: Return to Frontend

```typescript
return [userMessage, savedAssistantMessage];  // Last assistant message
```

---

## Complete Examples

### Example 1: Simple Direct Tool

**Tool: Get Current Time**

```typescript
// messagesTools.ts
export const getTimeTool = tool({
  name: 'get_current_time',
  description: 'Returns the current date and time',
  parameters: z.object({}),
  execute: async () => {
    return new Date().toString();
  }
});
```

**Usage:**
- User: "What time is it?"
- Agent calls `getTimeTool`
- Returns: "Tue Oct 23 2025 14:30:00 GMT-0700"
- Agent responds: "It's currently 2:30 PM"

### Example 2: Tool with Parameters

**Tool: Create Task**

```typescript
// tasksTools.ts
export const createTasksTool = tool({
  name: 'createTasks',
  description: 'Creates a new task',
  parameters: z.object({
    user_id: z.string(),
    title: z.string(),
    status: z.enum(["todo", "done"]),
    time: z.date().optional(),
  }),
  async execute(input) {
    return tasksService.create(input);
  }
});
```

**Usage:**
- User: "I need to buy groceries"
- Agent calls `createTasksTool({ user_id: "user_123", title: "Buy groceries", status: "todo" })`
- Tool creates task in database
- Agent responds: "I've added 'Buy groceries' to your task list"

### Example 3: Nested Agent (Agent-as-Tool)

**Tasks Agent Tool**

```typescript
// tasksAgent.ts
export const tasksAgent = new Agent({
  name: 'TasksAgent',
  instructions: system_prompt_tasks_agent,  // Detailed task-specific instructions
  model: 'gpt-4o',
  tools: [createTasksTool, getAllTasksTool, updateTaskTool, similarityMatchTool],
});

export const tasksAgentTool = tasksAgent.asTool({
  toolName: 'tasks_agent_create_task',
  toolDescription: 'Manages all task operations. Format: "user_id: [ID] | request: [request]"'
});
```

**Usage:**
- User: "Show me all my tasks"
- Main agent calls `tasksAgentTool` with: `"user_id: user_123 | request: Show me all my tasks"`
- Tasks agent:
  1. Calls `getAllTasksTool({ user_id: "user_123" })`
  2. Receives all tasks
  3. Formats response: "Here are your tasks: 1) Buy groceries, 2) Call mom..."
- Main agent receives formatted response and returns to user

### Example 4: Complex Tool with Multiple Steps

**Similarity Match Tool**

```typescript
export const similarityMatchTool = tool({
  name: 'similarityMatch',
  description: 'Finds tasks matching a search query',
  parameters: z.object({
    allTasks: z.array(z.any()),
    search_query: z.string(),
    max_results: z.number().optional().default(3),
  }),
  async execute(input) {
    // Calculate similarity scores
    const tasksWithSimilarity = input.allTasks.map(task => ({
      ...task,
      similarity_score: calculateSimilarity(input.search_query, task.title)
    }));
    
    // Filter and sort
    const matches = tasksWithSimilarity
      .filter(task => task.similarity_score >= 0.3)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, input.max_results);
    
    return { matches, message: `Found ${matches.length} matching tasks` };
  }
});
```

**Usage Flow:**
1. User: "Mark my grocery task as done"
2. Tasks agent calls `getAllTasksTool` to get all tasks
3. Tasks agent calls `similarityMatchTool` with search_query: "grocery"
4. Tool returns matching tasks with similarity scores
5. Tasks agent selects best match
6. Tasks agent calls `updateTaskTool` to mark as done
7. Tasks agent responds: "Done! I've marked 'Buy groceries' as completed ✅"

---

## Best Practices

### 1. System Prompts

**Do:**
- Be specific about when to use tools
- Provide examples of tool usage
- Include format requirements
- Set tone and behavior expectations

**Example:**
```typescript
export const system_prompt = `You are a task management assistant.

TOOL USAGE:
1. createTasksTool - Use when user wants to create a task
   Example: "I need to call mom" → call createTasksTool
   
2. getAllTasksTool - Use when user asks to see tasks
   Example: "Show me my tasks" → call getAllTasksTool

TONE: Friendly and helpful. Use emojis sparingly.`;
```

### 2. Tool Descriptions

**Do:**
- Clearly describe what the tool does
- Mention when to use it
- Include parameter hints in description

**Example:**
```typescript
description: 'Creates a new task. Use when user wants to add something to their to-do list. Requires user_id, title, and status.'
```

### 3. Error Handling

**In Tools:**
```typescript
async execute(input) {
  try {
    const result = await someService.operation(input);
    return result;
  } catch (error) {
    console.error('Tool error:', error);
    return {
      error: true,
      message: 'Failed to complete operation. Please try again.'
    };
  }
}
```

**In Services:**
```typescript
const create = async (message: MessageCreateEntityType) => {
  try {
    // ... agent execution ...
  } catch (error) {
    console.error('Agent execution error:', error);
    throw new Error('Failed to process message');
  }
};
```

### 4. Logging

**Log Tool Calls:**
```typescript
async execute(input) {
  console.log(`[${this.constructor.name}] Called with:`, input);
  const result = await operation(input);
  console.log(`[${this.constructor.name}] Result:`, result);
  return result;
}
```

### 5. Parameter Validation

**Use Zod Schemas:**
```typescript
parameters: z.object({
  user_id: z.string().min(1, "User ID is required"),
  title: z.string().min(1).max(200),
  status: z.enum(["todo", "done"]),
  time: z.date().optional(),
  reminder: z.number().positive().optional(),
})
```

### 6. Agent Organization

**Structure:**
- One agent per domain (tasks, mood, etc.)
- Specialized agents for complex operations
- Main agent coordinates between specialized agents

### 7. Message Storage

**Store Everything:**
- User messages
- Assistant responses
- Tool calls (function_call type)
- Tool results (function_call_result type)

This enables:
- Full conversation replay
- Debugging
- Conversation context
- Analytics

### 8. User Context Injection

**Inject user context:**
```typescript
const userContextMessage = system(
  `CURRENT USER CONTEXT:\n- user_id: "${userId}"\n\nIMPORTANT: Always use this user_id.`
);

const messagesWithContext = [userContextMessage, ...messages];
```

---

## Troubleshooting

### Issue: Agent Not Calling Tools

**Possible Causes:**
1. Tool description is unclear
2. System prompt doesn't instruct tool usage
3. Tool parameters don't match what agent expects

**Solutions:**
- Improve tool descriptions
- Add explicit examples in system prompt
- Check tool parameter schemas
- Test tool independently

### Issue: Tool Execution Errors

**Check:**
- Tool execute function has proper error handling
- Parameters match Zod schema
- Service layer is working correctly
- Database connections are valid

**Debug:**
```typescript
async execute(input) {
  console.log('Tool input:', JSON.stringify(input, null, 2));
  try {
    const result = await operation(input);
    console.log('Tool result:', result);
    return result;
  } catch (error) {
    console.error('Tool error:', error);
    throw error;  // Or return error object
  }
}
```

### Issue: Agent Returns Wrong Format

**Check:**
- Message formatting functions handle all message types
- Function call and function call result types are handled
- Content extraction works for all content formats

**Test Formatting:**
```typescript
const testMessages = [
  { type: 'function_call', name: 'test_tool', arguments: '{}' },
  { type: 'function_call_result', name: 'test_tool', output: { text: 'result' } },
  { role: 'assistant', content: 'Hello' }
];

const formatted = formatAgentMessagesToEntity(testMessages, 'user_123');
console.log(formatted);
```

### Issue: Nested Agent Not Working

**Check:**
- Parent agent has the agent-as-tool in its tools array
- Agent tool description is clear
- Input format matches what child agent expects
- Child agent's tools are properly defined

### Issue: Conversation Context Lost

**Ensure:**
- All messages are saved to database
- Message history is loaded correctly
- Messages are formatted in correct order
- System messages are preserved

### Common Errors

**Error: "Agent did not produce any response"**
- Agent may have hit an error
- Check agent execution logs
- Verify API key is valid
- Check tool execution errors

**Error: "OPENAI_API_KEY is not set"**
- Set environment variable
- Restart server after setting
- Verify `.env` file is loaded

**Error: "Tool validation failed"**
- Check parameter types match Zod schema
- Verify required parameters are provided
- Check for type mismatches

---

## Additional Resources

### OpenAI Agents SDK Documentation
- Official docs: https://github.com/openai/agents
- Package: `@openai/agents` on npm

### Related Files in This Project
- `backend/src/messages/model/gateway/messagesAgent.ts` - Main agent
- `backend/src/messages/model/gateway/messagesGateway.ts` - Agent execution
- `backend/src/messages/utils/openaiMessageFormatter.ts` - Message conversion
- `backend/src/tasks/model/gateway/tasksAgent.ts` - Tasks agent
- `backend/src/tasks/model/gateway/tasksTools.ts` - Task tools
- `backend/src/moodLog/model/gateway/moodAgent.ts` - Mood agent

### System Prompts
- `backend/src/messages/utils/systemPrompts.ts` - Main agent prompt
- `backend/src/tasks/utils/systemPrompts.ts` - Tasks agent prompt
- `backend/src/moodLog/utils/systemPrompts.ts` - Mood agent prompt

---

## Summary

This guide covers:
1. ✅ Setting up OpenAI Agents SDK
2. ✅ Creating agents with instructions and tools
3. ✅ Creating tools with Zod schemas
4. ✅ Using agents as tools (nested agents)
5. ✅ Formatting messages between DB and AgentSDK
6. ✅ Understanding the complete execution flow
7. ✅ Best practices and troubleshooting

The key to a successful AI chat with tool calling is:
- **Clear instructions** for when to use tools
- **Well-described tools** that agents can understand
- **Proper message formatting** to maintain context
- **Error handling** for robustness
- **Modular architecture** for maintainability

Happy building! 🚀


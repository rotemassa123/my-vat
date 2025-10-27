import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './Controllers/chat.controller';
import { ChatService } from './Services/chat.service';
import { MCPQueryProcessor } from './Services/mcp-query-processor.service';
import { OpenAIService } from './Services/openai-assistant.service';
import { ThreadCacheService } from './Services/thread-cache.service';
import { UserProfileService } from './Services/user-profile.service';
import { ConfigService } from '@nestjs/config';

// Mock OpenAI service
jest.mock('./Services/openai-assistant.service');
jest.mock('./Services/mcp-query-processor.service');

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        ChatService,
        {
          provide: MCPQueryProcessor,
          useValue: {
            processQuery: jest.fn().mockResolvedValue({ mockData: 'test' }),
          },
        },
        {
          provide: OpenAIService,
          useValue: {
            createThread: jest.fn().mockResolvedValue('mock-thread-id'),
            processMessage: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ThreadCacheService,
          useValue: {
            getUserThread: jest.fn().mockResolvedValue('mock-thread-id'),
            isFirstMessage: jest.fn().mockReturnValue(false),
            markFirstMessageComplete: jest.fn(),
          },
        },
        {
          provide: UserProfileService,
          useValue: {
            getUserProfile: jest.fn().mockResolvedValue({
              userId: 'test-user',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                OPENAI_API_KEY: 'test-key',
                OPENAI_ASSISTANT_ID: 'test-assistant-id',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process a message', async () => {
    const mockMessage = { message: 'Hello, how can I help?' };
    const mockUserId = 'test-user-id';
    
    const result = await controller.sendMessage(mockMessage, mockUserId);
    
    expect(result).toBeDefined();
    expect(result.messageId).toBeDefined();
    expect(result.streamUrl).toBeDefined();
    expect(result.streamUrl).toContain('/chat/stream/');
  });
});

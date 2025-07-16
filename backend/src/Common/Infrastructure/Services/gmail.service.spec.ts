import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GmailService } from './gmail.service';

describe('GmailService', () => {
  let service: GmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GmailService>(GmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw error when missing credentials', () => {
      mockConfigService.get.mockReturnValue(undefined);
      
      expect(() => {
        new GmailService(configService);
      }).toThrow('Missing required Google OAuth credentials in environment variables');
    });
  });

  describe('createEmailMessage', () => {
    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          GOOGLE_CLIENT_ID: 'test-client-id',
          GOOGLE_CLIENT_SECRET: 'test-client-secret',
          GOOGLE_REDIRECT_URI: 'http://localhost:8000/callback',
          GOOGLE_REFRESH_TOKEN: 'test-refresh-token',
        };
        return config[key];
      });
    });

    it('should create email message with text content', () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message body',
      };

      const result = service['createEmailMessage'](emailOptions);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // Decode the base64url message to verify content
      const decodedMessage = Buffer.from(
        result.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      ).toString();
      
      expect(decodedMessage).toContain('To: test@example.com');
      expect(decodedMessage).toContain('Subject: Test Subject');
      expect(decodedMessage).toContain('Test message body');
    });

    it('should create email message with HTML content', () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test HTML message</h1>',
      };

      const result = service['createEmailMessage'](emailOptions);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // Decode the base64url message to verify content
      const decodedMessage = Buffer.from(
        result.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      ).toString();
      
      expect(decodedMessage).toContain('To: test@example.com');
      expect(decodedMessage).toContain('Subject: Test Subject');
      expect(decodedMessage).toContain('<h1>Test HTML message</h1>');
      expect(decodedMessage).toContain('Content-Type: text/html');
    });

    it('should create email message with CC and BCC', () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message body',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
      };

      const result = service['createEmailMessage'](emailOptions);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // Decode the base64url message to verify content
      const decodedMessage = Buffer.from(
        result.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      ).toString();
      
      expect(decodedMessage).toContain('To: test@example.com');
      expect(decodedMessage).toContain('Cc: cc@example.com');
      expect(decodedMessage).toContain('Bcc: bcc@example.com');
    });

    it('should create email message with attachments', () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message body',
        attachments: [
          {
            filename: 'test.txt',
            content: 'Test file content',
            contentType: 'text/plain',
          },
        ],
      };

      const result = service['createEmailMessage'](emailOptions);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      
      // Decode the base64url message to verify content
      const decodedMessage = Buffer.from(
        result.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      ).toString();
      
      expect(decodedMessage).toContain('To: test@example.com');
      expect(decodedMessage).toContain('Subject: Test Subject');
      expect(decodedMessage).toContain('Content-Type: multipart/mixed');
      expect(decodedMessage).toContain('filename="test.txt"');
      expect(decodedMessage).toContain('Content-Type: text/plain');
    });
  });
}); 
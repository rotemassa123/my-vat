import { Test, TestingModule } from '@nestjs/testing';
import { InvitationService } from './invitation.service';
import { IGmailService } from 'src/Common/ApplicationCore/Services/IGmailService';
import { IProfileRepository } from 'src/Common/ApplicationCore/Services/IProfileRepository';
import { SendInvitationRequest } from '../Requests/invitation.requests';
import { UserRole } from 'src/Common/consts/userRole';
import * as httpContext from 'express-http-context';

describe('InvitationService', () => {
  let service: InvitationService;
  let gmailService: IGmailService;
  let profileRepository: IProfileRepository;

  const mockGmailService = {
    sendBatchEmails: jest.fn(),
    sendEmail: jest.fn(),
  };

  const mockProfileRepository = {
    findAccountById: jest.fn(),
    findUserById: jest.fn(),
    findEntityById: jest.fn(),
    findUserByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: IGmailService,
          useValue: mockGmailService,
        },
        {
          provide: IProfileRepository,
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    gmailService = module.get<IGmailService>(IGmailService);
    profileRepository = module.get<IProfileRepository>(IProfileRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendInvitations', () => {
    const mockRequest: SendInvitationRequest = {
      emails: ['user1@example.com', 'user2@example.com'],
      entityId: '507f1f77bcf86cd799439011',
      personalMessage: 'Welcome to the team!',
    };

    const mockAccount = {
      _id: '507f1f77bcf86cd799439012',
      company_name: 'Test Account',
    };

    const mockInviter = {
      _id: '507f1f77bcf86cd799439013',
      fullName: 'John Doe',
    };

    const mockEntity = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Entity',
    };

    beforeEach(() => {
      // Mock http context
      jest.spyOn(httpContext, 'get').mockImplementation((key: string) => {
        if (key === 'account_id') return mockAccount._id;
        if (key === 'user_id') return mockInviter._id;
        return undefined;
      });

      // Mock repository methods
      mockProfileRepository.findAccountById.mockResolvedValue(mockAccount);
      mockProfileRepository.findUserById.mockResolvedValue(mockInviter);
      mockProfileRepository.findEntityById.mockResolvedValue(mockEntity);
    });

    it('should send batch invitations successfully', async () => {
      // Mock successful batch email sending
      mockGmailService.sendBatchEmails.mockResolvedValue([
        {
          success: true,
          messageId: 'msg_123',
          email: 'user1@example.com',
        },
        {
          success: true,
          messageId: 'msg_456',
          email: 'user2@example.com',
        },
      ]);

      const result = await service.sendInvitations(mockRequest);

      expect(result).toEqual({
        totalProcessed: 2,
        successful: 2,
        failed: 0,
        results: [
          {
            email: 'user1@example.com',
            success: true,
            message: 'Invitation sent successfully',
            messageId: 'msg_123',
          },
          {
            email: 'user2@example.com',
            success: true,
            message: 'Invitation sent successfully',
            messageId: 'msg_456',
          },
        ],
      });

      expect(mockGmailService.sendBatchEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            to: 'user1@example.com',
            subject: 'Invitation to join Test Account on MyVAT',
          }),
          expect.objectContaining({
            to: 'user2@example.com',
            subject: 'Invitation to join Test Account on MyVAT',
          }),
        ])
      );
    });

    it('should send emails to all users including existing ones', async () => {
      // Mock batch email sending for all users
      mockGmailService.sendBatchEmails.mockResolvedValue([
        {
          success: true,
          messageId: 'msg_123',
          email: 'user1@example.com',
        },
        {
          success: true,
          messageId: 'msg_456',
          email: 'user2@example.com',
        },
      ]);

      const result = await service.sendInvitations(mockRequest);

      expect(result).toEqual({
        totalProcessed: 2,
        successful: 2,
        failed: 0,
        results: [
          {
            email: 'user1@example.com',
            success: true,
            message: 'Invitation sent successfully',
            messageId: 'msg_123',
          },
          {
            email: 'user2@example.com',
            success: true,
            message: 'Invitation sent successfully',
            messageId: 'msg_456',
          },
        ],
      });

      // Should send emails to all users
      expect(mockGmailService.sendBatchEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            to: 'user1@example.com',
          }),
          expect.objectContaining({
            to: 'user2@example.com',
          }),
        ])
      );
    });

    it('should handle batch email failures', async () => {
      mockGmailService.sendBatchEmails.mockResolvedValue([
        {
          success: false,
          error: 'Invalid email address',
          email: 'user1@example.com',
        },
        {
          success: true,
          messageId: 'msg_456',
          email: 'user2@example.com',
        },
      ]);

      const result = await service.sendInvitations(mockRequest);

      expect(result).toEqual({
        totalProcessed: 2,
        successful: 1,
        failed: 1,
        results: [
          {
            email: 'user1@example.com',
            success: false,
            message: 'Invalid email address',
            errorCode: 'send_failed',
          },
          {
            email: 'user2@example.com',
            success: true,
            message: 'Invitation sent successfully',
            messageId: 'msg_456',
          },
        ],
      });
    });

    it('should send admin invitations without entity', async () => {
      // Clear previous mock calls
      mockProfileRepository.findEntityById.mockClear();
      
      const adminRequest: SendInvitationRequest = {
        emails: ['admin@example.com'],
        role: 'admin',
        personalMessage: 'Welcome to the admin team!',
      };

      // Mock successful batch email sending
      mockGmailService.sendBatchEmails.mockResolvedValue([
        {
          success: true,
          messageId: 'msg_123',
          email: 'admin@example.com',
        },
      ]);

      const result = await service.sendInvitations(adminRequest);

      expect(result).toEqual({
        totalProcessed: 1,
        successful: 1,
        failed: 0,
        results: [
          {
            email: 'admin@example.com',
            success: true,
            message: 'Invitation sent successfully',
            messageId: 'msg_123',
          },
        ],
      });

      // Should not call findEntityById for admin invitations
      expect(mockProfileRepository.findEntityById).not.toHaveBeenCalled();

      // Should send email with admin role
      expect(mockGmailService.sendBatchEmails).toHaveBeenCalledWith([
        expect.objectContaining({
          to: 'admin@example.com',
          subject: 'Invitation to join Test Account on MyVAT',
        }),
      ]);
    });
  });
}); 
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InvitationController } from './invitation.controller';
import { InvitationService } from '../Services/invitation.service';
import { SendInvitationRequest, SendInvitationResponse } from '../Requests/invitation.requests';
import { UserType } from 'src/Common/consts/userType';
import { RolesGuard } from 'src/Common/Infrastructure/guards/roles.guard';
import { IProfileRepository } from 'src/Common/ApplicationCore/Services/IProfileRepository';
import * as httpContext from 'express-http-context';

describe('InvitationController', () => {
  let controller: InvitationController;
  let invitationService: InvitationService;
  let profileRepository: IProfileRepository;

  const mockInvitationService = {
    sendInvitations: jest.fn(),
  };

  const mockProfileRepository = {
    createUser: jest.fn(),
    createUsersBatch: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('false'), // DISABLE_AUTH = false
  };

  const mockReflector = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationController],
      providers: [
        {
          provide: InvitationService,
          useValue: mockInvitationService,
        },
        {
          provide: IProfileRepository,
          useValue: mockProfileRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        RolesGuard,
      ],
    }).compile();

    controller = module.get<InvitationController>(InvitationController);
    invitationService = module.get<InvitationService>(InvitationService);
    profileRepository = module.get<IProfileRepository>(IProfileRepository);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendInvitations', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
      
      // Mock http context
      jest.spyOn(httpContext, 'get').mockImplementation((key: string) => {
        if (key === 'account_id') return '507f1f77bcf86cd799439012';
        return undefined;
      });

      // Mock profile repository
      mockProfileRepository.createUser.mockResolvedValue({ _id: 'new-user-id' });
      mockProfileRepository.createUsersBatch.mockResolvedValue([
        { _id: 'user-1', email: 'test@example.com' },
        { _id: 'user-2', email: 'user@example.com' }
      ]);
    });

    it('should send invitations successfully and create users in batch', async () => {
      const request: SendInvitationRequest = {
        emails: ['test@example.com'],
        entityId: '507f1f77bcf86cd799439011',
        personalMessage: 'Welcome to our team!'
      };

      const expectedResponse: SendInvitationResponse = {
        totalProcessed: 1,
        successful: 1,
        failed: 0,
        results: [
          {
            email: 'test@example.com',
            success: true,
            message: 'Invitation sent successfully'
          }
        ]
      };

      mockInvitationService.sendInvitations.mockResolvedValue(expectedResponse);

      const result = await controller.sendInvitations(request);

      expect(invitationService.sendInvitations).toHaveBeenCalledWith(request);
      expect(result).toEqual(expectedResponse);
      
      // Should use batch creation instead of individual creation
      expect(mockProfileRepository.createUsersBatch).toHaveBeenCalledWith([{
        fullName: 'test',
        email: 'test@example.com',
        userType: UserType.member,
        accountId: '507f1f77bcf86cd799439012',
        entityId: '507f1f77bcf86cd799439011',
        status: 'pending',
        profile_image_url: 'https://via.placeholder.com/150x150/cccccc/ffffff?text=User'
      }]);
      
      // Should not call individual creation
      expect(mockProfileRepository.createUser).not.toHaveBeenCalled();
    });

    it('should remove duplicate emails', async () => {
      const requestWithDuplicates: SendInvitationRequest = {
        emails: ['test@example.com', 'TEST@EXAMPLE.COM', 'user@example.com', 'test@example.com'],
        entityId: '507f1f77bcf86cd799439011'
      };

      const expectedResponse: SendInvitationResponse = {
        totalProcessed: 2,
        successful: 2,
        failed: 0,
        results: [
          {
            email: 'test@example.com',
            success: true,
            message: 'Invitation sent successfully'
          },
          {
            email: 'user@example.com',
            success: true,
            message: 'Invitation sent successfully'
          }
        ]
      };

      mockInvitationService.sendInvitations.mockResolvedValue(expectedResponse);

      const result = await controller.sendInvitations(requestWithDuplicates);

      // Should call service with deduplicated emails
      expect(invitationService.sendInvitations).toHaveBeenCalledWith({
        emails: ['test@example.com', 'user@example.com'],
        entityId: '507f1f77bcf86cd799439011'
      });

      // Should return correct totalProcessed count
      expect(result.totalProcessed).toBe(2);
      
      // Should create user records in batch for both unique emails
      expect(mockProfileRepository.createUsersBatch).toHaveBeenCalledWith([
        {
          fullName: 'test',
          email: 'test@example.com',
          userType: UserType.member,
          accountId: '507f1f77bcf86cd799439012',
          entityId: '507f1f77bcf86cd799439011',
          status: 'pending',
          profile_image_url: 'https://via.placeholder.com/150x150/cccccc/ffffff?text=User'
        },
        {
          fullName: 'user',
          email: 'user@example.com',
          userType: UserType.member,
          accountId: '507f1f77bcf86cd799439012',
          entityId: '507f1f77bcf86cd799439011',
          status: 'pending',
          profile_image_url: 'https://via.placeholder.com/150x150/cccccc/ffffff?text=User'
        }
      ]);
    });

    it('should create user records with correct status based on email success', async () => {
      const request: SendInvitationRequest = {
        emails: ['success@example.com', 'failed@example.com'],
        entityId: '507f1f77bcf86cd799439011'
      };

      const expectedResponse: SendInvitationResponse = {
        totalProcessed: 2,
        successful: 1,
        failed: 1,
        results: [
          {
            email: 'success@example.com',
            success: true,
            message: 'Invitation sent successfully'
          },
          {
            email: 'failed@example.com',
            success: false,
            message: 'Failed to send invitation'
          }
        ]
      };

      mockInvitationService.sendInvitations.mockResolvedValue(expectedResponse);

      await controller.sendInvitations(request);

      // Should create users in batch with correct statuses
      expect(mockProfileRepository.createUsersBatch).toHaveBeenCalledWith([
        {
          fullName: 'success',
          email: 'success@example.com',
          userType: UserType.member,
          accountId: '507f1f77bcf86cd799439012',
          entityId: '507f1f77bcf86cd799439011',
          status: 'pending',
          profile_image_url: 'https://via.placeholder.com/150x150/cccccc/ffffff?text=User'
        },
        {
          fullName: 'failed',
          email: 'failed@example.com',
          userType: UserType.member,
          accountId: '507f1f77bcf86cd799439012',
          entityId: '507f1f77bcf86cd799439011',
          status: 'failed to send request',
          profile_image_url: 'https://via.placeholder.com/150x150/cccccc/ffffff?text=User'
        }
      ]);
    });

    it('should fallback to individual creation if batch fails', async () => {
      const request: SendInvitationRequest = {
        emails: ['test@example.com'],
        entityId: '507f1f77bcf86cd799439011'
      };

      const expectedResponse: SendInvitationResponse = {
        totalProcessed: 1,
        successful: 1,
        failed: 0,
        results: [
          {
            email: 'test@example.com',
            success: true,
            message: 'Invitation sent successfully'
          }
        ]
      };

      mockInvitationService.sendInvitations.mockResolvedValue(expectedResponse);
      mockProfileRepository.createUsersBatch.mockRejectedValue(new Error('Batch creation failed'));

      await controller.sendInvitations(request);

      // Should try batch creation first
      expect(mockProfileRepository.createUsersBatch).toHaveBeenCalled();
      
      // Should fallback to individual creation
      expect(mockProfileRepository.createUser).toHaveBeenCalledWith({
        fullName: 'test',
        email: 'test@example.com',
        userType: UserType.member,
        accountId: '507f1f77bcf86cd799439012',
        entityId: '507f1f77bcf86cd799439011',
        status: 'pending',
        profile_image_url: 'https://via.placeholder.com/150x150/cccccc/ffffff?text=User'
      });
    });

    it('should handle service errors', async () => {
      const request: SendInvitationRequest = {
        emails: ['test@example.com'],
        entityId: '507f1f77bcf86cd799439011'
      };

      mockInvitationService.sendInvitations.mockRejectedValue(new Error('Service error'));

      await expect(controller.sendInvitations(request)).rejects.toThrow('Service error');
    });
  });
}); 
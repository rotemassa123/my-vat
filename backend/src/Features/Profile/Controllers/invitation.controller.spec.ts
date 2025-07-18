import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InvitationController } from './invitation.controller';
import { InvitationService } from '../Services/invitation.service';
import { SendInvitationRequest, SendInvitationResponse } from '../Requests/invitation.requests';
import { UserType } from 'src/Common/consts/userType';
import { RolesGuard } from 'src/Common/Infrastructure/guards/roles.guard';

describe('InvitationController', () => {
  let controller: InvitationController;
  let invitationService: InvitationService;

  const mockInvitationService = {
    sendInvitations: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendInvitations', () => {
    it('should send invitations successfully', async () => {
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
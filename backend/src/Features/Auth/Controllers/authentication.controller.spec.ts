import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from 'src/Common/ApplicationCore/Features/password.service';
import { IProfileRepository } from 'src/Common/ApplicationCore/Services/IProfileRepository';
import { UnauthorizedException } from '@nestjs/common';
import { UserType } from 'src/Common/consts/userType';
import { ConfigService } from '@nestjs/config';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let jwtService: JwtService;
  let passwordService: PasswordService;
  let userService: IProfileRepository;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockPasswordService = {
    comparePassword: jest.fn(),
  };

  const mockUserService = {
    findUserByEmail: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        { provide: JwtService, useValue: mockJwtService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: IProfileRepository, useValue: mockUserService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
    jwtService = module.get<JwtService>(JwtService);
    passwordService = module.get<PasswordService>(PasswordService);
    userService = module.get<IProfileRepository>(IProfileRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    const mockRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      cookie: jest.fn(),
    };

    it('should reject login for pending users', async () => {
      const pendingUser = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Test User',
        email: 'test@example.com',
        hashedPassword: 'hashedPassword',
        userType: UserType.member,
        accountId: '507f1f77bcf86cd799439012',
        entityId: '507f1f77bcf86cd799439013',
        status: 'pending',
      };

      mockUserService.findUserByEmail.mockResolvedValue(pendingUser);

      await expect(
        controller.signIn(mockRequest, mockResponse as any)
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.comparePassword).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should allow login for active users', async () => {
      const activeUser = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Test User',
        email: 'test@example.com',
        hashedPassword: 'hashedPassword',
        userType: UserType.member,
        accountId: '507f1f77bcf86cd799439012',
        entityId: '507f1f77bcf86cd799439013',
        status: 'active',
      };

      const mockToken = 'mock.jwt.token';
      const mockPayload = {
        userId: activeUser._id,
        fullName: activeUser.fullName,
        userType: activeUser.userType,
        accountId: activeUser.accountId,
        entityId: activeUser.entityId,
      };

      mockUserService.findUserByEmail.mockResolvedValue(activeUser);
      mockPasswordService.comparePassword.mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue(mockToken);
      mockUserService.updateUser.mockResolvedValue(undefined);

      const result = await controller.signIn(mockRequest, mockResponse as any);

      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(mockPayload);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(activeUser._id, {
        last_login: expect.any(Date),
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith('auth_token', mockToken, expect.any(Object));
      expect(result).toEqual({
        _id: activeUser._id,
        fullName: activeUser.fullName,
        userType: activeUser.userType,
        accountId: activeUser.accountId,
        entityId: activeUser.entityId,
      });
    });

    it('should reject login for users with failed status', async () => {
      const failedUser = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Test User',
        email: 'test@example.com',
        hashedPassword: 'hashedPassword',
        userType: UserType.member,
        accountId: '507f1f77bcf86cd799439012',
        entityId: '507f1f77bcf86cd799439013',
        status: 'failed to send request',
      };

      mockUserService.findUserByEmail.mockResolvedValue(failedUser);

      await expect(
        controller.signIn(mockRequest, mockResponse as any)
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.comparePassword).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });
}); 
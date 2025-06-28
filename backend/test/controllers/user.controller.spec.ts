import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from '../../src/Features/Profile/Controllers/user.controller';
import { IProfileRepository } from '../../src/Common/ApplicationCore/Services/IProfileRepository';
import { PasswordService } from '../../src/Common/ApplicationCore/Features/password.service';
import { UserType } from '../../src/Common/consts/userType';

describe('UserController (Integration)', () => {
  let app: INestApplication;
  let profileRepository: IProfileRepository;
  let passwordService: PasswordService;

  const mockProfileRepository = {
    // Account methods
    findAccountById: jest.fn(),
    findAccountByEmail: jest.fn(),
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
    accountExists: jest.fn(),
    // User methods
    findUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    userExists: jest.fn(),
    // Entity methods
    findEntityById: jest.fn(),
    findEntitiesByAccountId: jest.fn(),
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
    entityExists: jest.fn(),
  };

  const mockPasswordService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: IProfileRepository,
          useValue: mockProfileRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    profileRepository = module.get<IProfileRepository>(IProfileRepository);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should get user by userId', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        userId: 123,
        fullName: 'John Doe',
        email: 'john@example.com',
        hashedPassword: 'hashed',
        userType: UserType.admin,
        accountId: '507f1f77bcf86cd799439012',
        status: 'active',
      };

      mockProfileRepository.findUserById.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/users?userId=123')
        .expect(200);

      expect(response.body).toEqual([mockUser]);
      expect(mockProfileRepository.findUserById).toHaveBeenCalledWith(123);
    });

    it('should return 400 when no userId provided', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(400);
    });

    it('should return 404 when user not found', async () => {
      mockProfileRepository.findUserById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/users?userId=999')
        .expect(404);
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        userId: 123,
        fullName: 'John Doe',
        email: 'john@example.com',
        hashedPassword: 'hashed',
        userType: UserType.admin,
        accountId: '507f1f77bcf86cd799439012',
        status: 'active',
      };

      mockProfileRepository.findUserById.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/users/123')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(mockProfileRepository.findUserById).toHaveBeenCalledWith(123);
    });

    it('should return 404 when user not found', async () => {
      mockProfileRepository.findUserById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/users/999')
        .expect(404);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const createUserData = {
        userId: 456,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        userType: UserType.member,
        accountId: '507f1f77bcf86cd799439012',
        phone: '+1234567890',
      };

      const hashedPassword = 'hashed_password123';
      const createdUser = {
        _id: '507f1f77bcf86cd799439013',
        userId: createUserData.userId,
        fullName: createUserData.fullName,
        email: createUserData.email,
        hashedPassword,
        userType: createUserData.userType,
        accountId: createUserData.accountId,
        phone: createUserData.phone,
        status: 'pending',
      };

      mockProfileRepository.userExists.mockResolvedValue(false);
      mockProfileRepository.accountExists.mockResolvedValue(true);
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockProfileRepository.createUser.mockResolvedValue(createdUser);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserData)
        .expect(201);

      expect(response.body).toEqual({ _id: '507f1f77bcf86cd799439013' });
      expect(mockProfileRepository.accountExists).toHaveBeenCalledWith(createUserData.accountId);
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(createUserData.password);
      expect(mockProfileRepository.createUser).toHaveBeenCalledWith({
        userId: createUserData.userId,
        fullName: createUserData.fullName,
        email: createUserData.email,
        hashedPassword,
        userType: createUserData.userType,
        accountId: createUserData.accountId,
        phone: createUserData.phone,
        profile_image_url: undefined,
      });
    });

    it('should return 400 when user already exists', async () => {
      const createUserData = {
        userId: 456,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        userType: UserType.member,
        accountId: '507f1f77bcf86cd799439012',
      };

      mockProfileRepository.userExists.mockResolvedValue(true);

      await request(app.getHttpServer())
        .post('/users')
        .send(createUserData)
        .expect(400);
    });

    it('should return 400 when account does not exist', async () => {
      const createUserData = {
        userId: 456,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        userType: UserType.member,
        accountId: 'nonexistent_account_id',
      };

      mockProfileRepository.userExists.mockResolvedValue(false);
      mockProfileRepository.accountExists.mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/users')
        .send(createUserData)
        .expect(400);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user', async () => {
      const userId = 123;
      const updateData = {
        fullName: 'John Updated',
        status: 'active',
      };

      const existingUser = {
        _id: '507f1f77bcf86cd799439011',
        userId,
        fullName: 'John Doe',
        email: 'john@example.com',
        status: 'pending',
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
      };

      mockProfileRepository.findUserById.mockResolvedValueOnce(existingUser);
      mockProfileRepository.updateUser.mockResolvedValue(true);
      mockProfileRepository.findUserById.mockResolvedValueOnce(updatedUser);

      const response = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedUser);
      expect(mockProfileRepository.updateUser).toHaveBeenCalledWith(userId, {
        fullName: updateData.fullName,
        email: undefined,
        userType: undefined,
        status: updateData.status,
        phone: undefined,
        profile_image_url: undefined,
      });
    });

    it('should update user with password hash', async () => {
      const userId = 123;
      const updateData = {
        fullName: 'John Updated',
        password: 'newpassword123',
      };

      const existingUser = {
        _id: '507f1f77bcf86cd799439011',
        userId,
        fullName: 'John Doe',
      };

      const hashedPassword = 'hashed_newpassword123';

      mockProfileRepository.findUserById.mockResolvedValueOnce(existingUser);
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockProfileRepository.updateUser.mockResolvedValue(true);
      mockProfileRepository.findUserById.mockResolvedValueOnce({ ...existingUser, ...updateData });

      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(updateData.password);
      expect(mockProfileRepository.updateUser).toHaveBeenCalledWith(userId, {
        fullName: updateData.fullName,
        email: undefined,
        userType: undefined,
        status: undefined,
        phone: undefined,
        profile_image_url: undefined,
        hashedPassword,
      });
    });

    it('should return 404 when user not found', async () => {
      mockProfileRepository.findUserById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/users/999')
        .send({ fullName: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      const userId = 123;
      const existingUser = { _id: '507f1f77bcf86cd799439011', userId };

      mockProfileRepository.findUserById.mockResolvedValue(existingUser);
      mockProfileRepository.deleteUser.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockProfileRepository.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should return 404 when user not found', async () => {
      mockProfileRepository.findUserById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/users/999')
        .expect(404);
    });
  });
}); 
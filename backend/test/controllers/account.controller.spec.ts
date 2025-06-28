import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AccountController } from '../../src/Features/Profile/Controllers/account.controller';
import { IProfileRepository } from '../../src/Common/ApplicationCore/Services/IProfileRepository';

describe('AccountController (Integration)', () => {
  let app: INestApplication;
  let profileRepository: IProfileRepository;

  const mockProfileRepository = {
    // Account methods
    findAccountById: jest.fn(),
    findAccountByEmail: jest.fn(),
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
    accountExists: jest.fn(),
    // User methods (not used in AccountController but required by interface)
    findUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    userExists: jest.fn(),
    // Entity methods (not used in AccountController but required by interface)
    findEntityById: jest.fn(),
    findEntitiesByAccountId: jest.fn(),
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
    entityExists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: IProfileRepository,
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    profileRepository = module.get<IProfileRepository>(IProfileRepository);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /accounts', () => {
    it('should get account by id', async () => {
      const mockAccount = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        account_type: 'individual',
        status: 'active',
        vat_settings: {
          default_currency: 'USD',
          vat_rate: 21,
          reclaim_threshold: 1000,
          auto_process: true,
        },
      };

      mockProfileRepository.findAccountById.mockResolvedValue(mockAccount);

      const response = await request(app.getHttpServer())
        .get('/accounts?id=507f1f77bcf86cd799439011')
        .expect(200);

      expect(response.body).toEqual([mockAccount]);
      expect(mockProfileRepository.findAccountById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should get account by email', async () => {
      const mockAccount = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        account_type: 'individual',
        status: 'active',
        vat_settings: {
          default_currency: 'USD',
          vat_rate: 21,
          reclaim_threshold: 1000,
          auto_process: true,
        },
      };

      mockProfileRepository.findAccountByEmail.mockResolvedValue(mockAccount);

      const response = await request(app.getHttpServer())
        .get('/accounts?email=test@example.com')
        .expect(200);

      expect(response.body).toEqual([mockAccount]);
      expect(mockProfileRepository.findAccountByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return 400 when no query params provided', async () => {
      await request(app.getHttpServer())
        .get('/accounts')
        .expect(400);
    });

    it('should return 404 when account not found', async () => {
      mockProfileRepository.findAccountById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/accounts?id=507f1f77bcf86cd799439011')
        .expect(404);
    });
  });

  describe('GET /accounts/:id', () => {
    it('should get account by id', async () => {
      const mockAccount = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        account_type: 'individual',
        status: 'active',
        vat_settings: {
          default_currency: 'USD',
          vat_rate: 21,
          reclaim_threshold: 1000,
          auto_process: true,
        },
      };

      mockProfileRepository.findAccountById.mockResolvedValue(mockAccount);

      const response = await request(app.getHttpServer())
        .get('/accounts/507f1f77bcf86cd799439011')
        .expect(200);

      expect(response.body).toEqual(mockAccount);
    });

    it('should return 404 when account not found', async () => {
      mockProfileRepository.findAccountById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/accounts/507f1f77bcf86cd799439011')
        .expect(404);
    });
  });

  describe('POST /accounts', () => {
    it('should create a new account', async () => {
      const createAccountData = {
        email: 'new@example.com',
        account_type: 'business',
        company_name: 'Test Company',
        vat_settings: {
          default_currency: 'EUR',
          vat_rate: 20,
          reclaim_threshold: 500,
          auto_process: false,
        },
      };

      const createdAccount = {
        _id: '507f1f77bcf86cd799439012',
        ...createAccountData,
        status: 'active',
      };

      mockProfileRepository.findAccountByEmail.mockResolvedValue(null); // No existing account
      mockProfileRepository.createAccount.mockResolvedValue(createdAccount);

      const response = await request(app.getHttpServer())
        .post('/accounts')
        .send(createAccountData)
        .expect(201);

      expect(response.body).toEqual({ _id: '507f1f77bcf86cd799439012' });
      expect(mockProfileRepository.createAccount).toHaveBeenCalledWith(createAccountData);
    });

    it('should return 400 when account with email already exists', async () => {
      const createAccountData = {
        email: 'existing@example.com',
        vat_settings: {
          default_currency: 'USD',
          vat_rate: 21,
          reclaim_threshold: 1000,
          auto_process: true,
        },
      };

      mockProfileRepository.findAccountByEmail.mockResolvedValue({ _id: 'existing-id' });

      await request(app.getHttpServer())
        .post('/accounts')
        .send(createAccountData)
        .expect(400);
    });
  });

  describe('PUT /accounts/:id', () => {
    it('should update an account', async () => {
      const accountId = '507f1f77bcf86cd799439011';
      const updateData = {
        company_name: 'Updated Company',
        status: 'inactive',
      };

      const existingAccount = {
        _id: accountId,
        email: 'test@example.com',
        account_type: 'business',
        status: 'active',
      };

      const updatedAccount = {
        ...existingAccount,
        ...updateData,
      };

      mockProfileRepository.findAccountById.mockResolvedValueOnce(existingAccount);
      mockProfileRepository.updateAccount.mockResolvedValue(true);
      mockProfileRepository.findAccountById.mockResolvedValueOnce(updatedAccount);

      const response = await request(app.getHttpServer())
        .put(`/accounts/${accountId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedAccount);
      expect(mockProfileRepository.updateAccount).toHaveBeenCalledWith(accountId, updateData);
    });

    it('should return 404 when account not found', async () => {
      mockProfileRepository.findAccountById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/accounts/507f1f77bcf86cd799439011')
        .send({ company_name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /accounts/:id', () => {
    it('should delete an account', async () => {
      const accountId = '507f1f77bcf86cd799439011';
      const existingAccount = { _id: accountId, email: 'test@example.com' };

      mockProfileRepository.findAccountById.mockResolvedValue(existingAccount);
      mockProfileRepository.deleteAccount.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .delete(`/accounts/${accountId}`)
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockProfileRepository.deleteAccount).toHaveBeenCalledWith(accountId);
    });

    it('should return 404 when account not found', async () => {
      mockProfileRepository.findAccountById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/accounts/507f1f77bcf86cd799439011')
        .expect(404);
    });
  });
}); 
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { EntityController } from '../../src/Features/Profile/Controllers/entity.controller';
import { IProfileRepository } from '../../src/Common/ApplicationCore/Services/IProfileRepository';
import * as httpContext from 'express-http-context';

describe('EntityController (Integration)', () => {
  let app: INestApplication;

  const mockProfileRepository = {
    findAccountById: jest.fn(),
    findAccountByEmail: jest.fn(),
    createAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
    accountExists: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    userExistsByEmail: jest.fn(),
    findEntityById: jest.fn(),
    getEntitiesForAccount: jest.fn(),
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
    entityExists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntityController],
      providers: [
        {
          provide: IProfileRepository,
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    // Register http context middleware and attach account_id to each request
    app.use(httpContext.middleware);
    // Attach middleware to populate account_id in async context for each request
    app.use((req, _res, next) => {
      httpContext.set('account_id', 1);
      next();
    });
    await app.init();
    // Ensure tenant context default values outside requests (safety)
    httpContext.set('role', undefined);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
    httpContext.set('account_id', undefined);
    httpContext.set('role', undefined);
  });

  describe('GET /entities', () => {
    it('should get entities for current account', async () => {
      const mockEntities = [{ _id: '1', accountId: 1, name: 'Entity One' }];

      mockProfileRepository.getEntitiesForAccount.mockResolvedValue(mockEntities);

      const response = await request(app.getHttpServer())
        .get('/entities')
        .set({ 'X-Account-Id': '1' })
        .expect(200);

      expect(response.body).toEqual(mockEntities);
      expect(mockProfileRepository.getEntitiesForAccount).toHaveBeenCalled();
    });
  });

  describe('GET /entities/:id', () => {
    it('should get entity by id', async () => {
      const entityId = '507f1f77bcf86cd799439012';
      const mockEntity = { _id: entityId, name: 'Test Entity' };

      mockProfileRepository.findEntityById.mockResolvedValue(mockEntity);

      const response = await request(app.getHttpServer())
        .get(`/entities/${entityId}`)
        .expect(200);

      expect(response.body).toEqual(mockEntity);
    });

    it('should return 404 when entity not found', async () => {
      mockProfileRepository.findEntityById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/entities/999')
        .expect(404);
    });
  });

  describe('POST /entities', () => {
    it('should create a new entity', async () => {
      const createData = {
        name: 'New Entity',
      };

      const createdEntity = { _id: '507f1f77bcf86cd799439014', accountId: 1, ...createData };

      mockProfileRepository.accountExists.mockResolvedValue(true);
      mockProfileRepository.createEntity.mockResolvedValue(createdEntity);

      const response = await request(app.getHttpServer())
        .post('/entities')
        .set({ 'X-Account-Id': '1' })
        .send(createData)
        .expect(201);

      expect(response.body).toEqual({ _id: '507f1f77bcf86cd799439014' });
    });

    it('should return 400 when account does not exist', async () => {
      const createData = {
        name: 'New Entity',
      };

      mockProfileRepository.accountExists.mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/entities')
        .set({ 'X-Account-Id': '999' })
        .send(createData)
        .expect(400);
    });
  });

  describe('PUT /entities/:id', () => {
    it('should update an entity', async () => {
      const entityId = '507f1f77bcf86cd799439012';
      const updateData = { name: 'Updated Entity' };
      const existingEntity = { _id: entityId, name: 'Original' };
      const updatedEntity = { ...existingEntity, ...updateData };

      mockProfileRepository.findEntityById.mockResolvedValueOnce(existingEntity);
      mockProfileRepository.updateEntity.mockResolvedValue(true);
      mockProfileRepository.findEntityById.mockResolvedValueOnce(updatedEntity);

      const response = await request(app.getHttpServer())
        .put(`/entities/${entityId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedEntity);
    });

    it('should return 404 when entity not found', async () => {
      mockProfileRepository.findEntityById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/entities/999')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /entities/:id', () => {
    it('should delete an entity', async () => {
      const entityId = '507f1f77bcf86cd799439012';
      const existingEntity = { _id: entityId, name: 'Entity' };

      mockProfileRepository.findEntityById.mockResolvedValue(existingEntity);
      mockProfileRepository.deleteEntity.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .delete(`/entities/${entityId}`)
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });

    it('should return 404 when entity not found', async () => {
      mockProfileRepository.findEntityById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/entities/999')
        .expect(404);
    });
  });
}); 
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { EntityController } from '../../src/Features/Profile/Controllers/entity.controller';
import { IProfileRepository } from '../../src/Common/ApplicationCore/Services/IProfileRepository';

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
    userExists: jest.fn(),
    findEntityById: jest.fn(),
    findEntitiesByAccountId: jest.fn(),
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
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /entities', () => {
    it('should get entities by accountId', async () => {
      const accountId = '507f1f77bcf86cd799439011';
      const mockEntities = [{ _id: '1', accountId, name: 'Entity One' }];

      mockProfileRepository.findEntitiesByAccountId.mockResolvedValue(mockEntities);

      const response = await request(app.getHttpServer())
        .get(`/entities?accountId=${accountId}`)
        .expect(200);

      expect(response.body).toEqual(mockEntities);
    });

    it('should return 400 when no accountId provided', async () => {
      await request(app.getHttpServer())
        .get('/entities')
        .expect(400);
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
        accountId: '507f1f77bcf86cd799439011',
        name: 'New Entity',
      };

      const createdEntity = { _id: '507f1f77bcf86cd799439014', ...createData };

      mockProfileRepository.accountExists.mockResolvedValue(true);
      mockProfileRepository.createEntity.mockResolvedValue(createdEntity);

      const response = await request(app.getHttpServer())
        .post('/entities')
        .send(createData)
        .expect(201);

      expect(response.body).toEqual({ _id: '507f1f77bcf86cd799439014' });
    });

    it('should return 400 when account does not exist', async () => {
      const createData = {
        accountId: 'nonexistent',
        name: 'New Entity',
      };

      mockProfileRepository.accountExists.mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/entities')
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
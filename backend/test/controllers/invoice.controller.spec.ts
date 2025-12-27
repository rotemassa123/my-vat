import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InvoiceController } from '../../src/Features/Invoice/Controllers/invoice.controller';
import { IInvoiceRepository } from '../../src/Common/ApplicationCore/Services/IInvoiceRepository';
import { InvoiceFilterRequest, InvoicePaginationRequest } from '../../src/Features/Invoice/Requests/invoice.requests';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let mockInvoiceService: jest.Mocked<IInvoiceRepository>;

  const mockInvoiceData = {
    _id: '507f1f77bcf86cd799439011',
    account_id: 123,
    name: 'test-invoice.pdf',
    source_id: 'google-drive-id-123',
    size: 1024000,
    last_executed_step: 2,
    source: 'google_drive',
    content_type: 'application/pdf',
    status: 'completed',
    reason: null,
    claim_amount: 120.50,
    claim_submitted_at: new Date('2025-01-01T10:00:00Z'),
    claim_result_received_at: new Date('2025-01-01T11:00:00Z'),
    status_updated_at: new Date('2025-01-01T11:00:00Z'),
    created_at: new Date('2025-01-01T09:00:00Z'),
  };

  beforeEach(async () => {
    const mockServiceImplementation = {
      findInvoices: jest.fn(),
      findInvoiceById: jest.fn(),
      countInvoices: jest.fn(),
      findInvoicesWithExtraction: jest.fn(),
      findInvoiceExtractionById: jest.fn(),
      findInvoiceExtractionByFileId: jest.fn(),
      countInvoicesWithExtraction: jest.fn(),
      findCombinedInvoices: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: IInvoiceRepository,
          useValue: mockServiceImplementation,
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    mockInvoiceService = module.get(IInvoiceRepository);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInvoices', () => {
    it('should return invoices with metadata when filters match', async () => {
      const filters: InvoiceFilterRequest = { account_id: 123, status: 'completed' };
      const pagination: InvoicePaginationRequest = { limit: 10, skip: 0 };
      const mockInvoices = [mockInvoiceData];
      const mockTotal = 1;

      mockInvoiceService.findInvoices.mockResolvedValue(mockInvoices);
      mockInvoiceService.countInvoices.mockResolvedValue(mockTotal);

      const result = await controller.getInvoices(filters, pagination);

      expect(mockInvoiceService.findInvoices).toHaveBeenCalledWith(filters, 10, 0);
      expect(mockInvoiceService.countInvoices).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        data: mockInvoices,
        metadata: {
          total: mockTotal,
          limit: 10,
          skip: 0,
          count: mockInvoices.length,
        },
      });
    });

    it('should return empty array when no invoices match filters', async () => {
      const filters: InvoiceFilterRequest = { account_id: 999 };
      const pagination: InvoicePaginationRequest = { limit: 50, skip: 0 };

      mockInvoiceService.findInvoices.mockResolvedValue([]);
      mockInvoiceService.countInvoices.mockResolvedValue(0);

      const result = await controller.getInvoices(filters, pagination);

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
      expect(result.metadata.count).toBe(0);
    });

    it('should use default pagination when not provided', async () => {
      const filters: InvoiceFilterRequest = {};
      const pagination: InvoicePaginationRequest = {};

      mockInvoiceService.findInvoices.mockResolvedValue([]);
      mockInvoiceService.countInvoices.mockResolvedValue(0);

      await controller.getInvoices(filters, pagination);

      expect(mockInvoiceService.findInvoices).toHaveBeenCalledWith(filters, 50, 0);
    });

    it('should handle complex filter combinations', async () => {
      const filters: InvoiceFilterRequest = {
        account_id: 123,
        status: 'processing',
        source: 'google_drive',
        size_min: 1000,
        size_max: 5000000,
        name_contains: 'invoice',
        created_at_from: new Date('2025-01-01'),
        created_at_to: new Date('2025-01-31'),
      };
      const pagination: InvoicePaginationRequest = { limit: 25, skip: 50 };

      mockInvoiceService.findInvoices.mockResolvedValue([]);
      mockInvoiceService.countInvoices.mockResolvedValue(0);

      await controller.getInvoices(filters, pagination);

      expect(mockInvoiceService.findInvoices).toHaveBeenCalledWith(filters, 25, 50);
    });

    it('should throw error when service fails', async () => {
      const filters: InvoiceFilterRequest = {};
      const pagination: InvoicePaginationRequest = {};

      mockInvoiceService.findInvoices.mockRejectedValue(new Error('Database error'));

      await expect(controller.getInvoices(filters, pagination)).rejects.toThrow('Database error');
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice when found', async () => {
      const invoiceId = '507f1f77bcf86cd799439011';
      mockInvoiceService.findInvoiceById.mockResolvedValue(mockInvoiceData);

      const result = await controller.getInvoiceById(invoiceId);

      expect(mockInvoiceService.findInvoiceById).toHaveBeenCalledWith(invoiceId);
      expect(result).toEqual(mockInvoiceData);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      const invoiceId = 'nonexistent-id';
      mockInvoiceService.findInvoiceById.mockResolvedValue(null);

      await expect(controller.getInvoiceById(invoiceId)).rejects.toThrow(
        new NotFoundException(`Invoice with ID ${invoiceId} not found`)
      );
    });

    it('should throw error when service fails', async () => {
      const invoiceId = '507f1f77bcf86cd799439011';
      mockInvoiceService.findInvoiceById.mockRejectedValue(new Error('Database error'));

      await expect(controller.getInvoiceById(invoiceId)).rejects.toThrow('Database error');
    });
  });
}); 
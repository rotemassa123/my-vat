import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SummaryController } from '../../src/Features/Invoice/Controllers/summary.controller';
import { IInvoiceRepository } from '../../src/Common/ApplicationCore/Services/IInvoiceRepository';
import { SummaryFilterRequest, SummaryPaginationRequest } from '../../src/Features/Invoice/Requests/invoice.requests';
import { SummaryContent } from '../../src/Common/Infrastructure/DB/schemas/summary.schema';

describe('SummaryController', () => {
  let controller: SummaryController;
  let mockInvoiceService: jest.Mocked<IInvoiceRepository>;

  const mockSummaryData = {
    _id: '507f1f77bcf86cd799439012',
    account_id: 123,
    file_id: 'file-id-123',
    file_name: 'test-invoice.pdf',
    is_invoice: true,
    summary_content: {
      country: 'Germany',
      supplier: 'Test Company',
      date: '2024-12-15',
      id: 'INV-2024-001',
      description: 'Professional services',
      net_amount: '100.00',
      vat_amount: '20.50',
      vat_rate: '19%',
      currency: 'EUR'
    },
    processing_time_seconds: 2.5,
    success: true,
    error_message: null,
    created_at: new Date('2025-01-01T09:00:00Z'),
    analysis_result: { confidence: 0.95, classification: 'invoice' },
    extracted_data: { vendor: 'Test Company', amount: 120.50 },
    confidence_score: 0.95,
    processing_status: 'completed',
    vat_amount: 20.50,
    total_amount: 120.50,
    currency: 'EUR',
    vendor_name: 'Test Company Ltd',
    invoice_date: new Date('2024-12-15'),
    invoice_number: 'INV-2024-001',
  };

  beforeEach(async () => {
    const mockServiceImplementation = {
      findInvoices: jest.fn(),
      findInvoiceById: jest.fn(),
      countInvoices: jest.fn(),
      findSummaries: jest.fn(),
      findSummaryById: jest.fn(),
      findSummaryByFileId: jest.fn(),
      countSummaries: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryController],
      providers: [
        {
          provide: IInvoiceRepository,
          useValue: mockServiceImplementation,
        },
      ],
    }).compile();

    controller = module.get<SummaryController>(SummaryController);
    mockInvoiceService = module.get(IInvoiceRepository);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSummaries', () => {
    it('should return summaries with metadata when filters match', async () => {
      const filters: SummaryFilterRequest = { account_id: 123, is_invoice: true };
      const pagination: SummaryPaginationRequest = { limit: 10, skip: 0 };
      const mockSummaries = [mockSummaryData];
      const mockTotal = 1;

      mockInvoiceService.findSummaries.mockResolvedValue(mockSummaries);
      mockInvoiceService.countSummaries.mockResolvedValue(mockTotal);

      const result = await controller.getSummaries(filters, pagination);

      expect(mockInvoiceService.findSummaries).toHaveBeenCalledWith(filters, 10, 0);
      expect(mockInvoiceService.countSummaries).toHaveBeenCalledWith(filters);
      expect(result).toEqual({
        data: mockSummaries,
        metadata: {
          total: mockTotal,
          limit: 10,
          skip: 0,
          count: mockSummaries.length,
        },
      });
    });

    it('should throw error when service fails', async () => {
      const filters: SummaryFilterRequest = {};
      const pagination: SummaryPaginationRequest = {};

      mockInvoiceService.findSummaries.mockRejectedValue(new Error('Database error'));

      await expect(controller.getSummaries(filters, pagination)).rejects.toThrow('Database error');
    });
  });

  describe('getSummaryById', () => {
    it('should return summary when found', async () => {
      const summaryId = '507f1f77bcf86cd799439012';
      mockInvoiceService.findSummaryById.mockResolvedValue(mockSummaryData);

      const result = await controller.getSummaryById(summaryId);

      expect(mockInvoiceService.findSummaryById).toHaveBeenCalledWith(summaryId);
      expect(result).toEqual(mockSummaryData);
    });

    it('should throw NotFoundException when summary not found', async () => {
      const summaryId = 'nonexistent-id';
      mockInvoiceService.findSummaryById.mockResolvedValue(null);

      await expect(controller.getSummaryById(summaryId)).rejects.toThrow(
        new NotFoundException(`Summary with ID ${summaryId} not found`)
      );
    });
  });

  describe('getSummaryByFileId', () => {
    it('should return summary when found by file ID', async () => {
      const fileId = 'file-id-123';
      mockInvoiceService.findSummaryByFileId.mockResolvedValue(mockSummaryData);

      const result = await controller.getSummaryByFileId(fileId);

      expect(mockInvoiceService.findSummaryByFileId).toHaveBeenCalledWith(fileId);
      expect(result).toEqual(mockSummaryData);
    });

    it('should throw NotFoundException when summary not found by file ID', async () => {
      const fileId = 'nonexistent-file-id';
      mockInvoiceService.findSummaryByFileId.mockResolvedValue(null);

      await expect(controller.getSummaryByFileId(fileId)).rejects.toThrow(
        new NotFoundException(`Summary for file ID ${fileId} not found`)
      );
    });
  });
}); 
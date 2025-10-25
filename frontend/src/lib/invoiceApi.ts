import api from './api';
import type { Invoice, PaginatedResponse, InvoiceQueryParams, ApiResponse } from '../types/api';
import apiClient from './apiClient';

export class InvoiceApiService {
  /**
   * Fetch combined invoices with summary data (for bulk loading)
   */
  static async getCombinedInvoices(params: { 
    account_id: string;
    limit?: number;
    skip?: number;
  }): Promise<PaginatedResponse<Invoice>> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add required account_id
      queryParams.append('account_id', params.account_id.toString());
      
      // Add pagination params
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.skip) queryParams.append('skip', params.skip.toString());
      
      const response = await api.get<PaginatedResponse<Invoice>>(
        `/api/invoices/combined?${queryParams.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch combined invoices:', error);
      throw error;
    }
  }

  /**
   * Fetch invoices with pagination and filtering
   */
  static async getInvoices(params: InvoiceQueryParams = {}): Promise<PaginatedResponse<Invoice>> {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.skip) queryParams.append('skip', params.skip.toString());
      
      // Add sorting params
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      // Add filter params
      if (params.status?.length) {
        params.status.forEach(status => queryParams.append('status', status));
      }
      if (params.filename) queryParams.append('filename', params.filename);
      if (params.vat_scheme) queryParams.append('vat_scheme', params.vat_scheme);
      if (params.currency) queryParams.append('currency', params.currency);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.min_amount) queryParams.append('min_amount', params.min_amount.toString());
      if (params.max_amount) queryParams.append('max_amount', params.max_amount.toString());
      if (params.search) queryParams.append('search', params.search);
      
      const response = await api.get<PaginatedResponse<Invoice>>(
        `/api/invoices?${queryParams.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      throw error;
    }
  }

  /**
   * Get a single invoice by ID
   */
  static async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get<ApiResponse<Invoice>>(`/api/invoices/${id}`);
    return response.data.data;
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStats(filters: InvoiceQueryParams = {}) {
    const queryParams = new URLSearchParams();
    
    // Add filter params
    if (filters.status?.length) {
      filters.status.forEach(status => queryParams.append('status', status));
    }
    if (filters.filename) queryParams.append('filename', filters.filename);
    if (filters.vat_scheme) queryParams.append('vat_scheme', filters.vat_scheme);
    if (filters.currency) queryParams.append('currency', filters.currency);
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);
    if (filters.min_amount) queryParams.append('min_amount', filters.min_amount.toString());
    if (filters.max_amount) queryParams.append('max_amount', filters.max_amount.toString());
    if (filters.search) queryParams.append('search', filters.search);
    
    const response = await api.get(`/api/invoices/stats?${queryParams.toString()}`);
    return response.data.data;
  }

  /**
   * Export invoices to CSV
   */
  static async exportInvoices(filters: InvoiceQueryParams = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    // Add sorting params
    if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
    if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);
    
    // Add filter params
    if (filters.status?.length) {
      filters.status.forEach(status => queryParams.append('status', status));
    }
    if (filters.filename) queryParams.append('filename', filters.filename);
    if (filters.vat_scheme) queryParams.append('vat_scheme', filters.vat_scheme);
    if (filters.currency) queryParams.append('currency', filters.currency);
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);
    if (filters.min_amount) queryParams.append('min_amount', filters.min_amount.toString());
    if (filters.max_amount) queryParams.append('max_amount', filters.max_amount.toString());
    if (filters.search) queryParams.append('search', filters.search);
    
    const response = await api.get(`/api/invoices/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    
    return response.data;
  }
}

// Enhanced Invoice API functions using the new apiClient
export const invoiceApi = {
  // Get all invoices with optional filters
  getInvoices: async (filters?: InvoiceQueryParams): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get('/invoices', { params: filters });
    return response.data;
  },

  // Get single invoice by ID
  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  // Upload invoice file
  uploadInvoice: async (file: File, metadata?: Record<string, unknown>): Promise<Invoice> => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await apiClient.post('/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update invoice
  updateInvoice: async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    const response = await apiClient.put(`/invoices/${id}`, updates);
    return response.data;
  },

  // Delete invoice
  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  // Get invoice summary/analytics
  getSummary: async (filters?: InvoiceQueryParams): Promise<{
    totalAmount: number;
    totalVat: number;
    count: number;
    avgAmount: number;
  }> => {
    const response = await apiClient.get('/invoices/summary', { params: filters });
    return response.data;
  },

  // Download invoice file
  downloadInvoice: async (invoiceId: string): Promise<Blob> => {
    const response = await apiClient.get(`/files/download/${invoiceId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
}; 
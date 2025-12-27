import apiClient from './apiClient';
import type { ReportingQueryParams, ReportingResponse } from '../types/reporting';

export class ReportingApiService {
  static async getReportingData(params: ReportingQueryParams): Promise<ReportingResponse> {
    try {
      const response = await apiClient.get('/reporting/invoices', {
        params,
        // Timeout inherited from apiClient (60 seconds)
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reporting data:', error);
      throw error;
    }
  }

  static async getCacheStats(): Promise<{ size: number; keys: string[] }> {
    try {
      const response = await apiClient.get('/reporting/cache/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
      throw error;
    }
  }
}

export const reportingApi = {
  getReportingData: (params: ReportingQueryParams) => 
    ReportingApiService.getReportingData(params),
  
  getCacheStats: () => 
    ReportingApiService.getCacheStats(),
}; 
import apiClient from './apiClient';
import type {
  Widget,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  WidgetDataResponse,
} from '../types/widget';

export const widgetApi = {
  // Get all widgets for the current user (with pre-loaded data)
  getAll: async (): Promise<Widget[]> => {
    try {
      const response = await apiClient.get<Widget[]>('/widgets');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch widgets');
    }
  },

  // Get a single widget by ID
  getById: async (id: string): Promise<Widget> => {
    try {
      const response = await apiClient.get<Widget>(`/widgets/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Widget not found');
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this widget');
      }
      throw new Error('Failed to fetch widget');
    }
  },

  // Create a new widget
  create: async (request: CreateWidgetRequest): Promise<Widget> => {
    try {
      const response = await apiClient.post<Widget>('/widgets', request);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Failed to create widget';
        throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to create widgets');
      }
      throw new Error('An error occurred while creating the widget');
    }
  },

  // Update an existing widget
  update: async (id: string, request: UpdateWidgetRequest): Promise<Widget> => {
    try {
      const response = await apiClient.put<Widget>(`/widgets/${id}`, request);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Widget not found');
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this widget');
      }
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Failed to update widget';
        throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      }
      throw new Error('An error occurred while updating the widget');
    }
  },

  // Delete a widget
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/widgets/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Widget not found');
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this widget');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Failed to delete widget');
      }
      throw new Error('An error occurred while deleting the widget');
    }
  },

  // Get widget data (aggregated chart data)
  getData: async (id: string): Promise<WidgetDataResponse> => {
    try {
      const response = await apiClient.get<WidgetDataResponse>(`/widgets/${id}/data`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Widget not found');
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this widget data');
      }
      throw new Error('Failed to fetch widget data');
    }
  },
};


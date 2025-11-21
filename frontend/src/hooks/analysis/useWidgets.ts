import { useQuery, useMutation } from '@tanstack/react-query';
import { widgetApi } from '../../lib/widgetApi';
import { useWidgetStore } from '../../store/widgetStore';
import type {
  CreateWidgetRequest,
  UpdateWidgetRequest,
  WidgetDataResponse,
} from '../../types/widget';

/**
 * Note: For widget list, use useWidgetStore().widgets instead
 * Widgets are loaded on bootstrap and stored in Zustand
 */

/**
 * Hook to fetch widget data (aggregated chart data)
 */
export const useWidgetData = (widgetId: string | null) => {
  const { data, isLoading, isError, error, refetch } = useQuery<WidgetDataResponse, Error>({
    queryKey: ['widget-data', widgetId],
    queryFn: () => widgetApi.getData(widgetId!),
    enabled: !!widgetId, // Only fetch if widgetId is provided
    staleTime: 1000 * 30, // 30 seconds (as per plan)
  });

  return {
    data: data?.data || [],
    widgetType: data?.type,
    timestamp: data?.timestamp,
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Hook to create a new widget
 */
export const useCreateWidget = () => {
  const { addWidget } = useWidgetStore();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: (request: CreateWidgetRequest) => widgetApi.create(request),
    onSuccess: (newWidget) => {
      // Add to store
      addWidget(newWidget);
    },
    onError: (error) => {
      console.error('Failed to create widget:', error);
    },
  });

  return {
    createWidget: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  };
};

/**
 * Hook to update an existing widget
 */
export const useUpdateWidget = () => {
  const { updateWidget: updateWidgetInStore } = useWidgetStore();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateWidgetRequest }) =>
      widgetApi.update(id, request),
    onSuccess: (updatedWidget) => {
      // Update in store
      updateWidgetInStore(updatedWidget.id, updatedWidget);
    },
    onError: (error) => {
      console.error('Failed to update widget:', error);
    },
  });

  return {
    updateWidget: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  };
};

/**
 * Hook to delete a widget
 */
export const useDeleteWidget = () => {
  const { removeWidget } = useWidgetStore();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: (id: string) => widgetApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from store
      removeWidget(deletedId);
    },
    onError: (error) => {
      console.error('Failed to delete widget:', error);
    },
  });

  return {
    deleteWidget: mutateAsync,
    isLoading: isPending,
    isError,
    error,
  };
};


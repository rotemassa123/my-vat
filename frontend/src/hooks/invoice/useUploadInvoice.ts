import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '../../lib/invoiceApi';
import type { Invoice } from '../../types/api';

export const useUploadInvoice = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation<
    Invoice,
    Error,
    { file: File; metadata?: Record<string, any> }
  >({
    mutationFn: async ({ file, metadata }) => {
      return invoiceApi.uploadInvoice(file, metadata);
    },
    onSuccess: (newInvoice) => {
      // Invalidate and refetch invoice queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Optionally add to specific query cache
      queryClient.setQueryData(['invoice', newInvoice._id], newInvoice);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await mutateAsync({ 
          file,
          metadata: {
            originalName: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          }
        });
      } catch (error) {
        // Error is handled in onError callback
        console.error('File upload error:', error);
      }
    }
    // Clear the input
    event.target.value = '';
  };

  const uploadFile = async (file: File, metadata?: Record<string, any>) => {
    try {
      return await mutateAsync({ file, metadata });
    } catch (error) {
      throw error;
    }
  };

  return {
    uploadFile,
    handleFileUpload,
    isLoading: isPending,
    isError,
    error,
  };
}; 
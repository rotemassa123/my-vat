import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

export interface UploadProgress {
  id: string;
  file: File;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  fileUrl?: string;
}

interface UseMultiFileUploadOptions {
  entityId: string;
  onProgress?: (progressList: UploadProgress[]) => void;
  onComplete?: (results: UploadProgress[]) => void;
}

export function useMultiFileUpload({ entityId, onProgress, onComplete }: UseMultiFileUploadOptions) {
  const [progressList, setProgressList] = useState<UploadProgress[]>([]);

  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      // Initialize progress list
      const initialProgress: UploadProgress[] = files.map((file, idx) => ({
        id: `${file.name}-${idx}-${Date.now()}`,
        file,
        progress: 0,
        status: 'pending' as const,
      }));
      
      setProgressList(initialProgress);
      onProgress?.(initialProgress);

      // Create FormData with all files
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('entityId', entityId);

      // Helper to update progress
      const updateProgress = (fileIndex: number, progress: number, status?: UploadProgress['status'], error?: string, fileUrl?: string) => {
        setProgressList(prev => {
          const updated = [...prev];
          updated[fileIndex] = {
            ...updated[fileIndex],
            progress,
            status: status || updated[fileIndex].status,
            error,
            fileUrl,
          };
          onProgress?.(updated);
          return updated;
        });
      };

      try {
        // Set all to uploading
        files.forEach((_, idx) => updateProgress(idx, 0, 'uploading'));

        // Upload all files
        const response = await apiClient.post('/files/upload-multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              // Update all files with same progress (since it's one request)
              files.forEach((_, idx) => updateProgress(idx, percent, 'uploading'));
            }
          },
        });

        // Update with final results
        const results = response.data.uploads;
        results.forEach((result: any, idx: number) => {
          updateProgress(
            idx, 
            100, 
            result.status === 'completed' ? 'completed' : 'failed',
            result.error,
            result.fileUrl
          );
        });

        setProgressList(prev => {
          onComplete?.(prev);
          return prev;
        });

        return response.data;
      } catch (error: any) {
        // Mark all as failed
        files.forEach((_, idx) => updateProgress(idx, 0, 'failed', error.message));
        throw error;
      }
    },
  });

  return {
    uploadFiles: mutation.mutateAsync,
    progressList,
    isUploading: mutation.isPending,
    error: mutation.error,
    reset: () => {
      setProgressList([]);
      mutation.reset();
    },
  };
}

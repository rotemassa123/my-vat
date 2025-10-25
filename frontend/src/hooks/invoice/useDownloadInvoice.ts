import { useState } from 'react';
import { invoiceApi } from '../../lib/invoiceApi';

export const useDownloadInvoice = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const downloadFile = async (invoiceId: string, fileName: string) => {
    try {
      setIsDownloading(true);
      setDownloadError(null);
      
      // Download the file as a blob
      const blob = await invoiceApi.downloadInvoice(invoiceId);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'invoice';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const clearError = () => {
    setDownloadError(null);
  };

  return {
    downloadFile,
    isDownloading,
    downloadError,
    clearError,
  };
};

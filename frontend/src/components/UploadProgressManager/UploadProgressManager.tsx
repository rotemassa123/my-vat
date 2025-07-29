import React, { useEffect } from 'react';
import UploadProgressOverlay from '../UploadModal/UploadProgressOverlay';
import { useUploadContext } from '../../contexts/UploadContext';
import { useMultiFileUpload } from '../../hooks/upload/useMultiFileUpload';

const UploadProgressManager: React.FC = () => {
  const { 
    globalEntityId, 
    resetProgress, 
    pendingFiles, 
    setPendingFiles,
    setIsUploading
  } = useUploadContext();

  // Use the upload hook to manage progress
  const { 
    progressList: hookProgressList, 
    uploadFiles,
    isUploading: hookIsUploading,
    reset: hookReset 
  } = useMultiFileUpload({
    entityId: globalEntityId,
    onComplete: () => {
      setIsUploading(false);
      // Keep progress visible for a few seconds after completion
      setTimeout(() => {
        resetProgress();
      }, 3000);
    }
  });

  // Handle pending files
  useEffect(() => {
    if (pendingFiles.length > 0 && globalEntityId) {
      setIsUploading(true);
      uploadFiles(pendingFiles);
      setPendingFiles([]);
    }
  }, [pendingFiles, globalEntityId, uploadFiles, setPendingFiles, setIsUploading]);

  // Sync hook state with context
  useEffect(() => {
    setIsUploading(hookIsUploading);
  }, [hookIsUploading, setIsUploading]);

  const handleProgressClose = () => {
    resetProgress();
    hookReset();
  };

  return (
    <UploadProgressOverlay 
      progressList={hookProgressList}
      onClose={handleProgressClose}
    />
  );
};

export default UploadProgressManager; 
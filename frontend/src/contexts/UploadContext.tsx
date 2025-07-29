import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { UploadProgress } from '../hooks/upload/useMultiFileUpload';

interface UploadContextType {
  progressList: UploadProgress[];
  globalEntityId: string;
  setGlobalEntityId: React.Dispatch<React.SetStateAction<string>>;
  resetProgress: () => void;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

interface UploadProviderProps {
  children: ReactNode;
}

export const UploadProvider: React.FC<UploadProviderProps> = ({ children }) => {
  const [progressList, setProgressList] = useState<UploadProgress[]>([]);
  const [globalEntityId, setGlobalEntityId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const resetProgress = () => {
    setProgressList([]);
  };

  const value = {
    progressList,
    globalEntityId,
    setGlobalEntityId,
    resetProgress,
    isUploading,
    setIsUploading,
    pendingFiles,
    setPendingFiles,
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploadContext must be used within an UploadProvider');
  }
  return context;
}; 
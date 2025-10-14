import React, { useState, useRef } from 'react';
import { 
  Box, 
  Modal, 
  Typography, 
  IconButton, 
  MenuItem, 
  Select, 
  FormControl,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { 
  Close, 
  CloudUpload,
  CheckCircle,
} from '@mui/icons-material';
import { useAccountStore } from '../../store/accountStore';
import { useUploadContext } from '../../contexts/UploadContext';
import styles from './UploadModal.module.scss';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ open, onClose }) => {
  const { entities } = useAccountStore();
  const { setGlobalEntityId, setPendingFiles, isUploading } = useUploadContext();
  
  // State management
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remove local isUploading state - using global one

  // Event handlers
  const handleEntityChange = (event: SelectChangeEvent<string>) => {
    const entityId = event.target.value;
    setSelectedEntity(entityId);
    setGlobalEntityId(entityId);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
      setUploadError('');
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedEntity) {
      setUploadError('Please select an entity');
      return;
    }
    
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one file to upload');
      return;
    }
    
    setUploadError('');
    
    // Trigger upload through context
    setPendingFiles(selectedFiles);
    
    // Close modal immediately after starting upload
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowSuccess(false);
    setSelectedEntity('');
    setSelectedFiles([]);
    setUploadError('');
    onClose();
  };

  // Success state component
  const renderSuccessState = () => (
    <Box className={styles.modalContainer}>
      <Box className={styles.modalHeader}>
        <IconButton onClick={handleCloseModal} className={styles.closeButton}>
          <Close />
        </IconButton>
      </Box>

      <Box className={styles.successContent}>
        <Box className={styles.successIcon}>
          <CheckCircle sx={{ fontSize: 64, color: '#4CAF50' }} />
        </Box>
        
        <Typography variant="h5" className={styles.successTitle}>
          Files uploaded successfully!
        </Typography>
        
        <Typography variant="body1" className={styles.successSubtitle}>
          Your invoices have been processed and are ready for analysis.
        </Typography>
        
        <Button
          variant="contained"
          onClick={handleCloseModal}
          className={styles.successButton}
          size="large"
        >
          Done
        </Button>
      </Box>
    </Box>
  );

  return (
    <Modal open={open} onClose={handleCloseModal}>
      <Box>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
          style={{ display: 'none' }}
        />
        
        {showSuccess ? renderSuccessState() : (
          <Box className={styles.modalContainer}>
            <Box className={styles.modalHeader}>
              <Typography variant="h6" className={styles.modalTitle}>
                Upload Invoices
              </Typography>
              <IconButton onClick={handleCloseModal} className={styles.closeButton}>
                <Close />
              </IconButton>
            </Box>

            <Box className={styles.modalContent}>
            {/* Error Display */}
            {uploadError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {uploadError}
              </Alert>
            )}

            {/* Entity Selection */}
            <Box className={styles.formGroup}>
              <Typography className={styles.label}>
                Choose entity
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedEntity}
                  onChange={handleEntityChange}
                  className={styles.select}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) {
                      return "Select entity...";
                    }
                    const selectedEntityData = entities.find(entity => entity._id === value);
                    return selectedEntityData ? selectedEntityData.name : "Select entity...";
                  }}
                >
                  {entities.map((entity) => (
                    <MenuItem key={entity._id} value={entity._id}>
                      {entity.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* File Upload Section */}
            <Box className={styles.uploadSection}>
              <Box className={styles.uploadHeader}>
                <Typography className={styles.uploadLabel}>
                  Upload invoice files
                </Typography>
                {selectedFiles.length > 0 && (
                  <Typography className={styles.fileCount}>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </Typography>
                )}
              </Box>

              <Box 
                className={styles.dropZone}
                onClick={handleDropZoneClick}
              >
                <CloudUpload sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Drop your invoices here
                </Typography>
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  or click to browse files
                </Typography>
                {selectedFiles.length > 0 && !isUploading && (
                  <Box className={styles.selectedFiles}>
                    {selectedFiles.map((file, index) => (
                      <Typography key={index} variant="body2" color="primary">
                        {file.name}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>


            </Box>
          </Box>

          {/* Footer */}
          <Box className={styles.modalFooter}>
            <Button
              variant="contained"
              className={styles.uploadButton}
              size="large"
              onClick={handleUpload}
              disabled={isUploading || !selectedEntity || selectedFiles.length === 0}
              startIcon={isUploading ? <CircularProgress size={20} /> : undefined}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default UploadModal; 
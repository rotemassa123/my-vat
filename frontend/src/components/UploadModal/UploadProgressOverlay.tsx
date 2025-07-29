import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  ErrorOutline,
  Close,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import type { UploadProgress } from '../../hooks/upload/useMultiFileUpload';
import styles from './UploadProgressOverlay.module.scss';

interface UploadProgressOverlayProps {
  progressList: UploadProgress[];
  onClose?: () => void;
}

const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
  progressList,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (progressList.length === 0) return null;

  const completedCount = progressList.filter(p => p.status === 'completed').length;
  const failedCount = progressList.filter(p => p.status === 'failed').length;
  const uploadingCount = progressList.filter(p => p.status === 'uploading').length;
  const allCompleted = completedCount === progressList.length;
  const hasFailures = failedCount > 0;

  const overallProgress = progressList.reduce((sum, p) => sum + p.progress, 0) / progressList.length;

  return (
    <Box className={styles.overlay}>
      <Box className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <Box className={styles.headerLeft}>
          <Typography className={styles.title}>
            {uploadingCount > 0 ? `Uploading ${progressList.length} files...` :
             allCompleted ? `${completedCount} files uploaded` :
             hasFailures ? `${completedCount} uploaded, ${failedCount} failed` :
             'Upload complete'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            className={`${styles.overallProgress} ${
              allCompleted ? styles.completed : hasFailures ? styles.failed : ''
            }`}
          />
        </Box>
        <Box className={styles.headerRight}>
          <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
          {allCompleted && (
            <IconButton size="small" onClick={onClose}>
              <Close />
            </IconButton>
          )}
        </Box>
      </Box>

      {isExpanded && (
        <Box className={styles.filesList}>
          {progressList.map((progress) => (
            <Box key={progress.id} className={styles.fileItem}>
              <Box className={styles.fileHeader}>
                <Typography className={styles.fileName}>
                  {progress.file.name}
                </Typography>
                <Box className={styles.fileStatus}>
                  {progress.status === 'completed' && (
                    <CheckCircle sx={{ fontSize: 14, color: '#4CAF50' }} />
                  )}
                  {progress.status === 'failed' && (
                    <ErrorOutline sx={{ fontSize: 14, color: '#f44336' }} />
                  )}
                  {progress.status === 'uploading' && (
                    <CircularProgress size={14} />
                  )}
                  <Typography className={styles.filePercent}>
                    {progress.progress}%
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.progress}
                className={`${styles.fileProgress} ${
                  progress.status === 'completed' ? styles.completed :
                  progress.status === 'failed' ? styles.failed : ''
                }`}
              />
              {progress.error && (
                <Typography className={styles.errorText}>
                  {progress.error}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default UploadProgressOverlay;

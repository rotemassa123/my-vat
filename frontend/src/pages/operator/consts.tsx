import {
  CloudUpload as CloudUploadIcon,
  DriveFolderUpload as DriveFolderUploadIcon,
  Summarize as SummarizeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type { JobType } from '../../services/jobTriggerService';
import type { JobConfig } from './types';

export const INITIAL_LOADING_JOBS_STATE: Record<JobType, boolean> = {
  google_drive_discover: false,
  upload_to_cloud: false,
  summarize_invoices: false,
  check_claimability: false,
};

export const JOB_CONFIGS: JobConfig[] = [
  {
    type: 'google_drive_discover',
    label: 'Google Drive Discover',
    icon: <DriveFolderUploadIcon />,
  },
  {
    type: 'upload_to_cloud',
    label: 'Upload to Cloud from Google Drive',
    icon: <CloudUploadIcon />,
  },
  {
    type: 'summarize_invoices',
    label: 'Summarize Invoices',
    icon: <SummarizeIcon />,
  },
  {
    type: 'check_claimability',
    label: 'Check Claimability',
    icon: <CheckCircleIcon />,
  },
];

export const SNACKBAR_DURATION = {
  ERROR: 6000,
  SUCCESS: 6000,
} as const;

export const TEXT_CONSTANTS = {
  SELECT_ACCOUNT_PLACEHOLDER: 'Select an account...',
  UNKNOWN_ACCOUNT: 'Unknown account',
  LOADING_ACCOUNTS: 'Loading accounts...',
  NO_ACCOUNTS_AVAILABLE: 'No accounts available',
  NO_ENTITIES_TOOLTIP: 'This account has no entities',
  ENTITY_SINGULAR: 'entity',
  ENTITY_PLURAL: 'entities',
  BUTTON_PROCESSING: 'Processing...',
  BUTTON_TRIGGER: 'Trigger',
  PAGE_TITLE: 'Trigger Jobs',
  PAGE_SUBTITLE: 'Select an account to trigger background jobs for its entities',
  JOBS_TITLE: 'Available Jobs',
  JOBS_DESCRIPTION: 'Select an account above to see available jobs for each entity. Jobs may take up to 3 minutes to complete.',
  NO_ENTITIES_MESSAGE: 'No entities available for this account.',
  SELECT_ACCOUNT_ERROR: 'Please select an account',
  TABLE_HEADER_JOB_TYPE: 'Job Type',
} as const;


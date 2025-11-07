import React from 'react';
import type { Account, Entity } from '../../types/profile';
import type { JobType } from '../../services/jobTriggerService';

export interface AccountSelectorProps {
  accounts: Account[];
  entities: Entity[];
  selectedAccountId: string;
  loading: boolean;
  disabled: boolean;
  onAccountChange: (accountId: string) => void;
}

export interface AccountInfoProps {
  account: Account;
  entityCount: number;
}

export interface JobConfig {
  type: JobType;
  label: string;
  icon: React.ReactNode;
}

export interface JobsTableProps {
  entities: Entity[];
  jobConfigs: JobConfig[];
  loadingJobs: Record<JobType, boolean>;
  isAnyJobLoading: boolean;
  onTriggerJob: (jobType: JobType, entityId: string) => void;
}

export interface JobTableRowProps {
  jobType: JobType;
  jobLabel: string;
  jobIcon: React.ReactNode;
  entities: Entity[];
  isLoading: boolean;
  isAnyJobLoading: boolean;
  onTriggerJob: (jobType: JobType, entityId: string) => void;
}

export interface JobTriggerButtonProps {
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export interface LoadingJobsState {
  google_drive_discover: boolean;
  upload_to_cloud: boolean;
  summarize_invoices: boolean;
  check_claimability: boolean;
}


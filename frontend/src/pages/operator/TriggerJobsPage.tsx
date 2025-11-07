import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  DriveFolderUpload as DriveFolderUploadIcon,
  Summarize as SummarizeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { triggerJob, getJobConfig, type JobType } from '../../services/jobTriggerService';
import { useOperatorAccountsStore } from '../../store/operatorAccountsStore';
import AccountSelector from './components/AccountSelector/AccountSelector';
import AccountInfo from './components/AccountInfo/AccountInfo';
import JobsTable from './components/JobsTable/JobsTable';
import styles from './TriggerJobsPage.module.scss';

const TriggerJobsPage: React.FC = () => {
  // Get accounts and entities from store
  const { accounts: storeAccounts, entities: storeEntities, loading: storeLoading } = useOperatorAccountsStore();
  
  // State
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loadingJobs, setLoadingJobs] = useState<Record<JobType, boolean>>({
    google_drive_discover: false,
    upload_to_cloud: false,
    summarize_invoices: false,
    check_claimability: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle account selection
  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  // Trigger a job for a specific entity
  const handleTriggerJob = useCallback(async (jobType: JobType, entityId: string) => {
    if (!selectedAccountId) {
      setError('Please select an account');
      return;
    }

    setLoadingJobs((prev) => ({ ...prev, [jobType]: true }));
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await triggerJob(jobType, {
        accountId: selectedAccountId,
        entityId: entityId,
      });

      const jobConfig = getJobConfig(jobType);
      const entity = storeEntities.find((e) => e._id === entityId);
      setSuccessMessage(result.message || `${jobConfig.name} job triggered successfully for ${entity?.name || 'entity'}`);
    } catch (err: any) {
      setError(err.message || `Failed to trigger ${getJobConfig(jobType).name} job`);
      console.error(`Error triggering ${jobType}:`, err);
    } finally {
      setLoadingJobs((prev) => ({ ...prev, [jobType]: false }));
    }
  }, [selectedAccountId, storeEntities]);

  // Job button configuration
  const jobConfigs = [
    {
      type: 'google_drive_discover' as JobType,
      label: 'Google Drive Discover',
      icon: <DriveFolderUploadIcon />,
    },
    {
      type: 'upload_to_cloud' as JobType,
      label: 'Upload to Cloud from Google Drive',
      icon: <CloudUploadIcon />,
    },
    {
      type: 'summarize_invoices' as JobType,
      label: 'Summarize Invoices',
      icon: <SummarizeIcon />,
    },
    {
      type: 'check_claimability' as JobType,
      label: 'Check Claimability',
      icon: <CheckCircleIcon />,
    },
  ];

  const selectedAccount = storeAccounts.find((acc) => acc._id === selectedAccountId);
  const accountEntities = selectedAccountId
    ? storeEntities.filter((entity) => entity.accountId === selectedAccountId)
    : [];
  const isAnyJobLoading = Object.values(loadingJobs).some((loading) => loading);

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.title}>
        Trigger Jobs
      </Typography>
      <Typography variant="body1" className={styles.subtitle}>
        Select an account to trigger background jobs for its entities
      </Typography>

      {/* Selection Card */}
      <Card className={styles.selectionCard}>
        <CardContent>
          <Box className={styles.accountSelectorContainer}>
            <AccountSelector
              accounts={storeAccounts}
              entities={storeEntities}
              selectedAccountId={selectedAccountId}
              loading={storeLoading}
              disabled={isAnyJobLoading}
              onAccountChange={handleAccountChange}
            />
          </Box>

          {/* Selected Account Info */}
          {selectedAccount && (
            <AccountInfo
              account={selectedAccount}
              entityCount={accountEntities.length}
            />
          )}
        </CardContent>
      </Card>

      {/* Jobs Table Section */}
      {selectedAccountId && (
        <Box className={styles.jobsSection}>
          <Typography variant="h5" className={styles.jobsTitle}>
            Available Jobs
          </Typography>
          <Typography variant="body2" color="text.secondary" className={styles.jobsDescription}>
            Select an account above to see available jobs for each entity. Jobs may take up to 3 minutes to complete.
          </Typography>

          {accountEntities.length === 0 ? (
            <Card className={styles.selectionCard}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" className={styles.emptyState}>
                  No entities available for this account.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <JobsTable
              entities={accountEntities}
              jobConfigs={jobConfigs}
              loadingJobs={loadingJobs}
              isAnyJobLoading={isAnyJobLoading}
              onTriggerJob={handleTriggerJob}
            />
          )}
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          className={styles.alert}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          className={styles.alert}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TriggerJobsPage;

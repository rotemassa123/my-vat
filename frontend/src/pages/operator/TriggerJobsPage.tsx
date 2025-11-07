import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Card,
  CardContent,
} from '@mui/material';
import { triggerJob, getJobConfig, type JobType } from '../../services/jobTriggerService';
import { useOperatorAccountsStore } from '../../store/operatorAccountsStore';
import type { LoadingJobsState } from './types';
import { INITIAL_LOADING_JOBS_STATE, JOB_CONFIGS, SNACKBAR_DURATION, TEXT_CONSTANTS } from './consts';
import AccountSelector from './components/AccountSelector/AccountSelector';
import AccountInfo from './components/AccountInfo/AccountInfo';
import JobsTable from './components/JobsTable/JobsTable';
import styles from './TriggerJobsPage.module.scss';

const TriggerJobsPage: React.FC = () => {
  // Get accounts and entities from store
  const { accounts: storeAccounts, entities: storeEntities, loading: storeLoading } = useOperatorAccountsStore();
  
  // State
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loadingJobs, setLoadingJobs] = useState<LoadingJobsState>(INITIAL_LOADING_JOBS_STATE);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle account selection
  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  // Trigger a job for a specific entity
  const handleTriggerJob = useCallback(async (jobType: JobType, entityId: string) => {
    if (!selectedAccountId) {
      setError(TEXT_CONSTANTS.SELECT_ACCOUNT_ERROR);
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

  const selectedAccount = storeAccounts.find((acc) => acc._id === selectedAccountId);
  const accountEntities = selectedAccountId
    ? storeEntities.filter((entity) => entity.accountId === selectedAccountId)
    : [];
  const isAnyJobLoading = Object.values(loadingJobs).some((loading) => loading);

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.title}>
        {TEXT_CONSTANTS.PAGE_TITLE}
      </Typography>
      <Typography variant="body1" className={styles.subtitle}>
        {TEXT_CONSTANTS.PAGE_SUBTITLE}
      </Typography>

      {/* Selection Card */}
      <Card className={styles.selectionCard}>
        <CardContent>
          <Box className={styles.selectionContent}>
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
              <Box className={styles.accountInfoContainer}>
                <AccountInfo
                  account={selectedAccount}
                  entityCount={accountEntities.length}
                />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Jobs Table Section */}
      {selectedAccountId && (
        <Box className={styles.jobsSection}>
          <Typography variant="h5" className={styles.jobsTitle}>
            {TEXT_CONSTANTS.JOBS_TITLE}
          </Typography>
          <Typography variant="body2" color="text.secondary" className={styles.jobsDescription}>
            {TEXT_CONSTANTS.JOBS_DESCRIPTION}
          </Typography>

          {accountEntities.length === 0 ? (
            <Card className={styles.selectionCard}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" className={styles.emptyState}>
                  {TEXT_CONSTANTS.NO_ENTITIES_MESSAGE}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <JobsTable
              entities={accountEntities}
              jobConfigs={JOB_CONFIGS}
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
        autoHideDuration={SNACKBAR_DURATION.ERROR}
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
        autoHideDuration={SNACKBAR_DURATION.SUCCESS}
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

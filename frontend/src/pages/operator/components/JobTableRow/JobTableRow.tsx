import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Entity } from '../../../../types/profile';
import type { JobType } from '../../../../services/jobTriggerService';
import JobTriggerButton from '../JobTriggerButton/JobTriggerButton';
import styles from './JobTableRow.module.scss';

interface JobTableRowProps {
  jobType: JobType;
  jobLabel: string;
  jobIcon: React.ReactNode;
  entities: Entity[];
  isLoading: boolean;
  isAnyJobLoading: boolean;
  onTriggerJob: (jobType: JobType, entityId: string) => void;
}

const JobTableRow: React.FC<JobTableRowProps> = ({
  jobType,
  jobLabel,
  jobIcon,
  entities,
  isLoading,
  isAnyJobLoading,
  onTriggerJob,
}) => {
  return (
    <Box className={styles.tableRow}>
      <Box className={styles.jobNameCell}>
        <Box className={styles.jobNameContent}>
          <Box className={styles.jobIconSmall}>
            {jobIcon}
          </Box>
          <Typography variant="body2" className={styles.jobNameText}>
            {jobLabel}
          </Typography>
        </Box>
      </Box>
      {entities.map((entity) => {
        const isDisabled = isLoading || isAnyJobLoading;
        return (
          <Box key={entity._id} className={styles.entityCell}>
            <JobTriggerButton
              isLoading={isLoading}
              disabled={isDisabled}
              onClick={() => !isDisabled && onTriggerJob(jobType, entity._id)}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default JobTableRow;


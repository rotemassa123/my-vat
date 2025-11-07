import React from 'react';
import { Box, Typography, Card } from '@mui/material';
import type { Entity } from '../../../../types/profile';
import type { JobType } from '../../../../services/jobTriggerService';
import JobTableRow from '../JobTableRow/JobTableRow';
import styles from './JobsTable.module.scss';

interface JobConfig {
  type: JobType;
  label: string;
  icon: React.ReactNode;
}

interface JobsTableProps {
  entities: Entity[];
  jobConfigs: JobConfig[];
  loadingJobs: Record<JobType, boolean>;
  isAnyJobLoading: boolean;
  onTriggerJob: (jobType: JobType, entityId: string) => void;
}

const JobsTable: React.FC<JobsTableProps> = ({
  entities,
  jobConfigs,
  loadingJobs,
  isAnyJobLoading,
  onTriggerJob,
}) => {
  if (entities.length === 0) {
    return null;
  }

  return (
    <Card className={styles.jobsCard}>
      <Box className={styles.tableContainer}>
        {/* Table Header */}
        <Box className={styles.tableHeader}>
          <Box className={styles.headerCellJobType}>
            Job Type
          </Box>
          {entities.map((entity) => (
            <Box key={entity._id} className={styles.headerCellEntity}>
              {entity.name}
            </Box>
          ))}
        </Box>

        {/* Table Body */}
        <Box className={styles.tableBody}>
          {jobConfigs.map((job) => (
            <JobTableRow
              key={job.type}
              jobType={job.type}
              jobLabel={job.label}
              jobIcon={job.icon}
              entities={entities}
              isLoading={loadingJobs[job.type]}
              isAnyJobLoading={isAnyJobLoading}
              onTriggerJob={onTriggerJob}
            />
          ))}
        </Box>
      </Box>
    </Card>
  );
};

export default JobsTable;


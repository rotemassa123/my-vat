import React from 'react';
import { Box, Typography, Card } from '@mui/material';
import type { JobsTableProps } from '../../types';
import { TEXT_CONSTANTS } from '../../consts';
import JobTableRow from '../JobTableRow/JobTableRow';
import styles from './JobsTable.module.scss';

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
            {TEXT_CONSTANTS.TABLE_HEADER_JOB_TYPE}
          </Box>
          {entities.map((entity) => (
            <Box key={entity._id} className={styles.headerCellEntity}>
              {entity.entity_name || 'Unnamed Entity'}
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


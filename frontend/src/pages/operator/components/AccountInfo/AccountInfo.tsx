import React from 'react';
import { Box, Typography } from '@mui/material';
import type { AccountInfoProps } from '../../types';
import { TEXT_CONSTANTS } from '../../consts';
import styles from './AccountInfo.module.scss';

const AccountInfo: React.FC<AccountInfoProps> = ({ account, entityCount }) => {
  return (
    <Box className={styles.selectionInfo}>
      <Typography variant="body2" color="text.secondary">
        <strong>Account:</strong> {account.company_name || account.email}
      </Typography>
      {entityCount > 0 && (
        <Typography variant="body2" color="text.secondary">
          <strong>Entities:</strong> {entityCount} {entityCount === 1 ? TEXT_CONSTANTS.ENTITY_SINGULAR : TEXT_CONSTANTS.ENTITY_PLURAL} available
        </Typography>
      )}
    </Box>
  );
};

export default AccountInfo;


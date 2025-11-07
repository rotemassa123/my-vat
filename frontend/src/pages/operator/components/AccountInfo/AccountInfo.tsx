import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Account, Entity } from '../../../../types/profile';
import styles from './AccountInfo.module.scss';

interface AccountInfoProps {
  account: Account;
  entityCount: number;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ account, entityCount }) => {
  return (
    <Box className={styles.selectionInfo}>
      <Typography variant="body2" color="text.secondary">
        <strong>Account:</strong> {account.company_name || account.email}
      </Typography>
      {entityCount > 0 && (
        <Typography variant="body2" color="text.secondary">
          <strong>Entities:</strong> {entityCount} {entityCount === 1 ? 'entity' : 'entities'} available
        </Typography>
      )}
    </Box>
  );
};

export default AccountInfo;


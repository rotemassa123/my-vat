import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { Account, Entity } from '../../../../types/profile';
import styles from './AccountSelector.module.scss';

interface AccountSelectorProps {
  accounts: Account[];
  entities: Entity[];
  selectedAccountId: string;
  loading: boolean;
  disabled: boolean;
  onAccountChange: (accountId: string) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  entities,
  selectedAccountId,
  loading,
  disabled,
  onAccountChange,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onAccountChange(event.target.value);
  };

  const getAccountEntityCount = (accountId: string) => {
    return entities.filter((entity) => entity.accountId === accountId).length;
  };

  return (
    <FormControl fullWidth>
      <Typography variant="body2" className={styles.label}>
        Account
      </Typography>
      <Select
        value={selectedAccountId}
        onChange={handleChange}
        displayEmpty
        disabled={loading || disabled}
        className={styles.select}
        renderValue={(value) => {
          if (!value) {
            return <em>Select an account...</em>;
          }
          const account = accounts.find((acc) => acc._id === value);
          return account
            ? account.company_name || account.email
            : 'Unknown account';
        }}
      >
        {loading ? (
          <MenuItem disabled>
            <CircularProgress size={20} className={styles.loader} />
            Loading accounts...
          </MenuItem>
        ) : accounts.length === 0 ? (
          <MenuItem disabled>No accounts available</MenuItem>
        ) : (
          accounts.map((account) => {
            const entityCount = getAccountEntityCount(account._id);
            const hasNoEntities = entityCount === 0;
            return (
              <Tooltip
                key={account._id}
                title={hasNoEntities ? 'This account has no entities' : ''}
                arrow
              >
                <span>
                  <MenuItem
                    value={account._id}
                    disabled={hasNoEntities}
                    className={hasNoEntities ? styles.disabledMenuItem : ''}
                  >
                    <Box className={styles.menuItemContent}>
                      <Typography variant="body2">
                        {account.company_name || account.email}
                      </Typography>
                      {!hasNoEntities && (
                        <Typography variant="caption" className={styles.entityCount}>
                          ({entityCount} {entityCount === 1 ? 'entity' : 'entities'})
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                </span>
              </Tooltip>
            );
          })
        )}
      </Select>
    </FormControl>
  );
};

export default AccountSelector;


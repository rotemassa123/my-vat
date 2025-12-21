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
import type { AccountSelectorProps } from '../../types';
import { TEXT_CONSTANTS } from '../../consts';
import styles from './AccountSelector.module.scss';

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
            return <em>{TEXT_CONSTANTS.SELECT_ACCOUNT_PLACEHOLDER}</em>;
          }
          const account = accounts.find((acc) => acc._id === value);
          return account
            ? account.company_name || 'Unnamed Account'
            : TEXT_CONSTANTS.UNKNOWN_ACCOUNT;
        }}
      >
        {loading ? (
          <MenuItem disabled>
            <CircularProgress size={20} className={styles.loader} />
            {TEXT_CONSTANTS.LOADING_ACCOUNTS}
          </MenuItem>
        ) : accounts.length === 0 ? (
          <MenuItem disabled>{TEXT_CONSTANTS.NO_ACCOUNTS_AVAILABLE}</MenuItem>
        ) : (
          accounts.map((account) => {
            const entityCount = getAccountEntityCount(account._id);
            const hasNoEntities = entityCount === 0;
            const menuItem = (
              <MenuItem
                key={account._id}
                value={account._id}
                disabled={hasNoEntities}
                className={hasNoEntities ? styles.disabledMenuItem : ''}
              >
                <Box className={styles.menuItemContent}>
                  <Typography variant="body2">
                    {account.company_name || 'Unnamed Account'}
                  </Typography>
                  {!hasNoEntities && (
                    <Typography variant="caption" className={styles.entityCount}>
                      ({entityCount} {entityCount === 1 ? TEXT_CONSTANTS.ENTITY_SINGULAR : TEXT_CONSTANTS.ENTITY_PLURAL})
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            );

            return hasNoEntities ? (
              <Tooltip
                key={account._id}
                title={TEXT_CONSTANTS.NO_ENTITIES_TOOLTIP}
                arrow
              >
                <span>
                  {menuItem}
                </span>
              </Tooltip>
            ) : (
              menuItem
            );
          })
        )}
      </Select>
    </FormControl>
  );
};

export default AccountSelector;


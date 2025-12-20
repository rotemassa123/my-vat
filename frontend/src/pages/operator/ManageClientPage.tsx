import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  CircularProgress,
} from '@mui/material';
import type { SyntheticEvent } from 'react';
import { useOperatorAccountsStore } from '../../store/operatorAccountsStore';
import { useOperatorAccountContextStore } from '../../store/operatorAccountContextStore';
import { useAppBootstrapContext } from '../../contexts/AppBootstrapContext';
import { useOperatorAccountData } from '../../hooks/operator/useOperatorAccountData';
import MagicLinkAccountSelect from './components/MagicLinkAccountSelect';
import ReportingPage from '../ReportingPage';
import EntitiesPage from '../EntitiesPage';
import ManagePage from '../ManagePage';
import type { Account } from '../../types/profile';
import styles from './ManageClientPage.module.scss';

const ManageClientPage: React.FC = () => {
  const { accounts } = useOperatorAccountsStore();
  const { secondaryStatus } = useAppBootstrapContext();
  const accountsLoading = secondaryStatus === 'loading';
  const { setSelectedAccountId: setContextAccountId, clearSelectedAccount } = useOperatorAccountContextStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'invoices' | 'entities' | 'users'>('invoices');

  const selectedAccount = useMemo(
    () => accounts.find((account) => account._id === selectedAccountId) || null,
    [accounts, selectedAccountId],
  );

  // Fetch account data when account is selected
  const { profileLoading, invoiceLoading, isLoaded } = useOperatorAccountData(selectedAccountId || null);

  // Sync context store when account changes (backup, but handleAccountChange sets it first)
  useEffect(() => {
    if (selectedAccountId) {
      setContextAccountId(selectedAccountId);
    } else {
      clearSelectedAccount();
    }
  }, [selectedAccountId, setContextAccountId, clearSelectedAccount]);

  const handleAccountChange = (_event: SyntheticEvent, account: Account | null) => {
    const newAccountId = account?._id || '';
    // Set context store FIRST, before state update, so requests get the header
    if (newAccountId) {
      setContextAccountId(newAccountId);
    } else {
      clearSelectedAccount();
    }
    setSelectedAccountId(newAccountId);
    // Reset to invoices tab when account changes
    setSelectedTab('invoices');
  };

  const handleTabChange = (_event: SyntheticEvent, value: TabOption | null) => {
    if (value) {
      setSelectedTab(value.value);
    }
  };

  type TabOption = { value: 'invoices' | 'entities' | 'users'; label: string };

  const tabOptions: TabOption[] = [
    { value: 'invoices', label: 'Invoices' },
    { value: 'entities', label: 'Entities' },
    { value: 'users', label: 'Users' },
  ];

  const selectedTabOption = tabOptions.find(opt => opt.value === selectedTab) || tabOptions[0];

  const isLoading = profileLoading || invoiceLoading;

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          Manage Client
        </Typography>
        <Box className={styles.headerControls}>
          <Box className={styles.accountPickerSection}>
            <MagicLinkAccountSelect
              accounts={accounts}
              loading={accountsLoading}
              selectedAccount={selectedAccount}
              label="Account"
              placeholder="Select an account"
              noOptionsText="No accounts available"
              onChange={handleAccountChange}
            />
          </Box>
          <Box className={styles.tabPickerSection}>
            <Autocomplete<TabOption, false, true>
              options={tabOptions}
              value={selectedTabOption}
              onChange={handleTabChange}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              disableClearable
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="View"
                  placeholder="Select view"
                />
              )}
              disabled={!selectedAccount}
            />
          </Box>
        </Box>
      </Box>

      {/* Content Section */}
      {selectedAccount && (
        <Box className={styles.tabContent}>
          {isLoading ? (
            <Box className={styles.loadingContainer}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading account data...
              </Typography>
            </Box>
          ) : isLoaded ? (
            <>
              {selectedTab === 'invoices' && <ReportingPage />}
              {selectedTab === 'entities' && <EntitiesPage />}
              {selectedTab === 'users' && <ManagePage />}
            </>
          ) : (
            <Box className={styles.emptyTab}>
              <Typography variant="body1" color="text.secondary">
                Failed to load account data
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {!selectedAccount && (
        <Card className={styles.contentCard}>
          <CardContent>
            <Box className={styles.emptyState}>
              <Typography variant="body1" color="text.secondary">
                Please select an account to manage
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ManageClientPage;


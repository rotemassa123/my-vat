import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import type { SyntheticEvent } from 'react';
import type { ChipProps } from '@mui/material/Chip';
import type { Account, Entity } from '../../types/profile';
import type { User } from '../../types/user';
import { UserType } from '../../consts/userType';
import { useOperatorAccountsStore } from '../../store/operatorAccountsStore';
import { useMagicLinkModalStore } from '../../store/modalStore';
import { useAppBootstrapContext } from '../../contexts/AppBootstrapContext';
import { profileApi } from '../../lib/profileApi';
import MagicLinkModal from '../../components/modals/MagicLinkModal';
import MagicLinkAccountSelect from './components/MagicLinkAccountSelect';
import MagicLinkUserSelect from './components/MagicLinkUserSelect';
import styles from './MagicLinkPage.module.scss';

const TEXT = {
  PAGE_TITLE: 'Magic Link Access',
  PAGE_SUBTITLE:
    'Generate a one-time magic link to impersonate any user. Select an account and user to get started.',
  ACCOUNT_SECTION_TITLE: 'Choose an account',
  ACCOUNT_FIELD_LABEL: 'Account',
  ACCOUNT_PLACEHOLDER: 'Search by company or email…',
  NO_ACCOUNTS_TEXT: 'No accounts available. Load accounts to continue.',
  USER_SECTION_TITLE: 'Choose a user',
  USER_FIELD_LABEL: 'User',
  USER_PLACEHOLDER: 'Search by name or email…',
  USER_HELPER_SELECT_ACCOUNT: 'Select an account to view its users.',
  USER_HELPER_EMPTY: 'We could not find any users for this account yet.',
  USER_HELPER_HINT: 'Start typing to quickly find the user you need.',
  USER_EMPTY_STATE: 'No users found for this account.',
  USER_LOADING: 'Loading users…',
  USER_NO_ACCOUNT_SELECTED: 'Select an account first.',
  USER_PLACEHOLDER_TEXT:
    'Select a user to preview their details and generate a magic link.',
  USERS_LOAD_ERROR: 'Unable to load users for this account. Please try again.',
  ACCOUNT_NOT_FOUND: 'Selected account could not be found. Please try again.',
  GENERATE_BUTTON: 'Generate Magic Link',
  GENERATING_LABEL: 'Generating…',
  RESET_BUTTON: 'Reset',
  DETAILS_EMPTY_NO_USER: 'Pick a user to view their profile details.',
  SUCCESS_MESSAGE: 'Magic link generated. Copy and share it securely.',
  ERROR_MESSAGE: 'Failed to generate magic link. Please try again.',
} as const;

const USER_TYPE_LABELS: Record<UserType, string> = {
  [UserType.operator]: 'Operator',
  [UserType.admin]: 'Admin',
  [UserType.member]: 'Member',
  [UserType.viewer]: 'Viewer',
};

const CHIP_COLOR_MAP: Record<UserType, ChipProps['color']> = {
  [UserType.operator]: 'secondary',
  [UserType.admin]: 'primary',
  [UserType.member]: 'success',
  [UserType.viewer]: 'info',
};

const STATUS_CHIP_COLOR_MAP: Record<string, ChipProps['color']> = {
  active: 'success',
  pending: 'secondary',
  inactive: 'default',
  suspended: 'error',
};

const formatStatusLabel = (status?: string): string => {
  if (!status) {
    return 'Unknown';
  }
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const PLACEHOLDER_ROLE_CONFIG: Array<{
  userType: UserType;
  suffix: string;
  display: string;
}> = [
  { userType: UserType.admin, suffix: 'admin', display: 'Admin' },
  { userType: UserType.member, suffix: 'manager', display: 'Manager' },
  { userType: UserType.viewer, suffix: 'viewer', display: 'Viewer' },
];

const sanitizeNameForEmail = (value: string | undefined): string => {
  if (!value) {
    return 'example';
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .join('');
};

const buildPreviewMagicLink = (
  origin: string,
  accountId: string,
  userId: string,
): string => {
  const trimmedOrigin = origin.replace(/\/$/, '');
  const uniqueId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${trimmedOrigin}/magic/${accountId}/${userId}?token=${uniqueId}`;
};

const createPlaceholderUsers = (
  account: Account,
  accountEntities: Entity[],
): User[] => {
  const now = new Date().toISOString();
  return PLACEHOLDER_ROLE_CONFIG.map((config, index) => {
    const entity =
      config.userType === UserType.admin || accountEntities.length === 0
        ? undefined
        : accountEntities[index % accountEntities.length];

    return {
      _id: `${account._id}-${config.suffix}`,
      fullName: `${account.company_name || account.email} ${config.display}`,
      email: `${config.suffix}@${sanitizeNameForEmail(account.company_name)}.com`,
      userType: config.userType,
      accountId: account._id,
      entityId: entity?._id ?? '',
      status: 'active',
      created_at: now,
      updated_at: now,
    };
  });
};

const MagicLinkPage: React.FC = () => {
  const { accounts, entities } = useOperatorAccountsStore();
  const { secondaryStatus } = useAppBootstrapContext();
  const accountsLoading = secondaryStatus === 'loading';

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [usersByAccountId, setUsersByAccountId] = useState<Record<string, User[]>>(
    {},
  );
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const openMagicLinkModal = useMagicLinkModalStore((state) => state.openModal);
  const closeMagicLinkModal = useMagicLinkModalStore((state) => state.closeModal);

  const entityMap = useMemo(() => {
    return entities.reduce<Record<string, Entity>>((acc, entity) => {
      acc[entity._id] = entity;
      return acc;
    }, {});
  }, [entities]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account._id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  const usersForAccount = useMemo<User[]>(() => {
    if (!selectedAccountId) {
      return [];
    }
    return usersByAccountId[selectedAccountId] ?? [];
  }, [selectedAccountId, usersByAccountId]);

  const selectedUser = useMemo(() => {
    if (!selectedAccountId || !selectedUserId) {
      return undefined;
    }
    return usersForAccount.find((user) => user._id === selectedUserId);
  }, [selectedAccountId, selectedUserId, usersForAccount]);

  const handleErrorToastClose = () => {
    setErrorToast(null);
  };

  const loadUsersForAccount = useCallback(
    async (account: Account) => {
      if (!account?._id) {
        return;
      }

      if (usersByAccountId[account._id]) {
        return;
      }

      setUsersLoading(true);
      setUsersError(null);

      try {
        const accountUsers = await profileApi.getAccountUsers(account._id);

        let loadedUsers: User[] = Array.isArray(accountUsers) ? accountUsers : [];

        if (loadedUsers.length === 0 && import.meta.env.DEV) {
          const accountEntities = entities.filter(
            (entity) => entity.accountId === account._id,
          );
          loadedUsers = createPlaceholderUsers(account, accountEntities);
        }

        setUsersByAccountId((prev) => ({
          ...prev,
          [account._id]: loadedUsers,
        }));
        setUsersError(null);
      } catch (error) {
        console.error('Failed to load users for account', account._id, error);
        setUsersError(TEXT.USERS_LOAD_ERROR);
        setErrorToast(TEXT.USERS_LOAD_ERROR);
      } finally {
        setUsersLoading(false);
      }
    },
    [entities, usersByAccountId],
  );

  const handleAccountChange = (
    _event: SyntheticEvent,
    newValue: Account | null,
  ) => {
    const newAccountId = newValue?._id ?? '';
    setSelectedAccountId(newAccountId);
    setSelectedUserId('');
    setUsersError(null);

    if (newValue) {
      void loadUsersForAccount(newValue);
    }
  };

  const handleUserChange = (
    _event: SyntheticEvent,
    newValue: User | null,
  ) => {
    setSelectedUserId(newValue?._id ?? '');
  };

  const handleReset = () => {
    setSelectedAccountId('');
    setSelectedUserId('');
    setUsersError(null);
    closeMagicLinkModal();
    setErrorToast(null);
  };

  const handleGenerateMagicLink = async () => {
    if (!selectedAccountId || !selectedUser) {
      return;
    }

    const account = accounts.find((acct) => acct._id === selectedAccountId);
    if (!account) {
      setErrorToast(TEXT.ACCOUNT_NOT_FOUND);
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Replace with backend magic link generation call.
      await new Promise((resolve) => setTimeout(resolve, 500));

      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'https://app.myvat.com';
      const previewLink = buildPreviewMagicLink(
        origin,
        selectedAccountId,
        selectedUser._id,
      );

      openMagicLinkModal({
        link: previewLink,
        accountName: account.company_name || account.email,
        userName: selectedUser.fullName,
        userEmail: selectedUser.email,
        entityName: selectedUser.entityId
          ? entityMap[selectedUser.entityId]?.name || selectedUser.entityId
          : undefined,
      });
      setSelectedAccountId('');
      setSelectedUserId('');
      setUsersError(null);
    } catch (error) {
      console.error('Failed to generate magic link', error);
      const message =
        error instanceof Error && error.message ? error.message : TEXT.ERROR_MESSAGE;
      setErrorToast(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box className={styles.container}>
      <Typography variant="h4" className={styles.title}>
        {TEXT.PAGE_TITLE}
      </Typography>
      <Typography variant="body1" className={styles.subtitle}>
        {TEXT.PAGE_SUBTITLE}
      </Typography>

      <Card className={styles.selectorCard}>
        <CardContent>
          <Stack spacing={2} className={styles.selectorContent}>
            <div className={styles.fieldGroup}>
              <Typography className={styles.sectionTitle}>
                {TEXT.ACCOUNT_SECTION_TITLE}
              </Typography>
              <MagicLinkAccountSelect
                accounts={accounts}
                loading={accountsLoading}
                selectedAccount={selectedAccount ?? null}
                label={TEXT.ACCOUNT_FIELD_LABEL}
                placeholder={TEXT.ACCOUNT_PLACEHOLDER}
                noOptionsText={TEXT.NO_ACCOUNTS_TEXT}
                onChange={handleAccountChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <Typography className={styles.sectionTitle}>
                {TEXT.USER_SECTION_TITLE}
              </Typography>
              <MagicLinkUserSelect
                users={usersForAccount}
                selectedUser={selectedUser ?? null}
                disabled={!selectedAccountId || usersLoading}
                loading={usersLoading}
                label={TEXT.USER_FIELD_LABEL}
                placeholder={TEXT.USER_PLACEHOLDER}
                helperText={
                  !selectedAccountId
                    ? TEXT.USER_HELPER_SELECT_ACCOUNT
                    : usersForAccount.length === 0
                      ? TEXT.USER_HELPER_EMPTY
                      : TEXT.USER_HELPER_HINT
                }
                noOptionsText={
                  !selectedAccountId
                    ? TEXT.USER_NO_ACCOUNT_SELECTED
                    : usersLoading
                      ? TEXT.USER_LOADING
                      : TEXT.USER_EMPTY_STATE
                }
                onChange={handleUserChange}
                userTypeLabels={USER_TYPE_LABELS}
                chipColorMap={CHIP_COLOR_MAP}
                statusColorMap={STATUS_CHIP_COLOR_MAP}
                formatStatusLabel={formatStatusLabel}
                badgeChipClassName={styles.badgeChip}
                selectedChipsClassName={styles.selectedChips}
              />
              {usersError ? (
                <Alert severity="error">{usersError}</Alert>
              ) : null}
            </div>
          </Stack>
        </CardContent>
      </Card>

      {selectedAccount && !selectedUser ? (
        <Typography className={styles.placeholderText}>
          {TEXT.DETAILS_EMPTY_NO_USER}
        </Typography>
      ) : null}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        className={styles.actionRow}
        sx={{ marginTop: 3 }}
      >
        <Button
          variant="contained"
          startIcon={
            isGenerating ? <CircularProgress size={18} color="inherit" /> : <LinkIcon />
          }
          onClick={handleGenerateMagicLink}
          disabled={!selectedUser || isGenerating}
        >
          {isGenerating ? TEXT.GENERATING_LABEL : TEXT.GENERATE_BUTTON}
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleReset}
          disabled={!selectedAccountId && !selectedUserId && !usersError}
        >
          {TEXT.RESET_BUTTON}
        </Button>
      </Stack>

      {errorToast ? (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={handleErrorToastClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            onClose={handleErrorToastClose}
            sx={{ width: '100%' }}
          >
            {errorToast}
          </Alert>
        </Snackbar>
      ) : null}

      <MagicLinkModal />
    </Box>
  );
};

export default MagicLinkPage;


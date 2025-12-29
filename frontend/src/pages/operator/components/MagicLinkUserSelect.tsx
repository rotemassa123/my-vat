import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SyntheticEvent } from 'react';
import type { ChipProps } from '@mui/material/Chip';
import type { User } from '../../../types/user';
import { UserRole } from '../../../consts/userType';

interface MagicLinkUserSelectProps {
  users: User[];
  selectedUser: User | null;
  disabled: boolean;
  loading: boolean;
  label: string;
  placeholder: string;
  helperText: string;
  noOptionsText: string;
  onChange: (event: SyntheticEvent, user: User | null) => void;
  userTypeLabels: Record<UserRole, string>;
  chipColorMap: Record<UserRole, ChipProps['color']>;
  statusColorMap: Record<string, ChipProps['color']>;
  formatStatusLabel: (status?: string) => string;
  badgeChipClassName: string;
  selectedChipsClassName: string;
}

const MagicLinkUserSelect: React.FC<MagicLinkUserSelectProps> = ({
  users,
  selectedUser,
  disabled,
  loading,
  label,
  placeholder,
  helperText,
  noOptionsText,
  onChange,
  userTypeLabels,
  chipColorMap,
  statusColorMap,
  formatStatusLabel,
  badgeChipClassName,
  selectedChipsClassName,
}) => {
  return (
    <Autocomplete<User>
      options={users}
      value={selectedUser}
      onChange={onChange}
      disabled={disabled}
      loading={loading}
      isOptionEqualToValue={(option, value) => option._id === value._id}
      getOptionLabel={(option) => `${option.fullName} (${option.email})`}
      noOptionsText={noOptionsText}
      renderOption={(props, option) => {
        const userType = option.userType as UserRole;
        const statusColor =
          statusColorMap[option.status?.toLowerCase() ?? ''] || ('default' as ChipProps['color']);

        return (
          <li {...props} key={option._id}>
            <Stack spacing={0.5} sx={{ width: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="body1">{option.fullName}</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={userTypeLabels[userType] || 'User'}
                    color={chipColorMap[userType] || 'default'}
                    size="small"
                    className={badgeChipClassName}
                  />
                  {option.status ? (
                    <Chip
                      label={formatStatusLabel(option.status)}
                      color={statusColor}
                      size="small"
                      variant="outlined"
                      className={badgeChipClassName}
                    />
                  ) : null}
                </Stack>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {option.email}
              </Typography>
            </Stack>
          </li>
        );
      }}
      renderInput={(params) => {
        const selectedType = selectedUser?.userType as UserRole | undefined;
        const selectedStatusColor: ChipProps['color'] | undefined = selectedUser?.status
          ? statusColorMap[selectedUser.status.toLowerCase()] || 'default'
          : undefined;

        return (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {selectedUser ? (
                    <Stack direction="row" spacing={1} className={selectedChipsClassName}>
                      <Chip
                        label={
                          selectedType !== undefined ? userTypeLabels[selectedType] || 'User' : 'User'
                        }
                        color={
                          selectedType !== undefined
                            ? chipColorMap[selectedType] || 'default'
                            : 'default'
                        }
                        size="small"
                        className={badgeChipClassName}
                      />
                      {selectedUser.status ? (
                        <Chip
                          label={formatStatusLabel(selectedUser.status)}
                          color={selectedStatusColor || 'default'}
                          size="small"
                          variant="outlined"
                          className={badgeChipClassName}
                        />
                      ) : null}
                    </Stack>
                  ) : null}
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        );
      }}
    />
  );
};

export default MagicLinkUserSelect;


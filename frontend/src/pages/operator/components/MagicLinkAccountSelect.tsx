import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SyntheticEvent } from 'react';
import type { Account } from '../../../types/profile';

interface MagicLinkAccountSelectProps {
  accounts: Account[];
  selectedAccount: Account | null;
  loading: boolean;
  label: string;
  placeholder: string;
  noOptionsText: string;
  onChange: (event: SyntheticEvent, account: Account | null) => void;
}

const MagicLinkAccountSelect: React.FC<MagicLinkAccountSelectProps> = ({
  accounts,
  selectedAccount,
  loading,
  label,
  placeholder,
  noOptionsText,
  onChange,
}) => {
  return (
    <Autocomplete<Account>
      options={accounts}
      loading={loading}
      value={selectedAccount}
      onChange={onChange}
      isOptionEqualToValue={(option, value) => option._id === value._id}
      getOptionLabel={(option) => option.company_name || 'Unnamed account'}
      noOptionsText={noOptionsText}
      renderOption={(props, option) => (
        <li {...props} key={option._id}>
          <Stack direction="column" spacing={0.5} sx={{ width: '100%' }}>
            <Typography variant="body1">{option.company_name || 'Unnamed account'}</Typography>
            {option.website && (
              <Typography variant="body2" color="text.secondary">
                {option.website}
              </Typography>
            )}
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default MagicLinkAccountSelect;


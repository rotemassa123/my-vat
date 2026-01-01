import React from 'react';
import { Chip } from '@mui/material';
import styles from './EmailInviteInput.module.scss';

export interface EmailInviteTag {
  id: string;
  email: string;
  isValid: boolean;
  isDuplicate?: boolean;
}

interface EmailInviteInputProps {
  emailTags: EmailInviteTag[];
  newEmail: string;
  emailError?: string;
  duplicateWarning?: string;
  hasDuplicateEmails?: boolean;
  onChange: (value: string) => void;
  onKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onRemove: (email: string) => void;
}

const EmailInviteInput: React.FC<EmailInviteInputProps> = ({
  emailTags,
  newEmail,
  emailError,
  duplicateWarning,
  hasDuplicateEmails,
  onChange,
  onKeyPress,
  onKeyDown,
  onBlur,
  onRemove,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.emailInputContainer}>
        <div className={styles.emailTags}>
          {emailTags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.email}
              onDelete={() => onRemove(tag.email)}
              className={
                tag.isDuplicate
                  ? styles.duplicateEmailChip
                  : tag.isValid
                  ? styles.emailChip
                  : styles.invalidEmailChip
              }
              size="small"
            />
          ))}
        </div>
        <input
          type="text"
          value={newEmail}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder={emailTags.length === 0 ? 'Enter email addresses...' : ''}
          className={styles.emailInputField}
        />
      </div>
      {emailError && <p className={styles.emailError}>{emailError}</p>}
      {duplicateWarning && <p className={styles.duplicateWarning}>{duplicateWarning}</p>}
    </div>
  );
};

export default EmailInviteInput;


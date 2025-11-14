import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
} from '@mui/material';
import styles from './CreateAccountForm.module.scss';

interface EmailTag {
  id: string;
  email: string;
  isValid: boolean;
}

const CreateAccountForm: React.FC = () => {
  const [formData, setFormData] = useState({
    accountType: 'member',
    companyName: '',
    registrationNumber: '',
    websiteLink: '',
    description: '',
  });
  const [emailTags, setEmailTags] = useState<EmailTag[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmailTag = (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    const isValid = isValidEmail(trimmedEmail);
    const newTag: EmailTag = {
      id: `${trimmedEmail}-${Date.now()}`,
      email: trimmedEmail,
      isValid,
    };

    setEmailTags((prev) => [...prev, newTag]);
    setNewEmail('');

    if (!isValid) {
      setEmailError('One or more of your emails are incorrect');
    } else {
      const hasInvalid = [...emailTags, newTag].some((tag) => !tag.isValid);
      setEmailError(hasInvalid ? 'One or more of your emails are incorrect' : '');
    }
  };

  const handleEmailKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      addEmailTag(newEmail);
    }
  };

  const handleEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && newEmail === '' && emailTags.length > 0) {
      event.preventDefault();
      const updatedTags = emailTags.slice(0, -1);
      setEmailTags(updatedTags);
      const hasInvalid = updatedTags.some((tag) => !tag.isValid);
      setEmailError(hasInvalid ? 'One or more of your emails are incorrect' : '');
    }
  };

  const removeEmailTag = (emailToRemove: string) => {
    const updatedTags = emailTags.filter((tag) => tag.email !== emailToRemove);
    setEmailTags(updatedTags);
    const hasInvalid = updatedTags.some((tag) => !tag.isValid);
    setEmailError(hasInvalid ? 'One or more of your emails are incorrect' : '');
  };

  const handleEmailBlur = () => {
    if (newEmail.trim()) {
      addEmailTag(newEmail);
    }
  };

  const resetForm = () => {
    setFormData({
      accountType: 'member',
      companyName: '',
      registrationNumber: '',
      websiteLink: '',
      description: '',
    });
    setEmailTags([]);
    setNewEmail('');
    setEmailError('');
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleContinue = () => {
    if (emailTags.length === 0) {
      setEmailError('Please add at least one email address');
      return;
    }

    const invalidEmails = emailTags.filter((tag) => !tag.isValid);
    if (invalidEmails.length > 0) {
      setEmailError('Please fix invalid email addresses');
      return;
    }

    setEmailError('');

    // TODO: Implement form submission
    console.log('Form data:', {
      emails: emailTags.map((tag) => tag.email),
      ...formData,
    });
  };

  return (
    <Box className={styles.formWrapper}>
      <Box className={styles.formContent}>
        {/* Email Addresses */}
        <Box className={styles.formField}>
          <Typography className={styles.label}>Email Addresses</Typography>
          <Box className={styles.emailInputWrapper}>
            <Box className={styles.emailTags}>
              {emailTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.email}
                  onDelete={() => removeEmailTag(tag.email)}
                  className={tag.isValid ? styles.emailChip : styles.invalidEmailChip}
                  size="small"
                />
              ))}
            </Box>
            <input
              type="text"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={handleEmailKeyPress}
              onKeyDown={handleEmailKeyDown}
              onBlur={handleEmailBlur}
              placeholder={emailTags.length === 0 ? 'Enter email addresses...' : ''}
              className={styles.emailInputField}
            />
          </Box>
          {emailError && (
            <Typography className={styles.emailError}>{emailError}</Typography>
          )}
        </Box>

        {/* Company Name */}
        <Box className={styles.formField}>
          <Typography className={styles.label}>Company Name</Typography>
          <TextField
            fullWidth
            placeholder="Type Company Name"
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className={styles.inputField}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white',
                height: '50px',
                '& fieldset': {
                  borderColor: '#cbd2f0',
                  borderWidth: '0.6px',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd2f0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0131ff',
                  borderWidth: '0.6px',
                },
              },
              '& .MuiInputBase-input': {
                padding: '0 19px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '14px',
                color: '#838383',
                fontWeight: 400,
                '&::placeholder': {
                  color: '#838383',
                  opacity: 1,
                },
              },
            }}
          />
        </Box>

        {/* Website Link */}
        <Box className={styles.formField}>
          <Typography className={styles.label}>Website Link</Typography>
          <TextField
            fullWidth
            placeholder="Enter Website Link"
            value={formData.websiteLink}
            onChange={(e) => handleChange('websiteLink', e.target.value)}
            className={styles.inputField}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white',
                height: '50px',
                '& fieldset': {
                  borderColor: '#cbd2f0',
                  borderWidth: '0.6px',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd2f0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0131ff',
                  borderWidth: '0.6px',
                },
              },
              '& .MuiInputBase-input': {
                padding: '0 19px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '14px',
                color: '#838383',
                fontWeight: 400,
                '&::placeholder': {
                  color: '#838383',
                  opacity: 1,
                },
              },
            }}
          />
        </Box>

        {/* Description */}
        <Box className={styles.formField}>
          <Typography className={styles.label}>Description</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add description..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={styles.textAreaField}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white',
                minHeight: '110px',
                alignItems: 'flex-start',
                '& fieldset': {
                  borderColor: '#cbd2f0',
                  borderWidth: '0.6px',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd2f0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0131ff',
                  borderWidth: '0.6px',
                },
              },
              '& .MuiInputBase-input': {
                fontFamily: "'Poppins', sans-serif",
                fontSize: '14px',
                fontWeight: 400,
                color: '#838383',
                textAlign: 'left',
                '&::placeholder': {
                  color: '#838383',
                  opacity: 1,
                },
              },
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Box className={styles.buttonContainer}>
          <Button
            variant="contained"
            onClick={handleContinue}
            className={styles.continueButton}
            sx={{
              backgroundColor: '#0131ff',
              borderRadius: '100px',
              padding: '18px 70px',
              textTransform: 'none',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              color: 'white',
              '&:hover': {
                backgroundColor: '#0025cc',
              },
            }}
          >
            Create
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateAccountForm;


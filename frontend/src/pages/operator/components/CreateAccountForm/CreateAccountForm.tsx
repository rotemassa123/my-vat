import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useInviteUsers } from '../../../../hooks/invitation/useInviteUsers';
import type { InvitationResult } from '../../../../lib/invitationApi';
import EmailInviteInput, {
  type EmailInviteTag,
} from '../../../../components/modals/components/EmailInviteInput/EmailInviteInput';
import InviteSuccessModal from './InviteSuccessModal';
import styles from './CreateAccountForm.module.scss';

const CreateAccountForm: React.FC = () => {
  const [formData, setFormData] = useState({
    accountType: 'member',
    companyName: '',
    registrationNumber: '',
    websiteLink: '',
    description: '',
  });
  const [emailTags, setEmailTags] = useState<EmailInviteTag[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [submittedAccountName, setSubmittedAccountName] = useState('');
  const { sendInvitations, isLoading: isInviting, error: inviteError } = useInviteUsers();

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
    const newTag: EmailInviteTag = {
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

  const handleContinue = async () => {
    if (emailTags.length === 0) {
      setEmailError('Please add at least one email address');
      return;
    }

    if (!formData.companyName.trim()) {
      setSubmitError('Please add a company name before creating the account');
      return;
    }

    const invalidEmails = emailTags.filter((tag) => !tag.isValid);
    if (invalidEmails.length > 0) {
      setEmailError('Please fix invalid email addresses');
      return;
    }

    setEmailError('');
    setSubmitError('');

    try {
      const response = await sendInvitations({
        emails: emailTags.map((tag) => tag.email),
        role: 'admin',
      });

      const successfulEmails = (response?.results ?? [])
        .filter((result: InvitationResult) => result.success)
        .map((result) => result.email);

      if (successfulEmails.length === 0) {
        setSubmitError('Invitations could not be sent. Please try again.');
        return;
      }

      setInvitedEmails(successfulEmails);
      setSubmittedAccountName(formData.companyName.trim());
      setSuccessModalOpen(true);
      setFormData({
        accountType: 'member',
        companyName: '',
        registrationNumber: '',
        websiteLink: '',
        description: '',
      });
      setEmailTags([]);
      setNewEmail('');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to process account creation';
      setSubmitError(message);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
  };

  return (
    <Box className={styles.formWrapper}>
      <Box className={styles.formContent}>
        {/* Email Addresses */}
        <Box className={styles.formField}>
          <Typography className={styles.label}>Email Addresses</Typography>
          <EmailInviteInput
            emailTags={emailTags}
            newEmail={newEmail}
            emailError={emailError}
            onChange={setNewEmail}
            onKeyPress={handleEmailKeyPress}
            onKeyDown={handleEmailKeyDown}
            onBlur={handleEmailBlur}
            onRemove={removeEmailTag}
          />
        </Box>

        {/* Company Name */}
        <Box className={styles.formField}>
          <Typography className={styles.label}>Company Name</Typography>
          <Box className={styles.fieldInputWrapper}>
            <input
              type="text"
              placeholder="Type Company Name"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className={styles.fieldInput}
            />
          </Box>
        </Box>

        {/* Website Link */}
        <Box className={styles.formField}>
          <Typography className={styles.label}>Website Link</Typography>
          <Box className={styles.fieldInputWrapper}>
            <input
              type="text"
              placeholder="Enter Website Link"
              value={formData.websiteLink}
              onChange={(e) => handleChange('websiteLink', e.target.value)}
              className={styles.fieldInput}
            />
          </Box>
        </Box>

        {/* Description */}
        <Box className={styles.formField}>
          <Typography className={styles.label}>Description</Typography>
          <Box className={`${styles.fieldInputWrapper} ${styles.textAreaWrapper}`}>
            <textarea
              placeholder="Add description..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`${styles.fieldInput} ${styles.textAreaField}`}
              rows={3}
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box className={styles.buttonContainer}>
          <Button
            variant="contained"
            onClick={handleContinue}
            className={styles.continueButton}
            disabled={isInviting}
            disableElevation
          >
            {isInviting ? <CircularProgress size={20} color="inherit" /> : 'Create'}
          </Button>
        </Box>

        {(submitError || inviteError) && (
          <Typography className={styles.submitError}>
            {submitError || inviteError?.message}
          </Typography>
        )}
      </Box>

      <InviteSuccessModal
        open={successModalOpen}
        accountName={submittedAccountName}
        invitedEmails={invitedEmails}
        onClose={handleCloseSuccessModal}
      />
    </Box>
  );
};

export default CreateAccountForm;


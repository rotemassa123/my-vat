import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Modal, 
  Typography, 
  IconButton, 
  MenuItem, 
  Select, 
  FormControl, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Chip, 
  Collapse, 
  TextareaAutosize,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { 
  Close, 
  ExpandMore, 
  ExpandLess,
  CheckCircle,
  Email,
} from '@mui/icons-material';
import { useInviteModalStore } from '../../store/modalStore';
import { useAccountStore } from '../../store/accountStore';
import { useInviteUsers } from '../../hooks/invitation/useInviteUsers';
import styles from './InviteModal.module.scss';

interface InviteModalProps {
  // Optional props for customization
  title?: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ 
  title = "Invite to users MyVat"
}) => {
  const { isModalOpen, closeModal } = useInviteModalStore();
  const { entities } = useAccountStore();
  const { sendInvitations, isLoading, isError, error, data } = useInviteUsers();
  
  // State management
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('member');
  interface EmailTag {
    id: string;
    email: string;
    isValid: boolean;
  }

  const [emailTags, setEmailTags] = useState<EmailTag[]>([]);
  const [newEmail, setNewEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [isPersonalExpanded, setIsPersonalExpanded] = useState<boolean>(false);
  const [personalMessage, setPersonalMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Reset form state when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setShowSuccess(false);
      setEmailTags([]);
      setNewEmail('');
      setSelectedEntity('');
      setSelectedRole('member');
      setPersonalMessage('');
      setEmailError('');
      setIsPersonalExpanded(false);
    }
  }, [isModalOpen]);

  // Custom close handler that resets form
  const handleCloseModal = () => {
    setShowSuccess(false);
    setEmailTags([]);
    setNewEmail('');
    setSelectedEntity('');
    setSelectedRole('member');
    setPersonalMessage('');
    setEmailError('');
    setIsPersonalExpanded(false);
    closeModal();
  };

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Event handlers
  const handleEntityChange = (event: SelectChangeEvent<string>) => {
    setSelectedEntity(event.target.value);
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRole(event.target.value);
  };

  const handleEmailKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && newEmail.trim()) {
      event.preventDefault();
      const email = newEmail.trim();
      const isValid = isValidEmail(email);
      
      const newTag: EmailTag = {
        id: Date.now().toString(),
        email,
        isValid
      };
      
      setEmailTags([...emailTags, newTag]);
      setNewEmail('');
      
      // Only show error if there are invalid emails
      const hasInvalidEmails = [...emailTags, newTag].some(tag => !tag.isValid);
      if (hasInvalidEmails) {
        setEmailError('One or more of your emails are incorrect');
      } else {
        setEmailError('');
      }
    }
  };

  const handleEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && newEmail === '' && emailTags.length > 0) {
      event.preventDefault();
      // Remove the last email tag
      const updatedTags = emailTags.slice(0, -1);
      setEmailTags(updatedTags);
      
      // Check if there are any invalid emails left
      const hasInvalidEmails = updatedTags.some(tag => !tag.isValid);
      if (!hasInvalidEmails) {
        setEmailError('');
      }
    }
  };

  const removeEmailTag = (emailToRemove: string) => {
    const updatedTags = emailTags.filter(tag => tag.email !== emailToRemove);
    setEmailTags(updatedTags);
  const handleEmailBlur = () => {
    if (newEmail.trim()) {
      const email = newEmail.trim();
      const isValid = isValidEmail(email);

      const newTag: EmailTag = {
        id: Date.now().toString(),
        email,
        isValid
      };

      setEmailTags([...emailTags, newTag]);
      setNewEmail('');

      const hasInvalidEmails = [...emailTags, newTag].some(tag => !tag.isValid);
      if (hasInvalidEmails) {
        setEmailError('One or more of your emails are incorrect');
      } else {
        setEmailError('');
      }
    }
  };

    
    // Check if there are any invalid emails left
    const hasInvalidEmails = updatedTags.some(tag => !tag.isValid);
    if (!hasInvalidEmails) {
      setEmailError('');
    }
  };

  const handlePersonalExpand = () => {
    setIsPersonalExpanded(!isPersonalExpanded);
  };



  const handleInviteSubmit = async () => {
    // Validate form
    if (selectedRole !== 'admin' && !selectedEntity) {
      setEmailError('Please select an entity');
      return;
    }
    
    if (emailTags.length === 0) {
      setEmailError('Please add at least one email address');
      return;
    }
    
    // Check for invalid emails
    const invalidEmails = emailTags.filter(tag => !tag.isValid);
    if (invalidEmails.length > 0) {
      setEmailError('Please fix invalid email addresses');
      return;
    }
    
    try {
      const validEmails = emailTags.map(tag => tag.email);
      
      await sendInvitations({
        emails: validEmails,
        entityId: selectedRole === 'admin' ? undefined : selectedEntity,
        role: selectedRole as 'admin' | 'member' | 'viewer',
        personalMessage: personalMessage || undefined,
      });
      
      // Show success message
      setShowSuccess(true);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to send invitations:', err);
    }
  };

  // Success state component
  const renderSuccessState = () => (
    <Box className={styles.modalContainer}>
      <Box className={styles.modalHeader}>
        <IconButton onClick={handleCloseModal} className={styles.closeButton}>
          <Close />
        </IconButton>
      </Box>

      <Box className={styles.successContent}>
        <Box className={styles.successIcon}>
          <CheckCircle sx={{ fontSize: 64, color: '#4CAF50' }} />
        </Box>
        
        <Typography variant="h5" className={styles.successTitle}>
          Invitations sent successfully!
        </Typography>
        
        <Typography variant="body1" className={styles.successSubtitle}>
          {data?.successful} invitation{data?.successful !== 1 ? 's' : ''} sent
          {data?.failed && data.failed > 0 ? ` • ${data.failed} failed` : ''}
        </Typography>
        
        <Box className={styles.successEmails}>
          <Email sx={{ fontSize: 20, color: '#666', mb: 1 }} />
          <Typography variant="body2" className={styles.successEmailText}>
            Invitation emails are on their way to your selected recipients.
            They'll receive instructions on how to join your account.
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          onClick={handleCloseModal}
          className={styles.successButton}
          size="large"
        >
          Done
        </Button>
      </Box>
    </Box>
  );

  return (
    <Modal open={isModalOpen} onClose={handleCloseModal}>
      {showSuccess ? renderSuccessState() : (
        <Box className={styles.modalContainer}>
          <Box className={styles.modalHeader}>
            <Typography variant="h6" className={styles.modalTitle}>
              {title}
            </Typography>
            <IconButton onClick={handleCloseModal} className={styles.closeButton}>
              <Close />
            </IconButton>
          </Box>

          <Box className={styles.modalContent}>
            {/* Error Display */}
            {isError && error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message || 'Failed to send invitations. Please try again.'}
              </Alert>
            )}

            {/* Entity Selection */}
          <Box className={styles.formGroup}>
            <Typography className={styles.label}>
              Choose entity
            </Typography>
            <FormControl fullWidth>
              <Select
                value={selectedEntity}
                onChange={handleEntityChange}
                className={styles.select}
                displayEmpty
                disabled={selectedRole === 'admin'}
                renderValue={(value) => {
                  if (selectedRole === 'admin') {
                    return "Admins are automatically assigned to all account entities";
                  }
                  if (!value) {
                    return "Select entity...";
                  }
                  // Find the entity by ID and return its name
                  const selectedEntityData = entities.find(entity => entity._id === value);
                  return selectedEntityData ? selectedEntityData.name : "Select entity...";
                }}
              >
                {entities.map((entity) => (
                  <MenuItem key={entity._id} value={entity._id}>
                    {entity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Email Input Section */}
          <Box className={styles.inviteSection}>
            <Box className={styles.inviteHeader}>
              <Typography className={styles.inviteLabel}>
                Invite with email
              </Typography>
            </Box>

            <Box className={styles.emailInputContainer}>
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
                placeholder="Enter email addresses..."
                className={styles.emailInputField}
              />
            </Box>
            {emailError && (
              <Typography className={styles.emailError}>
                {emailError}
              </Typography>
            )}
          </Box>

          {/* Role Selection */}
          <Box className={styles.roleSection}>
            <RadioGroup
              value={selectedRole}
              onChange={handleRoleChange}
              className={styles.radioGroup}
            >
              <FormControlLabel
                value="admin"
                control={<Radio />}
                label="Admin"
                className={styles.radioLabel}
              />
              <FormControlLabel
                value="member"
                control={<Radio />}
                label="Member"
                className={styles.radioLabel}
              />
              <FormControlLabel
                value="viewer"
                control={<Radio />}
                label={
                  <Box className={styles.viewerLabel}>
                    <Typography>Viewer (Read-only)</Typography>
                    <Typography className={styles.freeLabel}>Free</Typography>
                  </Box>
                }
                className={styles.radioLabel}
              />
            </RadioGroup>
          </Box>

          {/* Personal Message Section */}
          <Box className={styles.personalSection}>
            <Box 
              className={styles.personalHeader}
              onClick={handlePersonalExpand}
            >
              <Typography className={styles.personalTitle}>
                Make your invite more personal
              </Typography>
              <IconButton size="small">
                {isPersonalExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={isPersonalExpanded}>
              <Box className={styles.personalContent}>
                <Box className={styles.messageGroup}>
                  <Typography className={styles.messageLabel}>
                    Write a message (optional)
                  </Typography>
                  <TextareaAutosize
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="Add context for new members"
                    className={styles.messageTextarea}
                    minRows={3}
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>
        </Box>

        {/* Footer */}
        <Box className={styles.modalFooter}>
          <Button
            variant="contained"
            className={styles.inviteButton}
            size="large"
            onClick={handleInviteSubmit}
            disabled={isLoading || emailTags.length === 0 || (selectedRole !== 'admin' && !selectedEntity)}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {isLoading ? 'Sending...' : 'Invite'}
          </Button>
        </Box>
      </Box>
      )}
    </Modal>
  );
};

export default InviteModal; 
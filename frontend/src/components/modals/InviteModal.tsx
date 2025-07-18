import React, { useState } from 'react';
import { 
  Box, 
  Modal, 
  Typography, 
  IconButton, 
  TextField, 
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
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { 
  Close, 
  ExpandMore, 
  ExpandLess, 
  Google 
} from '@mui/icons-material';
import { useInviteModalStore } from '../../store/modalStore';
import { useProfileStore } from '../../store/profileStore';
import styles from './InviteModal.module.scss';

interface InviteModalProps {
  // Optional props for customization
  title?: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ 
  title = "Invite to users MyVat"
}) => {
  const { isModalOpen, closeModal } = useInviteModalStore();
  const { entities } = useProfileStore();
  
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
    
    // Check if there are any invalid emails left
    const hasInvalidEmails = updatedTags.some(tag => !tag.isValid);
    if (!hasInvalidEmails) {
      setEmailError('');
    }
  };

  const handlePersonalExpand = () => {
    setIsPersonalExpanded(!isPersonalExpanded);
  };



  const handleInviteSubmit = () => {
    // TODO: Implement invite functionality
    console.log('Invite submitted:', {
      selectedEntity,
      selectedRole,
      emailTags,
      personalMessage
    });
    closeModal();
  };

  return (
    <Modal open={isModalOpen} onClose={closeModal}>
      <Box className={styles.modalContainer}>
        <Box className={styles.modalHeader}>
          <Typography variant="h6" className={styles.modalTitle}>
            {title}
          </Typography>
          <IconButton onClick={closeModal} className={styles.closeButton}>
            <Close />
          </IconButton>
        </Box>

        <Box className={styles.modalContent}>
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
          >
            Invite
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default InviteModal; 
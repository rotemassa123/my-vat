import React from 'react';
import { Box, Typography } from '@mui/material';
import CreateAccountForm from './components/CreateAccountForm/CreateAccountForm';
import styles from './CreateAccountsPage.module.scss';

const CreateAccountsPage: React.FC = () => {
  return (
    <Box className={styles.createAccountPage}>
      {/* Header */}
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.pageTitle}>
          Create Account
        </Typography>
      </Box>

      {/* Form Container */}
      <Box className={styles.formContainer}>
        <CreateAccountForm />
      </Box>
    </Box>
  );
};

export default CreateAccountsPage;

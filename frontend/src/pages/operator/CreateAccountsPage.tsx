import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import CreateAccountForm from './components/CreateAccountForm/CreateAccountForm';
import styles from './CreateAccountsPage.module.scss';

const PAGE_TITLE = 'Create Account';
const PAGE_SUBTITLE = 'Invite a new company to MyVAT and assign admin access.';

const CreateAccountsPage: React.FC = () => {
  return (
    <Box className={styles.createAccountPage}>
      <Typography variant="h4" className={styles.title}>
        {PAGE_TITLE}
      </Typography>
      <Typography variant="body1" className={styles.subtitle}>
        {PAGE_SUBTITLE}
      </Typography>

      <Card className={styles.formCard}>
        <CardContent className={styles.cardContent}>
          <Box className={styles.formContainer}>
            <CreateAccountForm />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateAccountsPage;

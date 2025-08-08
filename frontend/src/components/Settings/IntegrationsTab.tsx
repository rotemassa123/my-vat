import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';
import styles from './IntegrationsTab.module.scss';

const IntegrationsTab: React.FC = () => {
  const handleConnectGoogleDrive = () => {
    // TODO: Implement Google Drive connection
    console.log('Connect Google Drive clicked');
  };

  const handleConnectDropbox = () => {
    // TODO: Implement Dropbox connection
    console.log('Connect Dropbox clicked');
  };

  return (
    <Card className={styles.card}>
      <CardContent>
        <Typography variant="h6" className={styles.sectionTitle}>
          Connected Services
        </Typography>

        <Box className={styles.integrationsSection}>
          <Typography variant="subtitle1" className={styles.subsectionTitle}>
            File Storage Integrations
          </Typography>
          
          <List className={styles.integrationList}>
            <ListItem className={styles.integrationItem}>
              <ListItemIcon>
                <GoogleIcon className={styles.integrationIcon} />
              </ListItemIcon>
              <ListItemText
                primary="Google Drive"
                secondary="Connect to upload files directly from Google Drive"
              />
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleConnectGoogleDrive}
              >
                Connect
              </Button>
            </ListItem>
            
            <ListItem className={styles.integrationItem}>
              <ListItemIcon>
                <CloudIcon className={styles.integrationIcon} />
              </ListItemIcon>
              <ListItemText
                primary="Dropbox"
                secondary="Connect to upload files directly from Dropbox"
              />
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleConnectDropbox}
              >
                Connect
              </Button>
            </ListItem>
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default IntegrationsTab; 
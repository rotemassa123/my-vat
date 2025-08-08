import React, { useState } from 'react';
import { Box } from '@mui/material';
import {
  SettingsHeader,
  SettingsTabs,
  ProfileTab,
  SecurityTab,
  IntegrationsTab,
  TabPanel,
} from '../components/Settings';
import styles from './SettingsPage.module.scss';

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className={styles.settingsContainer}>
      {/* Header */}
      <SettingsHeader />

      {/* Main Content */}
      <Box className={styles.content}>
        {/* Tabs */}
        <SettingsTabs value={tabValue} onChange={handleTabChange} />

        {/* Tab Content */}
        <Box className={styles.tabContent}>
          <TabPanel value={tabValue} index={0}>
            <ProfileTab />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <SecurityTab />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <IntegrationsTab />
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage; 
import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  IntegrationInstructions as IntegrationIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import styles from './SettingsTabs.module.scss';

interface SettingsTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({ value, onChange }) => {
  const tabs = [
    { label: 'Profile', icon: <PersonIcon />, index: 0 },
    { label: 'Security', icon: <SecurityIcon />, index: 1 },
    { label: 'Integrations', icon: <IntegrationIcon />, index: 2 },
    { label: 'Tickets', icon: <SupportIcon />, index: 3 },
  ];

  return (
    <Box className={styles.tabsContainer}>
      <Tabs
        value={value}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        className={styles.tabs}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.index}
            icon={tab.icon}
            label={tab.label}
            className={styles.tab}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default SettingsTabs; 
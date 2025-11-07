import React from 'react';
import MetricCard from '../components/dashboard/MetricCard';
import MonthlyTrendsChart from '../components/dashboard/MonthlyTrendsChart';
import ClaimStatusChart from '../components/dashboard/ClaimStatusChart';
import LatestActivity from '../components/dashboard/LatestActivity';
import { CycleIcon, ClockIcon, AlertIcon } from '../components/dashboard/DashboardIcons';
import styles from './DashboardPage.module.scss';

const DashboardPage: React.FC = () => {
  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.metricsRow}>
        <MetricCard 
          icon="$"
          title="Total Claimed"
          amount="$31,103.90"
          growth={12.3}
        />
        <MetricCard 
          icon={<CycleIcon />}
          title="Total Refunded"
          amount="$26,675.43"
          growth={12.3}
          theme="green"
        />
        <MetricCard 
          icon={<ClockIcon />}
          title="Pending in Tax Offices"
          amount="$4207.04"
          growth={12.3}
          theme="orange"
        />
        <MetricCard 
          icon={<AlertIcon />}
          title="Rejected Claims"
          amount="$221.42"
          growth={12.3}
          theme="red"
        />
      </div>
      <div className={styles.chartsRow}>
        <MonthlyTrendsChart />
        <ClaimStatusChart 
          refunded={70}
          pending={15}
          rejected={15}
        />
        <LatestActivity />
      </div>
    </div>
  );
};

export default DashboardPage; 
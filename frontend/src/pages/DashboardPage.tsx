import React, { useMemo } from 'react';
import MetricCard from '../components/dashboard/MetricCard';
import MonthlyTrendsChart from '../components/dashboard/MonthlyTrendsChart';
import ClaimStatusChart from '../components/dashboard/ClaimStatusChart';
import LatestActivity from '../components/dashboard/LatestActivity';
import { CycleIcon, ClockIcon, AlertIcon } from '../components/dashboard/DashboardIcons';
import { useAccountStore } from '../store/accountStore';
import styles from './DashboardPage.module.scss';

const DashboardPage: React.FC = () => {
  const { statistics } = useAccountStore();

  // Aggregate statistics across all entities
  const aggregatedStats = useMemo(() => {
    const totals = statistics.reduce(
      (acc, stat) => {
        const data = stat.data;
        acc.totalClaimed += Number(data.total_claimed);
        acc.totalRefunded += Number(data.total_refunded);
        acc.pendingAmount += Number(data.pending_amount);
        acc.rejectedAmount += Number(data.rejected_amount);
        return acc;
      },
      {
        totalClaimed: 0,
        totalRefunded: 0,
        pendingAmount: 0,
        rejectedAmount: 0,
      }
    );

    const refundedPercentage = totals.totalClaimed > 0 
      ? Math.round((totals.totalRefunded / totals.totalClaimed) * 100) 
      : 0;
    const pendingPercentage = totals.totalClaimed > 0 
      ? Math.round((totals.pendingAmount / totals.totalClaimed) * 100) 
      : 0;
    const rejectedPercentage = totals.totalClaimed > 0 
      ? Math.round((totals.rejectedAmount / totals.totalClaimed) * 100) 
      : 0;
    // Remaining unprocessed amount
    const remainingAmount = totals.totalClaimed - totals.totalRefunded - totals.pendingAmount - totals.rejectedAmount;
    const remainingPercentage = totals.totalClaimed > 0 
      ? Math.round((remainingAmount / totals.totalClaimed) * 100) 
      : 0;

    return {
      ...totals,
      refundedPercentage,
      pendingPercentage,
      rejectedPercentage,
      remainingPercentage,
    };
  }, [statistics]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.metricsRow}>
        <MetricCard 
          icon="$"
          title="Total Claimed"
          amount={formatCurrency(aggregatedStats.totalClaimed)}
          growth={12.3}
        />
        <MetricCard 
          icon={<CycleIcon />}
          title="Total Refunded"
          amount={formatCurrency(aggregatedStats.totalRefunded)}
          growth={12.3}
          theme="green"
        />
        <MetricCard 
          icon={<ClockIcon />}
          title="Pending in Tax Offices"
          amount={formatCurrency(aggregatedStats.pendingAmount)}
          growth={12.3}
          theme="orange"
        />
        <MetricCard 
          icon={<AlertIcon />}
          title="Rejected Claims"
          amount={formatCurrency(aggregatedStats.rejectedAmount)}
          growth={12.3}
          theme="red"
        />
      </div>
      <div className={styles.chartsRow}>
        <MonthlyTrendsChart />
        <ClaimStatusChart 
          claimed={aggregatedStats.remainingPercentage}
          refunded={aggregatedStats.refundedPercentage}
          pending={aggregatedStats.pendingPercentage}
          rejected={aggregatedStats.rejectedPercentage}
        />
        <LatestActivity />
      </div>
    </div>
  );
};

export default DashboardPage; 
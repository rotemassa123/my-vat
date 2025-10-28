import React from 'react';
import MetricCard from '../components/dashboard/MetricCard';
import MonthlyTrendsChart from '../components/dashboard/MonthlyTrendsChart';
import ClaimStatusChart from '../components/dashboard/ClaimStatusChart';
import LatestActivity from '../components/dashboard/LatestActivity';

const DashboardPage: React.FC = () => {
  // Add responsive CSS for margin adjustments
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      div.dashboard-charts-row {
        margin-top: 48px !important;
      }
      
      @media (min-width: 1400px) {
        div.dashboard-charts-row {
          margin-top: 32px !important;
        }
      }
      
      @media (max-width: 768px) {
        div.dashboard-charts-row {
          margin-top: 24px !important;
        }
      }
      
      @media (max-width: 576px) {
        div.dashboard-charts-row {
          margin-top: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  // SVG icon for the cycle/refresh icon
  const CycleIcon = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.032 28.448C6.508 23.584 6.588 15.96 11.288 11.226C13.1297 9.36213 15.5249 8.14414 18.116 7.754L17.978 3.6C14.3403 4.03732 10.9583 5.69484 8.384 8.302C2.086 14.642 2.01 24.88 8.138 31.364L4.656 34.868L15.676 35.47L15.646 23.802L11.032 28.448ZM24.326 4.53L24.356 16.198L28.97 11.554C33.494 16.422 33.414 24.046 28.714 28.776C26.8723 30.6399 24.4771 31.8579 21.886 32.248L22.024 36.4C25.6612 35.9606 29.0431 34.3042 31.62 31.7C37.916 25.356 37.992 15.118 31.864 8.638L35.346 5.13L24.326 4.53Z" fill="currentColor"/>
    </svg>
  );

  // SVG icon for the clock/time icon
  const ClockIcon = () => (
    <svg width="40" height="40" viewBox="0 0 34 37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.6667 0C25.8717 0 33.3333 7.46167 33.3333 16.6667C33.3333 25.8717 25.8717 33.3333 16.6667 33.3333C7.46167 33.3333 0 25.8717 0 16.6667C0 7.46167 7.46167 0 16.6667 0ZM16.6667 6.66667C16.2246 6.66667 15.8007 6.84226 15.4882 7.15482C15.1756 7.46738 15 7.89131 15 8.33333V16.6667C15.0001 17.1087 15.1758 17.5325 15.4883 17.845L20.4883 22.845C20.8027 23.1486 21.2237 23.3166 21.6607 23.3128C22.0977 23.309 22.5157 23.1337 22.8247 22.8247C23.1337 22.5157 23.309 22.0977 23.3128 21.6607C23.3166 21.2237 23.1486 20.8027 22.845 20.4883L18.3333 15.9767V8.33333C18.3333 7.89131 18.1577 7.46738 17.8452 7.15482C17.5326 6.84226 17.1087 6.66667 16.6667 6.66667Z" fill="currentColor"/>
    </svg>
  );

  // SVG icon for the alert/warning icon
  const AlertIcon = () => (
    <svg width="40" height="40" viewBox="0 0 34 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.0549 1.25L33.4449 26.1733C33.6644 26.5534 33.7799 26.9845 33.7799 27.4233C33.7799 27.8622 33.6644 28.2933 33.445 28.6733C33.2255 29.0534 32.91 29.3689 32.5299 29.5884C32.1499 29.8078 31.7188 29.9233 31.2799 29.9233H2.49994C2.0611 29.9233 1.63 29.8078 1.24996 29.5884C0.86992 29.3689 0.554334 29.0534 0.334921 28.6733C0.115507 28.2933 -2.78708e-06 27.8622 0 27.4233C2.78718e-06 26.9845 0.115518 26.5534 0.334936 26.1733L14.7249 1.25C15.6866 -0.416667 18.0916 -0.416667 19.0549 1.25ZM16.8899 21.0033C16.4479 21.0033 16.024 21.1789 15.7114 21.4915C15.3989 21.804 15.2233 22.228 15.2233 22.67C15.2233 23.112 15.3989 23.536 15.7114 23.8485C16.024 24.1611 16.4479 24.3367 16.8899 24.3367C17.332 24.3367 17.7559 24.1611 18.0684 23.8485C18.381 23.536 18.5566 23.112 18.5566 22.67C18.5566 22.228 18.381 21.804 18.0684 21.4915C17.7559 21.1789 17.332 21.0033 16.8899 21.0033ZM16.8899 9.33667C16.4817 9.33672 16.0877 9.48659 15.7826 9.75786C15.4776 10.0291 15.2827 10.4029 15.2349 10.8083L15.2233 11.0033V17.67C15.2237 18.0948 15.3864 18.5034 15.678 18.8123C15.9696 19.1212 16.3682 19.3071 16.7923 19.332C17.2163 19.3568 17.6339 19.2189 17.9597 18.9462C18.2854 18.6736 18.4948 18.2868 18.5449 17.865L18.5566 17.67V11.0033C18.5566 10.5613 18.381 10.1374 18.0684 9.82482C17.7559 9.51226 17.332 9.33667 16.8899 9.33667Z" fill="currentColor"/>
    </svg>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold" style={{ width: '100%', marginBottom: '24px' }}>Dashboard</h1>
      <div style={{display: 'flex', flexDirection: 'row', gap: '32px'}}>
        <MetricCard 
          icon="$"
          title="Total Claimed"
          amount="$2458.90"
          growth={12.3}
        />
        <MetricCard 
          icon={<CycleIcon />}
          title="Total Refunded"
          amount="$2458.90"
          growth={12.3}
          theme="green"
        />
        <MetricCard 
          icon={<ClockIcon />}
          title="Pending in Tax Offices"
          amount="$2458.90"
          growth={12.3}
          theme="orange"
        />
        <MetricCard 
          icon={<AlertIcon />}
          title="Rejected Claims"
          amount="$2458.90"
          growth={12.3}
          theme="red"
        />
      </div>
      <div style={{display: 'flex', flexDirection: 'row', gap: '32px', height: '100%', marginTop: '48px' }}>
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
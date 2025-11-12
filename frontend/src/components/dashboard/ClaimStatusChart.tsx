import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { Box, Typography } from '@mui/material';
import classNames from 'classnames';
import styles from './ClaimStatusChart.module.scss';

interface ClaimStatusChartProps {
  claimed: number;
  refunded: number;
  pending: number;
  rejected: number;
  className?: string;
}

interface LegendItemProps {
  label: string;
  value: number;
  color: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ 
  label, 
  value, 
  color
}) => (
  <Box className={styles.legendItem}>
    <Box 
      className={styles.legendDot}
      sx={{ backgroundColor: color }}
    />
    <Typography className={styles.legendText} sx={{ color: '#1a1a1a' }}>
      {label}: {value}%
    </Typography>
  </Box>
);

const ClaimStatusChart: React.FC<ClaimStatusChartProps> = ({ 
  refunded, 
  pending, 
  rejected, 
  className 
}) => {  
  const data = [
    { id: 0, value: refunded },
    { id: 1, value: pending },
    { id: 2, value: rejected },
  ].filter(item => item.value > 0);
  
  const legendColors = [
    '#1f77b4',
    '#ffbb33',
    '#d62728',
  ];

  return (
    <Box className={classNames(styles.container, className)}>
      <Typography className={styles.title}>
        Claim Status
      </Typography>

      <Box className={styles.chartContainer}>
        <PieChart
          series={[
            {
              data,
              innerRadius: 0,
              outerRadius: 100,
              paddingAngle: 2,
              cornerRadius: 5,
              arcLabel: (item) => `${item.value}%`,
              arcLabelMinAngle: 5,
              highlightScope: { fade: 'global', highlight: 'item' },
            },
          ]}
          width={500}
          height={500}
        />
      </Box>

      <Box className={styles.legend}>
        <Box className={styles.legendRow}>
          <LegendItem 
            label="Refunded"
            value={refunded}
            color={legendColors[0]}
          />
        </Box>
        <Box className={styles.legendRow}>
          <LegendItem 
            label="Pending"
            value={pending}
            color={legendColors[1]}
          />
        </Box>
        <Box className={styles.legendRow}>
          <LegendItem 
            label="Rejected"
            value={rejected}
            color={legendColors[2]}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ClaimStatusChart;

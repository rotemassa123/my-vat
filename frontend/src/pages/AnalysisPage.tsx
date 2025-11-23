import React from 'react';
import { Box, Typography } from '@mui/material';
import { WidgetPaper } from '../components/analysis/WidgetPaper';
import type { Widget, WidgetType, ChartDataPoint } from '../types/widget';

const AnalysisPage: React.FC = () => {
  // Create mock widgets with fake data
  const mockWidgets: Array<Widget & { demoData: ChartDataPoint[] }> = [
    {
      id: 'demo-pie-1',
      userId: 'demo-user',
      type: 'pie' as WidgetType,
      dataConfig: {
        source: 'invoices',
        xAxisField: 'Category',
        yAxisField: 'Revenue',
      },
      displayConfig: {
        title: 'Revenue by Category',
        showLegend: true,
        showLabels: true,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      demoData: [
        { label: 'Office Supplies', value: 4500 },
        { label: 'Travel', value: 3200 },
        { label: 'Software', value: 2800 },
        { label: 'Marketing', value: 2100 },
        { label: 'Other', value: 1400 },
      ],
    },
    {
      id: 'demo-bar-1',
      userId: 'demo-user',
      type: 'bar' as WidgetType,
      dataConfig: {
        source: 'invoices',
        xAxisField: 'Month',
        yAxisField: 'Amount',
      },
      displayConfig: {
        title: 'Monthly Revenue',
        showGridLines: true,
        axisLabels: { x: 'Month', y: 'Amount (€)' },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      demoData: [
        { label: 'Jan', value: 12000 },
        { label: 'Feb', value: 15000 },
        { label: 'Mar', value: 18000 },
        { label: 'Apr', value: 14000 },
        { label: 'May', value: 22000 },
        { label: 'Jun', value: 19000 },
      ],
    },
    {
      id: 'demo-line-1',
      userId: 'demo-user',
      type: 'line' as WidgetType,
      dataConfig: {
        source: 'invoices',
        xAxisField: 'Date',
        yAxisField: 'Revenue',
      },
      displayConfig: {
        title: 'Revenue Trend',
        showGridLines: true,
        axisLabels: { x: 'Date', y: 'Revenue (€)' },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      demoData: [
        { label: 'Week 1', value: 4500 },
        { label: 'Week 2', value: 5200 },
        { label: 'Week 3', value: 4800 },
        { label: 'Week 4', value: 6100 },
        { label: 'Week 5', value: 5500 },
        { label: 'Week 6', value: 6800 },
        { label: 'Week 7', value: 7200 },
        { label: 'Week 8', value: 6900 },
      ],
    },
  ];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Fixed Header */}
      <Box
        sx={{
          flexShrink: 0,
          p: 3,
          pb: 2,
          backgroundColor: 'transparent',
        }}
      >
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, color: '#001441' }}>
          Analysis
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          Widget previews with sample data
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 3,
          py: 3,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(2, minmax(0, 1fr))',
            },
            gap: '1.5rem',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {mockWidgets.map((widget) => (
            <WidgetPaper key={widget.id} widget={widget} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AnalysisPage; 
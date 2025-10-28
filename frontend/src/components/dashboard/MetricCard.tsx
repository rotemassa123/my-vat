import React from 'react';

interface MetricCardProps {
  icon: string | React.ReactNode; // Allow both string and React node for SVG
  title: string;
  amount: string;
  growth: number; // positive or negative percentage
  theme?: 'blue' | 'green' | 'orange' | 'red'; // Color theme
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, amount, growth, theme = 'blue' }) => {
  const isPositiveGrowth = growth >= 0;
  const growthIcon = isPositiveGrowth ? '↗' : '↘';
  
  // Theme colors
  const themeColors = {
    blue: {
      background: '#e4f3ff',
      iconColor: '#0131ff',
      growthColor: isPositiveGrowth ? '#4CAF50' : '#F44336'
    },
    green: {
      background: '#e1ffe5',
      iconColor: '#10b981',
      growthColor: isPositiveGrowth ? '#10b981' : '#F44336'
    },
    orange: {
      background: '#fff7ed',
      iconColor: '#f97316',
      growthColor: isPositiveGrowth ? '#4CAF50' : '#F44336'
    },
    red: {
      background: '#fef2f2',
      iconColor: '#ef4444',
      growthColor: isPositiveGrowth ? '#4CAF50' : '#F44336'
    }
  };

  const colors = themeColors[theme];

  return (
    <div style={{
      backgroundColor: colors.background,
      borderRadius: '20px',
      padding: '20px',
      position: 'relative',
      width: 'calc(25% - 24px)',
      height: '135px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    }}>
      {/* Icon */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '70px',
        height: '70px',
        backgroundColor: 'white',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        color: colors.iconColor
      }}>
        {typeof icon === 'string' ? icon : icon}
      </div>

      {/* Content */}
      <div style={{ width: '201px' }}>
        {/* Title */}
        <div style={{
          fontSize: '14px',
          color: '#7f7f7f',
          fontWeight: '500',
          fontFamily: 'Poppins, sans-serif',
          marginBottom: '6px'
        }}>
          {title}
        </div>

        {/* Value */}
        <div style={{
          fontSize: '24px',
          color: '#1a1a1a',
          fontWeight: '600',
          fontFamily: 'Poppins, sans-serif',
          marginBottom: '6px'
        }}>
          {amount}
        </div>

        {/* Change Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ color: colors.growthColor, fontSize: '18px' }}>{growthIcon}</div>
          <div style={{
            fontSize: '12px',
            color: '#555555',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'normal'
          }}>
            <span style={{ color: colors.growthColor, fontWeight: '500', fontFamily: 'Poppins, sans-serif' }}>
              {Math.abs(growth)}%
            </span>
            <span style={{ fontFamily: 'Poppins, sans-serif' }}>
              {' from last month'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;

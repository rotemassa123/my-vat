import React from 'react';

interface MonthlyTrendsChartProps {
  className?: string;
}

const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ className }) => {
  // Add responsive CSS for height control
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .monthly-trends-chart-container {
        height: 430px !important;
      }
      
      @media (max-width: 1599px) {
        .monthly-trends-y-axis {
          top: -40px !important;
        }
        
        .monthly-trends-x-axis {
          bottom: 60px !important;
          z-index: 10 !important;
        }
        
        .monthly-trends-legend {
          position: absolute !important;
          top: 33px !important;
          right: 20px !important;
          margin-top: 0 !important;
          display: flex !important;
          gap: 8px !important;
          z-index: 10 !important;
        }
        
        .monthly-trends-legend > div {
          border: 0.5px solid #c6c6c6 !important;
          border-radius: 50px !important;
          padding: 8px 10px !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          height: 28px !important;
          background: white !important;
        }
        
        .monthly-trends-legend span {
          font-size: 12px !important;
          font-weight: 500 !important;
          font-family: Poppins, sans-serif !important;
          color: black !important;
        }
        
        .monthly-trends-legend .legend-dot {
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
        }
        
        .monthly-trends-chart-svg {
          top: -60px !important;
        }
      }
      
      @media (min-width: 1600px) {
        .monthly-trends-chart-container {
          height: auto !important;
        }
        
        .monthly-trends-y-axis {
          top: 20px !important;
        }
        
        .monthly-trends-x-axis {
          bottom: 0px !important;
        }
        
        .monthly-trends-legend {
          margin-top: 20px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={`monthly-trends-chart-container ${className || ''}`} style={{
      width: 'calc(50% - 16px)',
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '30px',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Title */}
      <div style={{
        fontSize: '20px',
        fontWeight: '600',
        fontFamily: 'Poppins, sans-serif',
        color: '#1a1a1a',
        marginBottom: '20px'
      }}>
        Monthly Trends
      </div>


      {/* Chart Area */}
      <div style={{
        height: '345px',
        width: '100%',
        marginTop: '60px',
        position: 'relative',
        borderRadius: '8px',
        padding: '20px'
      }}>
        {/* Y-axis labels */}
        <div className="monthly-trends-y-axis" style={{
          position: 'absolute',
          left: '0',
          height: '305px',
          width: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingRight: '10px'
        }}>
          {['$38k', '$28.5k', '$19k', '$9.5k', '$0k'].map((label, index) => (
            <div key={index} style={{
              fontSize: '17px',
              fontFamily: 'Poppins, sans-serif',
              color: '#7f7f7f',
              textAlign: 'right'
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="monthly-trends-x-axis" style={{
          position: 'absolute',
          left: '40px',
          right: '0',
          height: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}>
          {['Feb', 'Apr', 'Jun', 'Aug', 'Oct', 'Dec'].map((label, index) => (
            <div key={index} style={{
              fontSize: '17px',
              fontFamily: 'Poppins, sans-serif',
              color: '#7f7f7f',
              textAlign: 'center'
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Chart visualization - Static SVG from Figma */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '60px',
          right: '20px',
          bottom: '40px',
          backgroundColor: 'white',
          borderRadius: '4px'
        }}>
          {/* Combined Chart with both lines */}
          <svg className="monthly-trends-chart-svg" width="100%" height="100%" viewBox="0 0 483 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: '-20px', left: 0 }}>
            {/* Grid lines */}
            {/* Horizontal grid lines */}
            <line x1="0" y1="40" x2="483" y2="40" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="0" y1="80" x2="483" y2="80" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="0" y1="120" x2="483" y2="120" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="0" y1="160" x2="483" y2="160" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            
            {/* Vertical grid lines */}
            <line x1="60.375" y1="0" x2="60.375" y2="200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="120.75" y1="0" x2="120.75" y2="200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="181.125" y1="0" x2="181.125" y2="200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="241.5" y1="0" x2="241.5" y2="200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="301.875" y1="0" x2="301.875" y2="200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="362.25" y1="0" x2="362.25" y2="200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
            <line x1="422.625" y1="0" x2="422.625" y2="200" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>

            {/* Amount Claimed line (blue) - adjusted for new height */}
            <path d="M7.04464 172.703C21.254 159.225 35.4633 145.746 49.6707 145.746C63.88 145.746 78.0893 162.69 92.2987 162.69C106.506 162.69 120.715 137.018 134.925 126.492C149.134 115.967 163.341 99.5371 177.551 99.5371C191.76 99.5371 205.969 122.642 220.177 122.642C234.386 122.642 248.595 93.119 262.805 84.134C277.012 75.1477 291.222 68.7296 305.431 68.7296C319.64 68.7296 333.848 95.686 348.057 95.686C362.266 95.686 376.476 69.3724 390.683 61.0288C404.892 52.6852 419.102 52.0438 433.311 45.6257C447.518 39.2077 461.728 30.8641 475.937 22.5205" stroke="#3B82F6" strokeWidth="2.83544"/>
            
            {/* Amount Refunded line (green) - adjusted for new height */}
            <path d="M7.04448 192.849C21.2538 182.223 35.4631 171.595 49.6705 171.595C63.8799 171.595 78.0892 181.607 92.2985 181.607C106.506 181.607 120.715 162.969 134.925 154.882C149.134 146.796 163.341 134.087 177.551 134.087C191.76 134.087 205.969 153.341 220.177 153.341C234.386 153.341 248.595 130.879 262.805 122.535C277.012 114.1914 291.221 103.2808 305.431 103.2808C319.64 103.2808 333.847 130.237 348.057 130.237C362.266 130.237 376.475 106.4905 390.683 99.4297C404.892 92.3703 419.101 91.7289 433.311 87.8778C447.518 84.0267 461.728 80.1756 475.937 76.3258" stroke="#10B981" strokeWidth="2.83544"/>

            {/* Data points for Amount Claimed (blue) - adjusted for new height */}
            <circle cx="7.04443" cy="172.224" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="49.671" cy="145.269" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="92.2976" cy="162.212" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="134.924" cy="126.015" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="177.551" cy="99.059" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="220.177" cy="122.164" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="262.804" cy="83.6556" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="305.43" cy="68.2524" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="348.057" cy="95.2081" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="390.684" cy="60.5508" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="433.31" cy="45.1476" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>
            <circle cx="475.937" cy="22.0427" r="5.7" fill="white" stroke="#3B82F6" strokeWidth="2.83544"/>

            {/* Data points for Amount Refunded (green) - adjusted for new height */}
            <circle cx="7.04443" cy="192.567" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="49.671" cy="171.113" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="92.2975" cy="181.125" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="134.924" cy="154.399" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="177.551" cy="133.605" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="220.177" cy="152.859" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="262.804" cy="122.0524" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="305.43" cy="102.7984" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="348.057" cy="129.7541" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="390.684" cy="98.9476" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="433.31" cy="87.3951" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
            <circle cx="475.937" cy="75.8427" r="5.7" fill="white" stroke="#10B981" strokeWidth="2.83544"/>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="monthly-trends-legend" style={{
        display: 'flex',
        gap: '32px',
        justifyContent: 'center',
        marginTop: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div className="legend-dot" style={{
            backgroundColor: '#3b82f6'
          }} />
          <span style={{
            fontSize: '18px',
            fontWeight: '500',
            fontFamily: 'Poppins, sans-serif',
            color: '#3b82f6'
          }}>
            Amount Claimed
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div className="legend-dot" style={{
            backgroundColor: '#10b981'
          }} />
          <span style={{
            fontSize: '18px',
            fontWeight: '500',
            fontFamily: 'Poppins, sans-serif',
            color: '#10b981'
          }}>
            Amount Refunded
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrendsChart;

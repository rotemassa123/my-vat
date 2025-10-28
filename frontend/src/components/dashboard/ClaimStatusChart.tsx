import React from 'react';

interface ClaimStatusChartProps {
  refunded: number; // percentage (0-100)
  pending: number;  // percentage (0-100)
  rejected: number; // percentage (0-100)
  className?: string;
}

const ClaimStatusChart: React.FC<ClaimStatusChartProps> = ({ 
  refunded, 
  pending, 
  rejected, 
  className 
}) => {
  // Add responsive CSS for height control
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .claim-status-chart-container {
        height: 430px !important;
      }
      
      .claim-status-chart-svg {
        width: 200px !important;
        height: 200px !important;
      }
      
      .claim-status-chart-legend {
        font-size: 16px !important;
      }
      
      @media (min-width: 1600px) {
        .claim-status-chart-container {
          height: auto !important;
        }
        
        .claim-status-chart-svg {
          width: 250px !important;
          height: 250px !important;
        }
        
        .claim-status-chart-legend {
          font-size: 18px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={`claim-status-chart-container ${className || ''}`} style={{
      width: 'calc(25% - 24px)',
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '30px',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Title */}
      <div style={{
        fontSize: '20px',
        fontWeight: '600',
        fontFamily: 'Poppins, sans-serif',
        color: '#1a1a1a',
        marginBottom: '30px',
        textAlign: 'left'
      }}>
        Claim Status
      </div>

      {/* Pie Chart */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '242px',
        marginBottom: '30px'
      }}>
        <svg className="claim-status-chart-svg" width="242" height="242" viewBox="0 0 242 242" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          {/* Refunded segments (Blue) */}
          <path d="M120.992 217.796V242C87.579 242 57.3346 228.453 35.4471 206.549L52.5591 189.434C70.0986 206.976 94.2853 217.796 120.992 217.796Z" fill="#3270FF"/>
          <path d="M52.5594 189.434L35.4473 206.548C13.5452 184.658 0 154.395 0 121.007H24.2015C24.2015 147.747 35.0494 171.937 52.5594 189.434Z" fill="#3270FF"/>
          <path d="M52.5446 52.5511C35.0494 70.0632 24.2015 94.2824 24.2015 121.007H0C0 87.5753 13.5452 57.3419 35.4473 35.437L52.5446 52.5511Z" fill="#3270FF"/>
          <path d="M120.992 0V24.1897C94.2706 24.1897 70.0838 35.0389 52.5444 52.551L35.4471 35.4369C57.3346 13.5468 87.5643 0 120.992 0Z" fill="#3270FF"/>
          <path d="M206.553 35.4369L189.441 52.551C171.931 35.0389 147.744 24.1897 120.993 24.1897V0C154.406 0 184.665 13.5468 206.553 35.4369Z" fill="#3270FF"/>
          <path d="M242 121.007H217.798C217.798 94.2824 206.98 70.0779 189.441 52.5511L206.553 35.437C228.455 57.3419 242 87.5753 242 121.007Z" fill="#3270FF"/>
          <path d="M120.993 24.1896V48.394C100.962 48.394 82.8037 56.5162 69.6713 69.665L52.5445 52.5509C70.084 35.0388 94.2707 24.1896 120.993 24.1896Z" fill="#6493FF"/>
          <path d="M189.426 52.5509L172.328 69.665H172.299C159.152 56.5162 141.008 48.394 120.978 48.394V24.1896C147.729 24.1896 171.916 35.0388 189.426 52.5509Z" fill="#6493FF"/>
          <path d="M217.799 121.007C217.799 147.732 206.98 171.937 189.441 189.434L172.344 172.335C185.461 159.186 193.597 141.055 193.597 121.007H217.799Z" fill="#6493FF"/>
          <path d="M120.993 193.606V217.796C94.2856 217.796 70.1136 206.976 52.5742 189.434L69.6714 172.335C82.8039 185.484 100.962 193.606 120.993 193.606Z" fill="#6493FF"/>
          <path d="M120.993 169.401V193.606C100.962 193.606 82.8038 185.484 69.6714 172.335L86.7834 155.221C95.5236 163.991 107.624 169.401 120.993 169.401Z" fill="#91B2FF"/>
          <path d="M217.799 121.007H193.597C193.597 100.945 185.476 82.799 172.344 69.6796L189.441 52.5656C206.966 70.0629 217.799 94.2821 217.799 121.007Z" fill="#6493FF"/>
          <path d="M193.582 121.007H169.396C169.396 107.637 163.986 95.5352 155.217 86.7644L172.314 69.6651H172.343C185.461 82.7844 193.582 100.945 193.582 121.007Z" fill="#91B2FF"/>
          <path d="M172.314 69.6653L155.216 86.7646C146.447 78.0233 134.346 72.584 120.978 72.584V48.3943C141.023 48.3943 159.181 56.5312 172.314 69.6653Z" fill="#91B2FF"/>
          <path d="M120.993 48.3943V72.584C107.624 72.584 95.5236 78.0233 86.7834 86.7646L69.6714 69.6653C82.8038 56.5312 100.962 48.3943 120.993 48.3943Z" fill="#91B2FF"/>
          <path d="M69.6565 69.6654C56.5093 82.7847 48.3881 100.945 48.3881 120.993H24.2013C24.2013 94.2678 35.0493 70.0634 52.5445 52.5365L69.6565 69.6654Z" fill="#6493FF"/>
          <path d="M86.7833 86.7646C78.0136 95.5354 72.6044 107.638 72.6044 121.008H48.3882C48.3882 100.945 56.5094 82.7993 69.6566 69.68L86.7833 86.7646Z" fill="#91B2FF"/>
          <path d="M69.6565 172.335L52.5592 189.434C35.0493 171.937 24.2013 147.747 24.2013 121.007H48.3881C48.3881 141.055 56.524 159.201 69.6565 172.335Z" fill="#6493FF"/>
          <path d="M86.7831 155.221L69.6711 172.335C56.5239 159.186 48.4027 141.055 48.4027 121.007H72.6042C72.6042 134.363 78.0134 146.465 86.7831 155.221Z" fill="#91B2FF"/>

          {/* Pending segments (Orange/Yellow) - Fixed positioning */}
          <path d="M189.426 189.434C171.916 206.976 147.729 217.796 120.978 217.796V193.606C141.038 193.606 159.181 185.484 172.328 172.335L189.426 189.434Z" fill="#F45D5D"/>
          <path d="M172.343 172.335C159.196 185.484 141.052 193.606 120.993 193.606V169.401C134.361 169.401 146.462 163.991 155.231 155.221L172.343 172.335Z" fill="#FB7D7D"/>
          <path d="M217.799 121.007C217.799 147.732 206.98 171.937 189.441 189.434L172.344 172.335C185.461 159.186 193.597 141.055 193.597 121.007H217.799Z" fill="#F6BD5C"/>
          <path d="M193.582 121.007C193.582 141.07 185.461 159.201 172.329 172.335L155.217 155.221C163.986 146.479 169.396 134.363 169.396 121.007H193.582Z" fill="#F5D296"/>

          {/* Rejected segments (Red) */}
          <path d="M206.553 206.549C184.665 228.453 154.406 242 120.993 242V217.796C147.744 217.796 171.916 206.976 189.441 189.434L206.553 206.549Z" fill="#EB2F2F"/>
          <path d="M242 121.007C242 154.41 228.455 184.673 206.553 206.563L189.441 189.449C206.98 171.952 217.798 147.747 217.798 121.022H242V121.007Z" fill="#F3A92C"/>
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        marginLeft: '0'
      }}>
        {/* Refunded */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#3270FF',
            borderRadius: '50%'
          }} />
          <span className="claim-status-chart-legend" style={{
            fontSize: '18px',
            fontWeight: '500',
            fontFamily: 'Poppins, sans-serif',
            color: '#3270FF'
          }}>
            Refunded: {refunded}%
          </span>
        </div>

        {/* Pending */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#F59E0B',
            borderRadius: '50%'
          }} />
          <span className="claim-status-chart-legend" style={{
            fontSize: '18px',
            fontWeight: '500',
            fontFamily: 'Poppins, sans-serif',
            color: '#F59E0B'
          }}>
            Pending: {pending}%
          </span>
        </div>

        {/* Rejected */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: '#EF4444',
            borderRadius: '50%'
          }} />
          <span className="claim-status-chart-legend" style={{
            fontSize: '18px',
            fontWeight: '500',
            fontFamily: 'Poppins, sans-serif',
            color: '#EF4444'
          }}>
            Rejected: {rejected}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClaimStatusChart;

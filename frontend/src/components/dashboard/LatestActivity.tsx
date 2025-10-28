import React from 'react';
import ReportIcon from '../../assets/temp/d87cf0d62033d01c06a9fc8fae16e0744325da01.svg';
import AlertIconSVG from '../../assets/temp/da1a266fa1250fbc5a6f9f747e4dad6bd304d7d3.svg';
import CycleIconSVG from '../../assets/temp/8c6c466f87263f735293c9722be522061380df40.svg';
import TimeIconSVG from '../../assets/temp/7d9d577969e0fc64ec7a15a836ccf3e70010a4ff.svg';

const LatestActivity: React.FC = () => {
  return (
    <div style={{
      width: 'calc(25% - 24px)',
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Title */}
      <div style={{
        fontSize: '20px',
        fontWeight: '600',
        fontFamily: 'Poppins, sans-serif',
        color: '#1a1a1a',
        marginBottom: '30px'
      }}>
        Latest Activity
      </div>

      {/* Activity Items */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        flex: 1
      }}>
        {/* Activity Item 1 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{
            backgroundColor: '#d7eeff',
            borderRadius: '36.923px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img 
              alt="report" 
              src={ReportIcon}
              style={{ width: '24px', height: '24px' }}
            />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '254px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              color: 'black',
              lineHeight: '1.33'
            }}>
              Submitted claim for Germany
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'Poppins, sans-serif',
              color: '#7f7f7f'
            }}>
              May 10
            </div>
          </div>
        </div>

        {/* Activity Item 2 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{
            backgroundColor: '#d7eeff',
            borderRadius: '36.923px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img 
              alt="alert" 
              src={AlertIconSVG}
              style={{ width: '24px', height: '24px' }}
            />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '260px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              color: 'black',
              lineHeight: '1.33'
            }}>
              Upload needed for France claim
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'Poppins, sans-serif',
              color: '#7f7f7f'
            }}>
              May 10
            </div>
          </div>
        </div>

        {/* Activity Item 3 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{
            backgroundColor: '#d7eeff',
            borderRadius: '36.923px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img 
              alt="cycle" 
              src={CycleIconSVG}
              style={{ width: '24px', height: '24px' }}
            />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '254px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              color: 'black',
              lineHeight: '1.33'
            }}>
              Received refund for Italy claim
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'Poppins, sans-serif',
              color: '#7f7f7f'
            }}>
              May 10
            </div>
          </div>
        </div>

        {/* Activity Item 4 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{
            backgroundColor: '#d7eeff',
            borderRadius: '36.923px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img 
              alt="time" 
              src={TimeIconSVG}
              style={{ width: '24px', height: '24px' }}
            />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '254px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              color: 'black',
              lineHeight: '1.33'
            }}>
              Spain claim is being processed
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'Poppins, sans-serif',
              color: '#7f7f7f'
            }}>
              May 10
            </div>
          </div>
        </div>

        {/* Activity Item 5 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{
            backgroundColor: '#d7eeff',
            borderRadius: '36.923px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img 
              alt="alert" 
              src={AlertIconSVG}
              style={{ width: '24px', height: '24px' }}
            />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '260px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              color: 'black',
              lineHeight: '1.33'
            }}>
              Upload needed for France claim
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'Poppins, sans-serif',
              color: '#7f7f7f'
            }}>
              May 10
            </div>
          </div>
        </div>
      </div>

      {/* View All Activity Button */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          padding: '10px'
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: 'Poppins, sans-serif',
            color: '#004dff',
            whiteSpace: 'nowrap'
          }}>
            View All Activity
          </span>
          <div style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(90deg)'
          }}>
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 4L12 20M12 4L6 10M12 4L18 10" 
                stroke="#004dff" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestActivity;

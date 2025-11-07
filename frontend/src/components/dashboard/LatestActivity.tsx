import React from 'react';
import ReportIcon from '../../assets/temp/d87cf0d62033d01c06a9fc8fae16e0744325da01.svg';
import AlertIconSVG from '../../assets/temp/da1a266fa1250fbc5a6f9f747e4dad6bd304d7d3.svg';
import CycleIconSVG from '../../assets/temp/8c6c466f87263f735293c9722be522061380df40.svg';
import TimeIconSVG from '../../assets/temp/7d9d577969e0fc64ec7a15a836ccf3e70010a4ff.svg';
import styles from './LatestActivity.module.scss';

interface ActivityItemProps {
  icon: string;
  iconAlt: string;
  text: string;
  date: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ icon, iconAlt, text, date }) => (
  <div className={styles.activityItem}>
    <div className={styles.iconContainer}>
      <img 
        alt={iconAlt} 
        src={icon}
        className={styles.iconImage}
      />
    </div>
    <div className={styles.activityContent}>
      <div className={styles.activityText}>
        {text}
      </div>
      <div className={styles.activityDate}>
        {date}
      </div>
    </div>
  </div>
);

const LatestActivity: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        Latest Activity
      </div>

      <div className={styles.activityList}>
        <ActivityItem 
          icon={ReportIcon}
          iconAlt="report"
          text="Submitted claim for Germany"
          date="May 10"
        />
        <ActivityItem 
          icon={AlertIconSVG}
          iconAlt="alert"
          text="Upload needed for France claim"
          date="May 10"
        />
        <ActivityItem 
          icon={CycleIconSVG}
          iconAlt="cycle"
          text="Received refund for Italy claim"
          date="May 10"
        />
        <ActivityItem 
          icon={TimeIconSVG}
          iconAlt="time"
          text="Spain claim is being processed"
          date="May 10"
        />
        <ActivityItem 
          icon={AlertIconSVG}
          iconAlt="alert"
          text="Upload needed for France claim"
          date="May 10"
        />
      </div>

      <div className={styles.viewAllButton}>
        <div className={styles.viewAllLink}>
          <span className={styles.viewAllText}>
            View All Activity
          </span>
          <div className={styles.viewAllIcon}>
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

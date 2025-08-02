import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Block,
} from '@mui/icons-material';
import RoleCombobox from './RoleCombobox';
import EntityCombobox from './EntityCombobox';
import styles from './UserManagement.module.scss';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
  entity: string;
  lastLogin: string;
  createdAt: string;
}

interface UserRowProps {
  user: User;
  onActionClick: (event: React.MouseEvent<HTMLElement>, userId: string) => void;
  onRoleChange: (userId: string, newRole: string, newUserType: number) => Promise<void>;
  onEntityChange: (userId: string, newEntityId: string) => Promise<void>;
  entities: Array<{ _id: string; name: string }>;
}

const UserRow: React.FC<UserRowProps> = ({ user, onActionClick, onRoleChange, onEntityChange, entities }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#4CAF50';
      case 'Inactive':
        return '#FF9800';
      case 'Pending':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle sx={{ fontSize: 16, color: '#4CAF50' }} />;
      case 'Inactive':
        return <Block sx={{ fontSize: 16, color: '#FF9800' }} />;
      case 'Pending':
        return <CheckCircle sx={{ fontSize: 16, color: '#2196F3' }} />;
      default:
        return <CheckCircle sx={{ fontSize: 16, color: '#9E9E9E' }} />;
    }
  };

  return (
    <Box key={user.id} className={styles.tableRow}>
      <Box className={styles.userCell} style={{ width: '30%' }}>
        <Box className={styles.userInfo}>
          <Avatar 
            className={styles.avatar}
            src={user.avatar.startsWith('http') ? user.avatar : undefined}
          >
            {user.avatar.startsWith('http') ? '' : user.avatar}
          </Avatar>
          <Box className={styles.userDetails}>
            <Typography variant="body1" className={styles.userName}>
              {user.name}
            </Typography>
            <Typography variant="body2" className={styles.userEmail}>
              {user.email}
            </Typography>
          </Box>
        </Box>
      </Box>
                           <Box className={styles.roleCell} style={{ width: '12%' }}>
        <RoleCombobox
          currentRole={user.role}
          userId={user.id}
          onRoleChange={onRoleChange}
        />
      </Box>
      <Box className={styles.entityCell} style={{ width: '15%' }}>
        <EntityCombobox
          currentEntity={user.entity}
          userId={user.id}
          userRole={user.role}
          entities={entities}
          onEntityChange={onEntityChange}
        />
      </Box>
      <Box className={styles.statusCell} style={{ width: '12%' }}>
        <Box className={styles.statusContainer}>
          {getStatusIcon(user.status)}
          <Typography 
            variant="body2" 
            className={styles.statusText}
            sx={{ color: getStatusColor(user.status) }}
          >
            {user.status}
          </Typography>
        </Box>
      </Box>
      <Box className={styles.lastLoginCell} style={{ width: '15%' }}>
        <Typography variant="body2" className={styles.lastLoginText}>
          {user.lastLogin}
        </Typography>
      </Box>
      <Box className={styles.createdCell} style={{ width: '12%' }}>
        <Typography variant="body2" className={styles.createdText}>
          {user.createdAt}
        </Typography>
      </Box>
      <Box className={styles.actionCell} style={{ width: '4%' }}>
        <IconButton
          onClick={(e: React.MouseEvent<HTMLElement>) => onActionClick(e, user.id)}
          className={styles.actionButton}
        >
          <MoreVert />
        </IconButton>
      </Box>
    </Box>
  );
};

export default UserRow; 
import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  TextField, 
  InputAdornment, 
  Avatar, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Select, 
  FormControl, 
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { 
  Search, 
  MoreVert, 
  PersonAdd, 
  Edit, 
  Delete, 
  Block, 
  CheckCircle 
} from '@mui/icons-material';
import { useProfileStore } from '../../store/profileStore';
import { useInviteModalStore } from '../../store/modalStore';
import { useUserManagement } from '../../hooks/user/useUserManagement';
import InviteModal from '../modals/InviteModal';
import styles from './UserManagement.module.scss';

// Helper function to create avatar initials
const createAvatarInitials = (fullName: string): string => {
  const names = fullName.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
};

// Helper function to format date
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Never';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'Never';
  }
};

// Helper function to format date with time
const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return 'Never';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Never';
  }
};

// Helper function to map userType to role
const mapUserTypeToRole = (userType: number): string => {
  switch (userType) {
    case 1:
      return 'Admin';
    case 2:
      return 'Member';
    case 3:
      return 'Viewer';
    case 4:
      return 'Guest';
    default:
      return 'Member';
  }
};

// Helper function to format user status for display
const formatUserStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const UserManagement: React.FC = () => {
  const { users: profileUsers, entities } = useProfileStore();
  const { openModal } = useInviteModalStore();
  const { deleteUser, isDeleting, deleteError } = useUserManagement();
  
  // Transform real user data to expected format
  const transformedUsers = useMemo(() => {
    if (!profileUsers || profileUsers.length === 0) {
      return [];
    }
    
    return profileUsers.map(user => {
      const entity = entities.find(e => e._id === user.entityId);
      return {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: mapUserTypeToRole(user.userType),
        status: formatUserStatus(user.status),
        avatar: createAvatarInitials(user.fullName),
        entity: entity?.name || 'Unknown Entity',
        lastLogin: formatDateTime(undefined), // Not available in current data
        createdAt: formatDate(user.created_at)
      };
    });
  }, [profileUsers, entities]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState(transformedUsers);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Update users when transformedUsers changes
  React.useEffect(() => {
    setUsers(transformedUsers);
  }, [transformedUsers]);

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(userId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleEditUser = () => {
    // TODO: Implement edit user functionality
    console.log('Edit user:', selectedUser);
    handleCloseMenu();
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      setUserToDelete(selectedUser);
      setDeleteConfirmOpen(true);
    }
    handleCloseMenu();
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      if (deleteError) {
        console.error('Delete error:', deleteError);
      }
    }
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleBlockUser = () => {
    // TODO: Implement block user functionality
    console.log('Block user:', selectedUser);
    handleCloseMenu();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

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
    <Box className={styles.userManagement}>
      {/* Header */}
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.pageTitle}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          className={styles.addButton}
          onClick={openModal}
        >
          Invite Users
        </Button>
      </Box>

      {/* Filters */}
      <Box className={styles.filtersContainer}>
        <TextField
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          className={styles.searchField}
        />
        
        <FormControl className={styles.filterSelect}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e: SelectChangeEvent<string>) => setRoleFilter(e.target.value)}
            label="Role"
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Member">Member</MenuItem>
            <MenuItem value="Viewer">Viewer</MenuItem>
            <MenuItem value="Guest">Guest</MenuItem>
          </Select>
        </FormControl>

        <FormControl className={styles.filterSelect}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e: SelectChangeEvent<string>) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper} className={styles.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className={styles.tableHeader}>User</TableCell>
              <TableCell className={styles.tableHeader}>Role</TableCell>
              <TableCell className={styles.tableHeader}>Status</TableCell>
              <TableCell className={styles.tableHeader}>Entity</TableCell>
              <TableCell className={styles.tableHeader}>Last Login</TableCell>
              <TableCell className={styles.tableHeader}>Created</TableCell>
              <TableCell className={styles.tableHeader} width="60"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className={styles.tableRow}>
                <TableCell className={styles.userCell}>
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
                </TableCell>
                <TableCell className={styles.roleCell}>
                  <Chip 
                    label={user.role} 
                    className={styles.roleChip}
                    size="small"
                  />
                </TableCell>
                <TableCell className={styles.statusCell}>
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
                </TableCell>
                <TableCell className={styles.entityCell}>
                  <Box className={styles.entityContainer}>
                    <Box className={styles.entityIcon}></Box>
                    <Typography variant="body2" className={styles.entityName}>
                      {user.entity}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell className={styles.lastLoginCell}>
                  <Typography variant="body2" className={styles.lastLoginText}>
                    {user.lastLogin}
                  </Typography>
                </TableCell>
                <TableCell className={styles.createdCell}>
                  <Typography variant="body2" className={styles.createdText}>
                    {user.createdAt}
                  </Typography>
                </TableCell>
                <TableCell className={styles.actionCell}>
                  <IconButton
                    onClick={(e: React.MouseEvent<HTMLElement>) => handleActionClick(e, user.id)}
                    className={styles.actionButton}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        className={styles.actionMenu}
        PaperProps={{
          className: styles.menuPaper,
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEditUser} className={styles.menuItem}>
          <Edit className={styles.menuIcon} />
          <span className={styles.menuText}>Edit User</span>
        </MenuItem>
        <MenuItem onClick={handleBlockUser} className={styles.menuItem}>
          <Block className={styles.menuIcon} />
          <span className={styles.menuText}>Deactivate User</span>
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteUser} 
          className={`${styles.menuItem} ${styles.deleteMenuItem}`}
          disabled={isDeleting}
        >
          <Delete className={styles.menuIcon} />
          <span className={styles.menuText}>
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </span>
        </MenuItem>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          style: {
            borderRadius: '12px',
            minWidth: '400px',
          },
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 600 }}>
            Delete User
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCancelDelete}
            variant="outlined"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#b71c1c',
              },
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Invite Modal */}
      <InviteModal />
    </Box>
  );
};

export default UserManagement; 
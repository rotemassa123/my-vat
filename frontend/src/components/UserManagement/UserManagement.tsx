import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  InputAdornment, 
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
  PersonAdd, 
  Edit, 
  Delete, 
  Block
} from '@mui/icons-material';
import { Alert, Snackbar } from '@mui/material';
import { useAccountStore } from '../../store/accountStore';
import { useInviteModalStore } from '../../store/modalStore';
import { useUserManagement } from '../../hooks/user/useUserManagement';
import { profileApi } from '../../lib/profileApi';
import InviteModal from '../modals/InviteModal';
import UserRow from './UserRow';
import styles from './UserManagement.module.scss';

// Helper function to create avatar initials
const createAvatarInitials = (fullName: string | undefined): string => {
  if (!fullName) return 'U'; // Default to 'U' for User if no name
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
  const { users: profileUsers, entities, setProfile } = useAccountStore();
  const { openModal } = useInviteModalStore();
  const { deleteUser, isDeleting, deleteError, updateUserRole, updateRoleError, updateUserEntity, updateEntityError } = useUserManagement(
    (message: string) => setSuccessMessage(message)
  );
  
  // State for error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Transform real user data to expected format
  const transformedUsers = useMemo(() => {
    if (!profileUsers || profileUsers.length === 0) {
      return [];
    }
    
    return profileUsers.map(user => {
      const entity = entities.find(e => e._id === user.entityId);
      return {
        id: user._id,
        name: user.fullName || user.email.split('@')[0], // Fallback to email prefix if no fullName
        email: user.email,
        role: mapUserTypeToRole(user.userType),
        status: formatUserStatus(user.status),
        avatar: createAvatarInitials(user.fullName),
        entity: entity?.entity_name || 'Unknown Entity',
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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState<string>('');

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
    if (selectedUser) {
      const user = profileUsers.find(u => u._id === selectedUser);
      if (user) {
        setEditingUserId(selectedUser);
        setEditingUserName(user.fullName || '');
      }
    }
    handleCloseMenu();
  };

  const handleSaveUserName = async (userId: string) => {
    const originalUser = profileUsers.find(u => u._id === userId);
    
    if (!originalUser) {
      setEditingUserId(null);
      setEditingUserName('');
      return;
    }

    if (editingUserName.trim() === (originalUser.fullName || '')) {
      setEditingUserId(null);
      setEditingUserName('');
      return;
    }

    if (!editingUserName.trim()) {
      setErrorMessage('User name cannot be empty');
      setEditingUserId(null);
      setEditingUserName('');
      return;
    }

    try {
      await profileApi.updateUser(userId, { fullName: editingUserName.trim() });
      
      // Refresh profile data
      const profileData = await profileApi.getProfile();
      setProfile(profileData);
      
      setSuccessMessage('User name updated successfully');
      setEditingUserId(null);
      setEditingUserName('');
    } catch (error) {
      console.error('Failed to update user name:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update user name');
      setEditingUserId(null);
      setEditingUserName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUserName('');
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

  const handleRoleChange = async (userId: string, newRole: string, newUserType: number): Promise<void> => {
    // Find the current user to get their current entity
    const currentUser = profileUsers.find(user => user._id === userId);
    
    if (newUserType === 1) { // Admin
      // For admin, we don't need entityId (it will be cleared by backend)
      await updateUserRole(userId, newUserType);
    } else if (newUserType === 2 || newUserType === 3) { // Member or Viewer
      // For member/viewer, we need to assign an entity
      // If user already has an entity, keep it; otherwise assign to first available entity
      let entityId = currentUser?.entityId;
      
      if (!entityId && entities.length > 0) {
        // Assign to first available entity
        entityId = entities[0]._id;
      }
      
      if (!entityId) {
        setErrorMessage('No entities available for assignment');
        throw new Error('No entities available for assignment');
      }
      
      // Call the backend with both userType and entityId
      await updateUserRole(userId, newUserType, entityId);
    } else {
      await updateUserRole(userId, newUserType);
    }
  };

  const handleEntityChange = async (userId: string, newEntityId: string): Promise<void> => {
    await updateUserEntity(userId, newEntityId);
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

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
      <Box className={styles.tableContainer}>
        {/* Table Header */}
        <Box className={styles.tableHeader}>
          <Box className={styles.headerCell} style={{ width: '30%' }}>User</Box>
          <Box className={styles.headerCell} style={{ width: '12%' }}>Role</Box>
          <Box className={styles.headerCell} style={{ width: '15%' }}>Entity</Box>
          <Box className={styles.headerCell} style={{ width: '12%' }}>Status</Box>
          <Box className={styles.headerCell} style={{ width: '15%' }}>Last Login</Box>
          <Box className={styles.headerCell} style={{ width: '12%' }}>Created</Box>
          <Box className={styles.headerCell} style={{ width: '4%', paddingRight: '24px' }}></Box>
        </Box>
        
        {/* Table Body (Scrollable) */}
        <Box className={styles.tableBody}>
          {filteredUsers.map((user) => (
            <UserRow 
              key={user.id} 
              user={user} 
              onActionClick={handleActionClick}
              onRoleChange={handleRoleChange}
              onEntityChange={handleEntityChange}
              entities={entities}
              isEditing={editingUserId === user.id}
              editingName={editingUserName}
              onNameChange={setEditingUserName}
              onSaveName={() => handleSaveUserName(user.id)}
              onCancel={handleCancelEdit}
            />
          ))}
        </Box>
      </Box>

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

      {/* Error Snackbar */}
      <Snackbar
        open={!!updateRoleError || !!updateEntityError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {updateRoleError?.message || updateEntityError?.message || 'Failed to update user'}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSuccess} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Invite Modal */}
      <InviteModal />
    </Box>
  );
};

export default UserManagement; 
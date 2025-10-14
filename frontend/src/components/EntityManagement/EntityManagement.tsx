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
  BusinessCenter, 
  Edit, 
  Delete
} from '@mui/icons-material';
import { Alert, Snackbar } from '@mui/material';
import { useAccountStore } from '../../store/accountStore';
import { profileApi } from '../../lib/profileApi';
import EntityRow from './EntityRow.tsx';
import styles from './EntityManagement.module.scss';

// Helper function to format date
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

// Helper function to format entity type for display
const formatEntityType = (type?: string): string => {
  if (!type) return 'N/A';
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to format entity status for display
const formatEntityStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Helper function to get location string
const getLocationString = (address?: {
  city?: string;
  state?: string;
  country?: string;
}): string => {
  if (!address) return 'N/A';
  const parts = [address.city, address.state, address.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

const EntityManagement: React.FC = () => {
  const { entities, users, setProfile } = useAccountStore();
  
  // State for error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Transform entity data to display format
  const transformedEntities = useMemo(() => {
    if (!entities || entities.length === 0) {
      return [];
    }
    
    return entities.map(entity => ({
      id: entity._id,
      name: entity.name,
      type: formatEntityType(entity.entity_type),
      registrationNumber: entity.registration_number || 'N/A',
      status: formatEntityStatus(entity.status),
      location: getLocationString(entity.address),
      email: entity.email || 'N/A',
      phone: entity.phone || 'N/A',
      createdAt: formatDate(entity.created_at)
    }));
  }, [entities]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [displayEntities, setDisplayEntities] = useState(transformedEntities);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [usersWarningOpen, setUsersWarningOpen] = useState(false);
  const [lastEntityWarningOpen, setLastEntityWarningOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<string | null>(null);
  const [assignedUsersCount, setAssignedUsersCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editingEntityName, setEditingEntityName] = useState<string>('');

  // Update entities when transformedEntities changes
  React.useEffect(() => {
    setDisplayEntities(transformedEntities);
  }, [transformedEntities]);

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, entityId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedEntity(entityId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedEntity(null);
  };

  const handleEditEntity = () => {
    if (selectedEntity) {
      const entity = entities.find(e => e._id === selectedEntity);
      if (entity) {
        setEditingEntityId(selectedEntity);
        setEditingEntityName(entity.name);
      }
    }
    handleCloseMenu();
  };

  const handleSaveEntityName = async (entityId: string) => {
    // Find the original entity
    const originalEntity = entities.find(e => e._id === entityId);
    
    if (!originalEntity) {
      setEditingEntityId(null);
      setEditingEntityName('');
      return;
    }

    // Check if name actually changed
    if (editingEntityName.trim() === originalEntity.name) {
      // No change, just exit editing mode
      setEditingEntityId(null);
      setEditingEntityName('');
      return;
    }

    if (!editingEntityName.trim()) {
      setErrorMessage('Entity name cannot be empty');
      setEditingEntityId(null);
      setEditingEntityName('');
      return;
    }

    try {
      await profileApi.updateEntity(entityId, { name: editingEntityName.trim() });
      
      // Refresh profile data
      const profileData = await profileApi.getProfile();
      setProfile(profileData);
      
      setSuccessMessage('Entity name updated successfully');
      setEditingEntityId(null);
      setEditingEntityName('');
    } catch (error) {
      console.error('Failed to update entity name:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update entity name');
      setEditingEntityId(null);
      setEditingEntityName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingEntityId(null);
    setEditingEntityName('');
  };

  const handleDeleteEntity = () => {
    if (selectedEntity) {
      // Check if this is the last entity
      const activeEntities = entities.filter(e => e.status === 'active');
      if (activeEntities.length === 1) {
        // Show warning that last entity cannot be deleted
        setLastEntityWarningOpen(true);
        handleCloseMenu();
        return;
      }

      // Check if any active users are assigned to this entity
      const assignedUsers = users.filter(
        user => user.entityId === selectedEntity && user.status === 'active'
      );
      
      if (assignedUsers.length > 0) {
        // Show warning dialog if users are assigned
        setEntityToDelete(selectedEntity);
        setAssignedUsersCount(assignedUsers.length);
        setUsersWarningOpen(true);
      } else {
        // Show delete confirmation if no users assigned
        setEntityToDelete(selectedEntity);
        setDeleteConfirmOpen(true);
      }
    }
    handleCloseMenu();
  };

  const handleConfirmDelete = async () => {
    if (entityToDelete) {
      setIsDeleting(true);
      try {
        await profileApi.deleteEntity(entityToDelete);
        
        // Refresh profile data
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
        
        setSuccessMessage('Entity deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to delete entity');
      } finally {
        setIsDeleting(false);
      }
    }
    setDeleteConfirmOpen(false);
    setEntityToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setEntityToDelete(null);
  };

  const handleCloseUsersWarning = () => {
    setUsersWarningOpen(false);
    setEntityToDelete(null);
    setAssignedUsersCount(0);
  };

  const handleCloseLastEntityWarning = () => {
    setLastEntityWarningOpen(false);
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  const filteredEntities = displayEntities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entity.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entity.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === '' || entity.type === typeFilter;
    const matchesStatus = statusFilter === '' || entity.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Box className={styles.userManagement}>
      {/* Header */}
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.pageTitle}>
          Entity Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<BusinessCenter />}
          className={styles.addButton}
          onClick={() => console.log('Add Entity clicked')}
        >
          Add Entity
        </Button>
      </Box>

      {/* Filters */}
      <Box className={styles.filtersContainer}>
        <TextField
          placeholder="Search entities..."
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
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            onChange={(e: SelectChangeEvent<string>) => setTypeFilter(e.target.value)}
            label="Type"
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="Company">Company</MenuItem>
            <MenuItem value="Subsidiary">Subsidiary</MenuItem>
            <MenuItem value="Branch">Branch</MenuItem>
            <MenuItem value="Partnership">Partnership</MenuItem>
            <MenuItem value="Sole Proprietorship">Sole Proprietorship</MenuItem>
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
            <MenuItem value="Dissolved">Dissolved</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Entities Table */}
      <Box className={styles.tableContainer}>
        {/* Table Header */}
        <Box className={styles.tableHeader}>
          <Box className={styles.headerCell} style={{ width: '25%' }}>Name</Box>
          <Box className={styles.headerCell} style={{ width: '15%' }}>Type</Box>
          <Box className={styles.headerCell} style={{ width: '15%' }}>Registration #</Box>
          <Box className={styles.headerCell} style={{ width: '12%' }}>Status</Box>
          <Box className={styles.headerCell} style={{ width: '20%' }}>Location</Box>
          <Box className={styles.headerCell} style={{ width: '9%' }}>Created</Box>
          <Box className={styles.headerCell} style={{ width: '4%', paddingRight: '24px' }}></Box>
        </Box>
        
        {/* Table Body (Scrollable) */}
        <Box className={styles.tableBody}>
          {filteredEntities.map((entity) => (
            <EntityRow 
              key={entity.id} 
              entity={entity} 
              onActionClick={handleActionClick}
              isEditing={editingEntityId === entity.id}
              editingName={editingEntityName}
              onNameChange={setEditingEntityName}
              onSave={() => handleSaveEntityName(entity.id)}
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
        <MenuItem onClick={handleEditEntity} className={styles.menuItem}>
          <Edit className={styles.menuIcon} />
          <span className={styles.menuText}>Edit Entity</span>
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteEntity} 
          className={`${styles.menuItem} ${styles.deleteMenuItem}`}
          disabled={isDeleting}
        >
          <Delete className={styles.menuIcon} />
          <span className={styles.menuText}>
            {isDeleting ? 'Deleting...' : 'Delete Entity'}
          </span>
        </MenuItem>
      </Menu>
      
      {/* Last Entity Warning Dialog */}
      <Dialog
        open={lastEntityWarningOpen}
        onClose={handleCloseLastEntityWarning}
        aria-labelledby="last-entity-warning-dialog-title"
        aria-describedby="last-entity-warning-dialog-description"
        PaperProps={{
          style: {
            borderRadius: '12px',
            minWidth: '400px',
          },
        }}
      >
        <DialogTitle id="last-entity-warning-dialog-title" sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>
            Cannot Delete Last Entity
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText id="last-entity-warning-dialog-description">
            You cannot delete the last entity. Your account must have at least one active entity.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseLastEntityWarning}
            variant="contained"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: '#0131ff',
              '&:hover': {
                backgroundColor: '#0025cc',
              },
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Users Warning Dialog */}
      <Dialog
        open={usersWarningOpen}
        onClose={handleCloseUsersWarning}
        aria-labelledby="users-warning-dialog-title"
        aria-describedby="users-warning-dialog-description"
        PaperProps={{
          style: {
            borderRadius: '12px',
            minWidth: '400px',
          },
        }}
      >
        <DialogTitle id="users-warning-dialog-title" sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>
            Cannot Delete Entity
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText id="users-warning-dialog-description">
            This entity has {assignedUsersCount} active user{assignedUsersCount !== 1 ? 's' : ''} assigned to it. 
            Please reassign or remove the user{assignedUsersCount !== 1 ? 's' : ''} before deleting this entity.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseUsersWarning}
            variant="contained"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              backgroundColor: '#0131ff',
              '&:hover': {
                backgroundColor: '#0025cc',
              },
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

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
            Delete Entity
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this entity? This action cannot be undone.
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
            {isDeleting ? 'Deleting...' : 'Delete Entity'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMessage || 'An error occurred'}
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
    </Box>
  );
};

export default EntityManagement;


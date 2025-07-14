import React, { useState } from 'react';
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
  InputLabel
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { 
  Search, 
  MoreVert, 
  Add, 
  Edit, 
  Delete, 
  Block, 
  CheckCircle 
} from '@mui/icons-material';
import styles from './UserManagement.module.scss';

// Mock data based on Figma design
const mockUsers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@vathub.com',
    role: 'Admin',
    status: 'Active',
    avatar: 'JS',
    entity: 'Product A',
    lastLogin: '2024-01-15 14:30',
    createdAt: '2023-06-15'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@vathub.com',
    role: 'Member',
    status: 'Active',
    avatar: 'SJ',
    entity: 'Product B',
    lastLogin: '2024-01-14 09:15',
    createdAt: '2023-08-20'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@vathub.com',
    role: 'Viewer',
    status: 'Inactive',
    avatar: 'MD',
    entity: 'Workspace 2',
    lastLogin: '2024-01-10 16:45',
    createdAt: '2023-09-10'
  },
  {
    id: '4',
    name: 'Emily Wilson',
    email: 'emily.wilson@vathub.com',
    role: 'Member',
    status: 'Pending',
    avatar: 'EW',
    entity: 'Product A',
    lastLogin: 'Never',
    createdAt: '2024-01-12'
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@vathub.com',
    role: 'Admin',
    status: 'Active',
    avatar: 'DB',
    entity: 'Product C',
    lastLogin: '2024-01-13 11:20',
    createdAt: '2023-07-05'
  },
  {
    id: '6',
    name: 'Alex Thompson',
    email: 'alex.thompson@vathub.com',
    role: 'Viewer',
    status: 'Active',
    avatar: 'AT',
    entity: 'Workspace 1',
    lastLogin: '2024-01-14 08:30',
    createdAt: '2023-09-15'
  },
  {
    id: '7',
    name: 'Jessica Martinez',
    email: 'jessica.martinez@vathub.com',
    role: 'Member',
    status: 'Inactive',
    avatar: 'JM',
    entity: 'Product A',
    lastLogin: '2024-01-08 13:45',
    createdAt: '2023-10-01'
  },
  {
    id: '8',
    name: 'Robert Chen',
    email: 'robert.chen@vathub.com',
    role: 'Guest',
    status: 'Active',
    avatar: 'RC',
    entity: 'Product B',
    lastLogin: '2024-01-15 10:15',
    createdAt: '2023-11-20'
  },
  {
    id: '9',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@vathub.com',
    role: 'Admin',
    status: 'Pending',
    avatar: 'LA',
    entity: 'Workspace 2',
    lastLogin: 'Never',
    createdAt: '2024-01-10'
  },
  {
    id: '10',
    name: 'Kevin Rodriguez',
    email: 'kevin.rodriguez@vathub.com',
    role: 'Member',
    status: 'Active',
    avatar: 'KR',
    entity: 'Product C',
    lastLogin: '2024-01-13 15:20',
    createdAt: '2023-08-30'
  },
  {
    id: '11',
    name: 'Amanda Taylor',
    email: 'amanda.taylor@vathub.com',
    role: 'Viewer',
    status: 'Active',
    avatar: 'AT',
    entity: 'Product A',
    lastLogin: '2024-01-14 12:00',
    createdAt: '2023-12-01'
  },
  {
    id: '12',
    name: 'Daniel Garcia',
    email: 'daniel.garcia@vathub.com',
    role: 'Member',
    status: 'Inactive',
    avatar: 'DG',
    entity: 'Workspace 1',
    lastLogin: '2024-01-09 14:30',
    createdAt: '2023-07-15'
  },
  {
    id: '13',
    name: 'Michelle White',
    email: 'michelle.white@vathub.com',
    role: 'Guest',
    status: 'Active',
    avatar: 'MW',
    entity: 'Product B',
    lastLogin: '2024-01-15 16:45',
    createdAt: '2023-11-05'
  },
  {
    id: '14',
    name: 'James Wilson',
    email: 'james.wilson@vathub.com',
    role: 'Admin',
    status: 'Active',
    avatar: 'JW',
    entity: 'Product C',
    lastLogin: '2024-01-14 11:30',
    createdAt: '2023-06-20'
  },
  {
    id: '15',
    name: 'Rachel Green',
    email: 'rachel.green@vathub.com',
    role: 'Member',
    status: 'Pending',
    avatar: 'RG',
    entity: 'Workspace 2',
    lastLogin: 'Never',
    createdAt: '2024-01-11'
  },
  {
    id: '16',
    name: 'Christopher Lee',
    email: 'christopher.lee@vathub.com',
    role: 'Viewer',
    status: 'Active',
    avatar: 'CL',
    entity: 'Product A',
    lastLogin: '2024-01-13 09:15',
    createdAt: '2023-09-25'
  },
  {
    id: '17',
    name: 'Stephanie Moore',
    email: 'stephanie.moore@vathub.com',
    role: 'Member',
    status: 'Active',
    avatar: 'SM',
    entity: 'Product B',
    lastLogin: '2024-01-15 13:20',
    createdAt: '2023-08-10'
  },
  {
    id: '18',
    name: 'Brian Clark',
    email: 'brian.clark@vathub.com',
    role: 'Guest',
    status: 'Inactive',
    avatar: 'BC',
    entity: 'Workspace 1',
    lastLogin: '2024-01-07 17:00',
    createdAt: '2023-10-15'
  },
  {
    id: '19',
    name: 'Nicole Harris',
    email: 'nicole.harris@vathub.com',
    role: 'Admin',
    status: 'Active',
    avatar: 'NH',
    entity: 'Product C',
    lastLogin: '2024-01-14 14:45',
    createdAt: '2023-07-30'
  },
  {
    id: '20',
    name: 'Mark Lewis',
    email: 'mark.lewis@vathub.com',
    role: 'Member',
    status: 'Active',
    avatar: 'ML',
    entity: 'Workspace 2',
    lastLogin: '2024-01-12 10:30',
    createdAt: '2023-11-10'
  },
  {
    id: '21',
    name: 'Jennifer Young',
    email: 'jennifer.young@vathub.com',
    role: 'Viewer',
    status: 'Pending',
    avatar: 'JY',
    entity: 'Product A',
    lastLogin: 'Never',
    createdAt: '2024-01-09'
  },
  {
    id: '22',
    name: 'Ryan Miller',
    email: 'ryan.miller@vathub.com',
    role: 'Member',
    status: 'Active',
    avatar: 'RM',
    entity: 'Product B',
    lastLogin: '2024-01-15 08:15',
    createdAt: '2023-12-15'
  },
  {
    id: '23',
    name: 'Lauren Jackson',
    email: 'lauren.jackson@vathub.com',
    role: 'Guest',
    status: 'Active',
    avatar: 'LJ',
    entity: 'Workspace 1',
    lastLogin: '2024-01-13 16:30',
    createdAt: '2023-09-05'
  },
  {
    id: '24',
    name: 'Tyler Scott',
    email: 'tyler.scott@vathub.com',
    role: 'Admin',
    status: 'Inactive',
    avatar: 'TS',
    entity: 'Product C',
    lastLogin: '2024-01-10 12:45',
    createdAt: '2023-08-25'
  },
  {
    id: '25',
    name: 'Megan Adams',
    email: 'megan.adams@vathub.com',
    role: 'Member',
    status: 'Active',
    avatar: 'MA',
    entity: 'Workspace 2',
    lastLogin: '2024-01-14 15:00',
    createdAt: '2023-10-30'
  }
];

const roleOptions = ['Admin', 'Member', 'Viewer', 'Guest'];


const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState(mockUsers);

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(userId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };



  return (
    <Box className={styles.userManagementContainer}>
      {/* Header */}
      <Box className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          className={styles.addButton}
        >
          Add New User
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
          <TableHead className={styles.stickyTableHead}>
            <TableRow>
              <TableCell className={styles.stickyTableCell}>User</TableCell>
              <TableCell className={styles.stickyTableCell}>Role</TableCell>
              <TableCell className={styles.stickyTableCell}>Status</TableCell>
              <TableCell className={styles.stickyTableCell}>Entity</TableCell>
              <TableCell className={styles.stickyTableCell}>Last Login</TableCell>
              <TableCell className={styles.stickyTableCell}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className={styles.tableRow}>
                <TableCell>
                  <Box className={styles.userInfo}>
                    <Avatar className={styles.avatar}>
                      {user.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" className={styles.userName}>
                        {user.name}
                      </Typography>
                      <Typography variant="body2" className={styles.userEmail}>
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <FormControl className={styles.inlineSelect}>
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      variant="outlined"
                      size="small"
                      className={styles.roleSelect}
                    >
                      {roleOptions.map((role) => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.status} 
                    color={getStatusColor(user.status) as any}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box className={styles.entityChip}>
                    {user.entity}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.lastLogin}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={(e) => handleActionClick(e, user.id)}
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
        onClose={handleActionClose}
        className={styles.actionMenu}
      >
        <MenuItem onClick={handleActionClose}>
          <Edit className={styles.menuIcon} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleActionClose}>
          <CheckCircle className={styles.menuIcon} />
          Activate User
        </MenuItem>
        <MenuItem onClick={handleActionClose}>
          <Block className={styles.menuIcon} />
          Suspend User
        </MenuItem>
        <MenuItem onClick={handleActionClose} className={styles.deleteMenuItem}>
          <Delete className={styles.menuIcon} />
          Delete User
        </MenuItem>
      </Menu>


    </Box>
  );
};

export default UserManagement; 
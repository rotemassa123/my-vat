import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, Support as SupportIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi, type Ticket } from '../services/tickets.service';
import { format } from 'date-fns';
import styles from './TicketsPage.module.scss';

const TicketsPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-tickets'],
    queryFn: () => ticketsApi.getUserTickets(),
  });

  const handleTicketClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleCreateTicket = () => {
    navigate('/tickets/new');
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'primary';
      case 'waiting':
        return 'warning';
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box className={styles.container}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={styles.container}>
        <Typography color="error">
          Failed to load tickets. Please try again.
        </Typography>
      </Box>
    );
  }

  const tickets = data?.tickets || [];

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Box className={styles.titleSection}>
          <SupportIcon className={styles.icon} />
          <Typography variant="h4" className={styles.title}>
            My Tickets
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateTicket}
        >
          Open New Ticket
        </Button>
      </Box>

      {tickets.length === 0 ? (
        <Card className={styles.emptyCard}>
          <CardContent>
            <Box className={styles.emptyState}>
              <SupportIcon className={styles.emptyIcon} />
              <Typography variant="h6" className={styles.emptyText}>
                You don't have any tickets yet.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateTicket}
              >
                Create Your First Ticket
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <List>
              {tickets.map((ticket) => (
                <ListItem key={ticket.id} disablePadding>
                  <ListItemButton onClick={() => handleTicketClick(ticket.id)}>
                    <ListItemText
                      primary={
                        <Box className={styles.ticketHeader}>
                          <Typography variant="subtitle1" className={styles.ticketTitle}>
                            {ticket.title}
                          </Typography>
                          <Chip
                            label={ticket.status}
                            size="small"
                            color={getStatusColor(ticket.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box className={styles.ticketMeta}>
                          <Typography variant="body2" color="text.secondary">
                            {ticket.handlerName
                              ? `Handled by ${ticket.handlerName}`
                              : 'Unassigned'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(ticket.lastMessageAt), 'MMM d, yyyy HH:mm')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TicketsPage;


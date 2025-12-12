import React, { useState } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Support as SupportIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, type Ticket } from '../../services/tickets.service';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import styles from './OperatorTicketsPage.module.scss';

const OperatorTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);

  const { data: unhandledData, isLoading: isLoadingUnhandled } = useQuery({
    queryKey: ['operator-unhandled-tickets'],
    queryFn: () => ticketsApi.getUnhandledTickets(),
  });

  const { data: allData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['operator-all-tickets'],
    queryFn: () => ticketsApi.getAllTickets(),
  });

  const assignMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsApi.assignTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator-unhandled-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['operator-all-tickets'] });
    },
  });

  const handleTicketClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleAssignToSelf = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await assignMutation.mutateAsync(ticketId);
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

  const unhandledTickets = unhandledData?.tickets || [];
  const allTickets = allData?.tickets || [];

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tickets')}
          className={styles.backButton}
        >
          Back
        </Button>
        <Box className={styles.titleSection}>
          <SupportIcon className={styles.icon} />
          <Typography variant="h4" className={styles.title}>
            Operator Tickets
          </Typography>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={`Unhandled (${unhandledTickets.length})`} />
            <Tab label={`All Tickets (${allTickets.length})`} />
          </Tabs>

          {tabValue === 0 && (
            <Box className={styles.tabContent}>
              {isLoadingUnhandled ? (
                <Box display="flex" justifyContent="center" padding={4}>
                  <CircularProgress />
                </Box>
              ) : unhandledTickets.length === 0 ? (
                <Typography variant="body1" color="text.secondary" padding={4} textAlign="center">
                  No unhandled tickets
                </Typography>
              ) : (
                <List>
                  {unhandledTickets.map((ticket) => (
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
                                User: {ticket.userId}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => handleAssignToSelf(ticket.id, e)}
                                disabled={assignMutation.isPending}
                              >
                                Assign to Me
                              </Button>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box className={styles.tabContent}>
              {isLoadingAll ? (
                <Box display="flex" justifyContent="center" padding={4}>
                  <CircularProgress />
                </Box>
              ) : allTickets.length === 0 ? (
                <Typography variant="body1" color="text.secondary" padding={4} textAlign="center">
                  No tickets
                </Typography>
              ) : (
                <List>
                  {allTickets.map((ticket) => (
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
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default OperatorTicketsPage;


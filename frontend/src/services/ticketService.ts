import { queryClient } from '../main';
import { ticketsApi, type TicketListResponse } from './tickets.service';

class TicketService {
  private static instance: TicketService;
  
  static getInstance(): TicketService {
    if (!TicketService.instance) {
      TicketService.instance = new TicketService();
    }
    return TicketService.instance;
  }

  /**
   * Main function to load all ticket data (prefetches into React Query cache)
   */
  async loadAllTickets(): Promise<{ tickets: TicketListResponse }> {
    try {
      console.log('🚀 Starting ticket data load...');

      // Prefetch tickets into React Query cache
      await queryClient.prefetchQuery({
        queryKey: ['user-tickets'],
        queryFn: () => ticketsApi.getUserTickets(),
        staleTime: Infinity, // Tickets are only loaded on startup
      });

      console.log(`✅ Successfully prefetched tickets`);

      // Return the cached data
      const cachedData = queryClient.getQueryData<TicketListResponse>(['user-tickets']);
      return { tickets: cachedData || { tickets: [], total: 0 } };

    } catch (error) {
      console.error('❌ Failed to load ticket data:', error);
      throw error;
    }
  }

  /**
   * Get current data status
   */
  async getDataStatus() {
    const cachedData = queryClient.getQueryData<TicketListResponse>(['user-tickets']);
    return {
      loaded: !!cachedData,
      ticketCount: cachedData?.tickets.length || 0,
    };
  }
}

// Export singleton instance
export const ticketService = TicketService.getInstance();

// Export convenience functions
export const loadAllTickets = () => ticketService.loadAllTickets();
export const getTicketDataStatus = () => ticketService.getDataStatus();


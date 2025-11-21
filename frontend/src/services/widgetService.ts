import { widgetApi } from '../lib/widgetApi';
import type { Widget } from '../types/widget';

class WidgetService {
  private static instance: WidgetService;
  
  static getInstance(): WidgetService {
    if (!WidgetService.instance) {
      WidgetService.instance = new WidgetService();
    }
    return WidgetService.instance;
  }

  /**
   * Main function to load all widget data
   */
  async loadAllWidgets(): Promise<{ widgets: Widget[] }> {
    const { useWidgetStore } = await import('../store/widgetStore');
    const store = useWidgetStore.getState();
    
    try {
      store.setIsLoading(true);
      store.setError(null);

      console.log('🚀 Starting widget data load...');

      // Fetch all widgets
      const widgets = await widgetApi.getAll();

      console.log(`✅ Successfully loaded ${widgets.length} widgets`);

      // Store the data
      store.setWidgets(widgets);

      return { widgets };

    } catch (error) {
      console.error('❌ Failed to load widget data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load widgets';
      store.setError(errorMessage);
      throw error;
    } finally {
      store.setIsLoading(false);
    }
  }

  /**
   * Get current data status
   */
  async getDataStatus() {
    const { useWidgetStore } = await import('../store/widgetStore');
    const store = useWidgetStore.getState();
    return {
      isLoading: store.isLoading,
      error: store.error,
      widgetCount: store.widgets.length,
    };
  }
}

// Export singleton instance
export const widgetService = WidgetService.getInstance();

// Export convenience functions
export const loadAllWidgets = () => widgetService.loadAllWidgets();
export const getWidgetDataStatus = () => widgetService.getDataStatus();


import { create } from 'zustand';
import React from 'react';
import type {
  Widget,
  WidgetType,
  WidgetDataConfig,
  WidgetDisplayConfig,
  WidgetLayout,
} from '../types/widget';

/**
 * Widgets data state
 */
interface WidgetsDataState {
  widgets: Widget[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Widget wizard state for widget creation flow
 * Note: currentStep is managed by the component, not the store
 */
interface WidgetWizardState {
  type: WidgetType | null;
  dataConfig: WidgetDataConfig | null;
  displayConfig: WidgetDisplayConfig | null;
  layout: WidgetLayout | null;
}

/**
 * Modal state flags
 */
interface ModalState {
  isWidgetWizardOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isPreviewExportModalOpen: boolean;
  isConnectDataSourceModalOpen: boolean;
  isHelpSupportModalOpen: boolean;
  editingWidgetId: string | null;
  deletingWidgetId: string | null;
}

interface WidgetStore extends WidgetsDataState, WidgetWizardState, ModalState {
  // Widgets data actions
  setWidgets: (widgets: Widget[]) => void;
  addWidget: (widget: Widget) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  removeWidget: (widgetId: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Widget wizard actions
  setWidgetWizardType: (type: WidgetType) => void;
  setWidgetWizardDataConfig: (config: WidgetDataConfig) => void;
  setWidgetWizardDisplayConfig: (config: WidgetDisplayConfig) => void;
  setWidgetWizardLayout: (layout: WidgetLayout) => void;
  resetWidgetWizard: () => void;

  // Modal actions
  openWidgetWizard: () => void;
  closeWidgetWizard: () => void;
  openEditModal: (widgetId: string) => void;
  closeEditModal: () => void;
  openDeleteModal: (widgetId: string) => void;
  closeDeleteModal: () => void;
  openPreviewExportModal: () => void;
  closePreviewExportModal: () => void;
  openConnectDataSourceModal: () => void;
  closeConnectDataSourceModal: () => void;
  openHelpSupportModal: () => void;
  closeHelpSupportModal: () => void;
}

const initialWidgetsDataState: WidgetsDataState = {
  widgets: [],
  isLoading: false,
  error: null,
};

const initialWidgetWizardState: WidgetWizardState = {
  type: null,
  dataConfig: null,
  displayConfig: null,
  layout: null,
};

const initialModalState: ModalState = {
  isWidgetWizardOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isPreviewExportModalOpen: false,
  isConnectDataSourceModalOpen: false,
  isHelpSupportModalOpen: false,
  editingWidgetId: null,
  deletingWidgetId: null,
};

export const useWidgetStore = create<WidgetStore>((set) => ({
  ...initialWidgetsDataState,
  ...initialWidgetWizardState,
  ...initialModalState,

  // Widgets data actions
  setWidgets: (widgets) => set({ widgets, error: null }),
  
  addWidget: (widget) => set((state) => ({
    widgets: [...state.widgets, widget],
  })),
  
  updateWidget: (widgetId, updates) => set((state) => ({
    widgets: state.widgets.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    ),
  })),
  
  removeWidget: (widgetId) => set((state) => ({
    widgets: state.widgets.filter((w) => w.id !== widgetId),
  })),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  // Widget wizard actions
  setWidgetWizardType: (type) => set({ type }),
  
  setWidgetWizardDataConfig: (config) => set({ dataConfig: config }),
  
  setWidgetWizardDisplayConfig: (config) => set({ displayConfig: config }),
  
  setWidgetWizardLayout: (layout) => set({ layout }),
  
  resetWidgetWizard: () => set(initialWidgetWizardState),

  // Modal actions
  openWidgetWizard: () => set({ isWidgetWizardOpen: true }),
  
  closeWidgetWizard: () => set({
    isWidgetWizardOpen: false,
    ...initialWidgetWizardState, // Reset widget wizard state when closing
  }),
  
  openEditModal: (widgetId) => set({
    isEditModalOpen: true,
    editingWidgetId: widgetId,
  }),
  
  closeEditModal: () => set({
    isEditModalOpen: false,
    editingWidgetId: null,
  }),
  
  openDeleteModal: (widgetId) => set({
    isDeleteModalOpen: true,
    deletingWidgetId: widgetId,
  }),
  
  closeDeleteModal: () => set({
    isDeleteModalOpen: false,
    deletingWidgetId: null,
  }),
  
  openPreviewExportModal: () => set({ isPreviewExportModalOpen: true }),
  
  closePreviewExportModal: () => set({ isPreviewExportModalOpen: false }),
  
  openConnectDataSourceModal: () => set({ isConnectDataSourceModalOpen: true }),
  
  closeConnectDataSourceModal: () => set({ isConnectDataSourceModalOpen: false }),
  
  openHelpSupportModal: () => set({ isHelpSupportModalOpen: true }),
  
  closeHelpSupportModal: () => set({ isHelpSupportModalOpen: false }),
}));

export const useActiveWidgets = (): Widget[] => {
  const allWidgets = useWidgetStore((state) => state.widgets);
  return React.useMemo(() => {
    return allWidgets.filter((w) => w.isActive);
  }, [allWidgets]);
};

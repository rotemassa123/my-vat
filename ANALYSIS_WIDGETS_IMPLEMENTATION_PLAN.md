# Analysis Widgets - Implementation Plan

## Technical High-Level Design

### Data Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Database                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │   widgets        │      │    invoices      │       │
│  │   collection     │      │    collection    │       │
│  ├──────────────────┤      ├──────────────────┤       │
│  │ • _id            │      │ • _id            │       │
│  │ • account_id     │      │ • account_id     │       │
│  │ • user_id        │      │ • entity_id       │       │
│  │ • type           │      │ • claim_amount   │       │
│  │ • data_config   │      │ • created_at     │       │
│  │ • display_config │      │ • source         │       │
│  └──────────────────┘      └──────────────────┘       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow: Widget Creation & Display

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Create Widget Request
       │    { type, dataConfig, displayConfig }
       ▼
┌─────────────────────────────────────┐
│      NestJS Backend                 │
│  ┌──────────────────────────────┐   │
│  │  WidgetController            │   │
│  │  POST /widgets               │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│             ▼                        │
│  ┌──────────────────────────────┐   │
│  │  WidgetService               │   │
│  │  • Validates request         │   │
│  │  • Maps to DB format         │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│             ▼                        │
│  ┌──────────────────────────────┐   │
│  │  WidgetRepository            │   │
│  │  • Saves to MongoDB          │   │
│  │  • AccountScopePlugin        │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│             ▼                        │
│      MongoDB (widgets collection)    │
└─────────────────────────────────────┘
```

### Data Flow: Widget Data Aggregation

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 2. GET /widgets/:id/data
       │    (Request chart data)
       ▼
┌─────────────────────────────────────┐
│      NestJS Backend                 │
│  ┌──────────────────────────────┐   │
│  │  WidgetController            │   │
│  │  GET /widgets/:id/data       │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│             ▼                        │
│  ┌──────────────────────────────┐   │
│  │  WidgetService               │   │
│  │  • Fetches widget config     │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│             ▼                        │
│  ┌──────────────────────────────┐   │
│  │  WidgetDataService           │   │
│  │  • Builds aggregation        │   │
│  │  • Maps fields (Date→created_at)│
│  └──────────┬───────────────────┘   │
│             │                        │
│             ▼                        │
│  ┌──────────────────────────────┐   │
│  │  MongoDB Aggregation         │   │
│  │  $match → $group → $sort     │   │
│  │  Returns: [{label, value}]  │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│             ▼                        │
│  Response: { widgetId, type, data }  │
└─────────────────────────────────────┘
       │
       │ 3. Chart-ready data
       ▼
┌─────────────┐
│   React     │
│  Component  │
│  • PieChart │
│  • BarChart │
│  • etc.     │
└─────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         AnalysisPage                            │   │
│  │  • Header (search, help, create button)         │   │
│  │  • WidgetGrid → WidgetCard[]                   │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────┴──────────────────────────────────┐   │
│  │  WidgetCard                                     │   │
│  │  • Title, Actions (edit/delete)                │   │
│  │  • WidgetRenderer                               │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────┴──────────────────────────────────┐   │
│  │  WidgetRenderer                                │   │
│  │  • WidgetErrorBoundary                         │   │
│  │  • PieChartWidget / BarChartWidget / etc.      │   │
│  └──────────────┬──────────────────────────────────┘   │
│                 │                                        │
│  ┌──────────────┴──────────────────────────────────┐   │
│  │  useWidgetData() hook                          │   │
│  │  • React Query cache                           │   │
│  │  • Calls GET /widgets/:id/data                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  WidgetCreationWizard (4 steps)                  │   │
│  │  • Step 1: Choose Type                          │   │
│  │  • Step 2: Configure Data                       │   │
│  │  • Step 3: Preview                              │   │
│  │  • Step 4: Save                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Data Transformation Pipeline

```
User Input (Frontend)
    │
    │ { type: 'pie', xAxisField: 'Date', yAxisField: 'Revenue' }
    ▼
Widget Creation Request
    │
    │ POST /widgets
    ▼
Backend Validation & Storage
    │
    │ { data_config: { source: 'invoices', xAxisField: 'Date', ... } }
    ▼
MongoDB (widgets collection)
    │
    │ Widget stored with config
    ▼
User Requests Widget Data
    │
    │ GET /widgets/:id/data
    ▼
WidgetDataService
    │
    │ Maps: 'Date' → 'created_at'
    │ Maps: 'Revenue' → 'claim_amount'
    │
    │ MongoDB Aggregation:
    │   $match (filters)
    │   $group by created_at, sum(claim_amount)
    │   $sort
    ▼
Aggregated Data
    │
    │ [{ label: '2024-01-01', value: 1500 }, ...]
    ▼
Frontend Chart Component
    │
    │ PieChart / BarChart renders
    ▼
Visual Chart (User sees)
```

### Key Design Decisions

1. **Backend Aggregation**: All data processing happens server-side
2. **Field Mapping**: User-friendly names → DB field names (Date → created_at)
3. **Caching**: React Query caches widget data (30s stale time)
4. **Error Isolation**: Each widget wrapped in ErrorBoundary
5. **Account Scoping**: Plugins auto-filter by account_id/entity_id

---

## Development Plan

### Stage 1: Backend Foundation

#### Task 1.1: Widget Schema & Repository Interface
**Goal**: Create database schema and repository contract

**Files to create**:
- `backend/src/Common/Infrastructure/DB/schemas/widget.schema.ts`
- `backend/src/Common/ApplicationCore/Services/IWidgetRepository.ts`

**What to do**:
1. Create Widget schema with all fields (type, data_config, display_config, etc.)
2. Add AccountScopePlugin and EntityScopePlugin
3. Create indexes (user_id, account_id)
4. Define IWidgetRepository interface with CRUD methods

**Test**: Schema compiles, can import in module

**Estimated time**: 30 min

---

#### Task 1.2: Repository Implementation
**Goal**: Implement database operations

**Files to create**:
- `backend/src/Common/Infrastructure/Repositories/widget.repository.ts`

**What to do**:
1. Implement all IWidgetRepository methods
2. Use Mongoose model for CRUD operations
3. Handle account_id/user_id scoping (plugins handle it automatically)
4. Add error logging

**Test**: Can create/find/update/delete widgets via repository (unit test or manual DB check)

**Estimated time**: 45 min

---

#### Task 1.3: DTOs (Request/Response)
**Goal**: Create validation and API contracts

**Files to create**:
- `backend/src/Features/Analysis/Requests/widget.requests.ts`
- `backend/src/Features/Analysis/Responses/widget.responses.ts`

**What to do**:
1. Create CreateWidgetRequest with validation decorators
2. Create UpdateWidgetRequest (all optional)
3. Create WidgetResponse, WidgetListResponse, WidgetDataResponse
4. Add ApiProperty decorators for Swagger

**Test**: DTOs compile, validation works (can test with invalid data)

**Estimated time**: 30 min

---

### Stage 2: Backend API Layer

#### Task 2.1: Widget Service (CRUD)
**Goal**: Business logic for widget operations

**Files to create**:
- `backend/src/Features/Analysis/Services/widget.service.ts`

**What to do**:
1. Implement createWidget, getWidgets, getWidget, updateWidget, deleteWidget
2. Use IWidgetRepository (dependency injection)
3. Map DB documents to WidgetResponse (mapToResponse method)
4. Handle NotFoundException

**Test**: Service methods work (unit test or manual service call)

**Estimated time**: 45 min

---

#### Task 2.2: Widget Controller
**Goal**: REST API endpoints

**Files to create**:
- `backend/src/Features/Analysis/Controllers/widget.controller.ts`

**What to do**:
1. Create controller with @Controller('widgets')
2. Add AuthenticationGuard
3. Implement POST /widgets, GET /widgets, GET /widgets/:id, PUT /widgets/:id, DELETE /widgets/:id
4. Use @CurrentUserId() and @CurrentAccountId() decorators
5. Add Swagger decorators

**Test**: Can call endpoints via Postman/curl (create, list, get, update, delete)

**Estimated time**: 45 min

---

#### Task 2.3: Widget Data Service (Aggregation)
**Goal**: Backend data aggregation for charts

**Files to create**:
- `backend/src/Features/Analysis/Services/widget-data.service.ts`

**What to do**:
1. Create fetchWidgetData method (routes to source-specific methods)
2. Implement fetchInvoiceData with MongoDB aggregation pipeline
3. Add field mapping (mapXAxisFieldToDb, mapYAxisFieldToDb)
4. Handle filters (dateRange, entityIds)
5. Return ChartDataPoint[] format

**Test**: Can call service with widget config, get aggregated data (unit test or manual)

**Estimated time**: 1.5 hours

---

#### Task 2.4: Widget Data Endpoint
**Goal**: Add GET /widgets/:id/data endpoint

**Files to modify**:
- `backend/src/Features/Analysis/Services/widget.service.ts` (add getWidgetData method)
- `backend/src/Features/Analysis/Controllers/widget.controller.ts` (add GET :id/data route)

**What to do**:
1. Add getWidgetData to WidgetService (calls WidgetDataService)
2. Add GET /widgets/:id/data route to controller
3. Return WidgetDataResponse

**Test**: Can call GET /widgets/:id/data and get chart data

**Estimated time**: 20 min

---

#### Task 2.5: Module Setup & Registration
**Goal**: Wire everything together

**Files to create**:
- `backend/src/Features/Analysis/analysisInfra.module.ts`
- `backend/src/Features/Analysis/analysis.module.ts`

**Files to modify**:
- `backend/src/app.module.ts` (import AnalysisModule)

**What to do**:
1. Create AnalysisInfraModule (MongooseModule, repository provider)
2. Create AnalysisModule (imports infra, controllers, services)
3. Register AnalysisModule in AppModule

**Test**: Backend starts without errors, endpoints accessible

**Estimated time**: 20 min

---

### Stage 3: Frontend Foundation

#### Task 3.1: TypeScript Types
**Goal**: Frontend type definitions

**Files to create**:
- `frontend/src/types/widget.ts`

**What to do**:
1. Mirror backend types (WidgetType enum, WidgetDataConfig, WidgetDisplayConfig, etc.)
2. Create Widget interface
3. Create request/response types

**Test**: Types compile, can import in components

**Estimated time**: 20 min

---

#### Task 3.2: API Client
**Goal**: HTTP client for widget endpoints

**Files to create**:
- `frontend/src/lib/api/widgets.ts`

**What to do**:
1. Create widgetApi object with getAll, getById, create, update, delete, getData
2. Use existing api instance from './api'
3. Return typed responses

**Test**: Can call widgetApi methods (check network tab)

**Estimated time**: 20 min

---

#### Task 3.3: React Query Hooks
**Goal**: Data fetching hooks

**Files to create**:
- `frontend/src/hooks/analysis/useWidgets.ts`

**What to do**:
1. Create useWidgets() hook (list widgets)
2. Create useWidgetData(widgetId) hook (get chart data)
3. Create useCreateWidget(), useUpdateWidget(), useDeleteWidget() mutations
4. Configure cache invalidation

**Test**: Hooks work, data fetches correctly

**Estimated time**: 30 min

---

#### Task 3.4: Zustand Store
**Goal**: UI state management (wizard, modals)

**Files to create**:
- `frontend/src/store/widgetStore.ts`

**What to do**:
1. Create wizardState interface and actions
2. Create modal state flags and actions
3. Implement all store methods

**Test**: Can open/close modals, update wizard state

**Estimated time**: 30 min

---

### Stage 4: Widget Components

#### Task 4.1: Error Boundary
**Goal**: Isolate widget errors

**Files to create**:
- `frontend/src/components/analysis/WidgetErrorBoundary.tsx`

**What to do**:
1. Create React ErrorBoundary class component
2. Display error UI with retry button
3. Log errors to console

**Test**: Can trigger error, see error boundary UI

**Estimated time**: 20 min

---

#### Task 4.2: PieChart Widget Component
**Goal**: First chart component (establishes pattern)

**Files to create**:
- `frontend/src/components/analysis/widgets/PieChartWidget.tsx`

**What to do**:
1. Use useWidgetData hook
2. Handle loading/error/no-data states
3. Render PieChart from @mui/x-charts
4. Map widget.displayConfig to chart props

**Test**: Can render PieChartWidget with mock widget, see chart

**Estimated time**: 45 min

---

#### Task 4.3: Other Chart Widgets
**Goal**: Bar, Line, Histogram components

**Files to create**:
- `frontend/src/components/analysis/widgets/BarChartWidget.tsx`
- `frontend/src/components/analysis/widgets/LineChartWidget.tsx`
- `frontend/src/components/analysis/widgets/HistogramWidget.tsx`

**What to do**:
1. Follow same pattern as PieChartWidget
2. Use appropriate chart component from @mui/x-charts
3. Configure axes, series, grid based on widget config

**Test**: Each widget type renders correctly

**Estimated time**: 1 hour (30 min each)

---

#### Task 4.4: Widget Renderer & Preview
**Goal**: Factory components for rendering widgets

**Files to create**:
- `frontend/src/components/analysis/WidgetRenderer.tsx`
- `frontend/src/components/analysis/WidgetPreview.tsx`

**What to do**:
1. WidgetRenderer: Switch on widget.type, render appropriate component, wrap in ErrorBoundary
2. WidgetPreview: Same but for modals (compact view)

**Test**: Can render any widget type via factory

**Estimated time**: 20 min

---

### Stage 5: Dashboard UI

#### Task 5.1: Widget Card Component
**Goal**: Display widget in grid

**Files to create**:
- `frontend/src/components/analysis/WidgetCard.tsx`

**What to do**:
1. Display widget title
2. Render WidgetRenderer for chart
3. Add action buttons (view/edit/delete)
4. Show created date
5. Connect to widgetStore actions

**Test**: WidgetCard displays correctly with mock widget

**Estimated time**: 45 min

---

#### Task 5.2: Analysis Page
**Goal**: Main dashboard page

**Files to create/modify**:
- `frontend/src/pages/AnalysisPage.tsx` (create or update existing)

**What to do**:
1. Use useWidgets() hook
2. Display header (title, search, help, create button)
3. Show WidgetCard grid OR empty state
4. Render all modals (wizard, edit, delete, etc.)

**Test**: Page loads, shows widgets or empty state, buttons work

**Estimated time**: 45 min

---

### Stage 6: Widget Creation Wizard

#### Task 6.1: Wizard Container & Step 1
**Goal**: Wizard modal structure and type selection

**Files to create**:
- `frontend/src/components/analysis/WidgetCreationWizard.tsx`
- `frontend/src/components/analysis/wizard/WizardStep1ChooseType.tsx`

**What to do**:
1. Create wizard modal with MUI Stepper
2. Step 1: 2x2 grid of cards (Pie, Bar, Line, Histogram)
3. On click: setWizardType() and advance to step 2
4. Connect to widgetStore

**Test**: Can open wizard, select widget type, advance to step 2

**Estimated time**: 45 min

---

#### Task 6.2: Wizard Step 2 (Configure)
**Goal**: Data configuration form

**Files to create**:
- `frontend/src/components/analysis/wizard/WizardStep2ConfigureData.tsx`

**What to do**:
1. Title TextField
2. X-Axis dropdown (Date, Category, Product, Region)
3. Y-Axis dropdown (Revenue, Count, Percentage, Value)
4. Design Options checkboxes (showLabels, showLegend, showGridLines)
5. Next button (disabled until required fields filled)

**Test**: Can fill form, advance to step 3

**Estimated time**: 45 min

---

#### Task 6.3: Wizard Step 3 & 4 (Preview & Save)
**Goal**: Preview and finalize widget creation

**Files to create**:
- `frontend/src/components/analysis/wizard/WizardStep3PreviewGraph.tsx`
- `frontend/src/components/analysis/wizard/WizardStep4ReadyToCreate.tsx`

**What to do**:
1. Step 3: Create temp widget object from wizardState, render WidgetPreview
2. Step 4: Show summary table, Save button
3. On save: call useCreateWidget().mutateAsync(), close wizard, reset state

**Test**: Can preview widget, save it, see it in dashboard

**Estimated time**: 1 hour

---

### Stage 7: Widget Management Modals

#### Task 7.1: Edit Widget Modal
**Goal**: Edit existing widgets

**Files to create**:
- `frontend/src/components/analysis/EditWidgetModal.tsx`

**What to do**:
1. Two-column layout (form left, preview right)
2. Form: Title, X-Axis, Y-Axis, Design Options
3. Live preview updates as form changes
4. Save button calls useUpdateWidget()

**Test**: Can edit widget, see live preview, save changes

**Estimated time**: 1 hour

---

#### Task 7.2: Delete Widget Modal
**Goal**: Confirm widget deletion

**Files to create**:
- `frontend/src/components/analysis/DeleteWidgetModal.tsx`

**What to do**:
1. Simple confirmation dialog
2. "No, Keep it" → close modal
3. "Yes, Delete" → call useDeleteWidget(), close modal

**Test**: Can delete widget, see it removed from dashboard

**Estimated time**: 20 min

---

#### Task 7.3: Other Modals (Placeholder)
**Goal**: Preview/Export, Connect Data Source, Help modals

**Files to create**:
- `frontend/src/components/analysis/PreviewExportModal.tsx`
- `frontend/src/components/analysis/ConnectDataSourceModal.tsx`
- `frontend/src/components/analysis/HelpSupportModal.tsx`

**What to do**:
1. Create UI structure (no functionality yet)
2. PreviewExportModal: Show widget preview, export options UI
3. ConnectDataSourceModal: Show data source options
4. HelpSupportModal: Show help content

**Test**: Modals open/close, UI displays correctly

**Estimated time**: 1 hour (20 min each)

---

### Stage 8: Integration & Testing

#### Task 8.1: End-to-End Integration
**Goal**: Connect everything, fix issues

**What to do**:
1. Test full flow: Create widget → View dashboard → Edit → Delete
2. Test data aggregation: Create widget with different configs, verify charts show correct data
3. Fix any integration issues
4. Test error cases (network errors, invalid data, etc.)

**Test**: Full user flow works end-to-end

**Estimated time**: 2 hours

---

#### Task 8.2: Polish & Edge Cases
**Goal**: Handle edge cases, improve UX

**What to do**:
1. Add loading states everywhere
2. Handle empty states gracefully
3. Add error messages
4. Test with real data (invoices)
5. Verify field mapping works correctly
6. Test account/entity scoping

**Test**: All edge cases handled, UX is smooth

**Estimated time**: 2 hours

---

## Summary

**Total Tasks**: 18 tasks
**Estimated Total Time**: ~15-18 hours

**Order of Development**:
1. Backend foundation (5 tasks) - Can test with Postman
2. Frontend foundation (4 tasks) - Can test with mock data
3. Widget components (4 tasks) - Can test in isolation
4. Dashboard UI (2 tasks) - Can test with mock widgets
5. Wizard (3 tasks) - Can test creation flow
6. Modals (3 tasks) - Can test management features
7. Integration (2 tasks) - Full system testing

Each task is small-medium sized, focused on a single component/feature, and introduces limited changes.


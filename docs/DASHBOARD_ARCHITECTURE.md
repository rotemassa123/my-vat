# monday.com Dashboards: Complete Architecture Deep Dive

## Executive Summary

Dashboards (internally called "Overviews") are cross-board data visualization and aggregation tools in monday.com that allow users to create custom views combining data from multiple boards with various widget types. This document provides a comprehensive technical overview of the entire dashboard system from database to client, covering all critical components necessary to recreate similar functionality.

**Key Characteristics:**
- **Cross-board aggregation**: Dashboards can pull data from multiple boards across workspaces
- **Widget-based architecture**: 100+ widget types (charts, tables, calendars, timelines, etc.)
- **Real-time updates**: Pusher-based live data synchronization
- **Grid-based layout**: 24-column responsive grid system for widget positioning
- **Dual data infrastructure**: Legacy V1 (all data upfront) and modern V2 (on-demand widget data)
- **Microservices integration**: Heavy reliance on Insights Widgets MS and Insights Reporting MS

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Database Schema](#database-schema)
3. [Server-Side Components](#server-side-components)
4. [Client-Side Architecture](#client-side-architecture)
5. [Data Flow & Loading Strategies](#data-flow--loading-strategies)
6. [Widget System](#widget-system)
7. [Grid Layout System](#grid-layout-system)
8. [Real-Time Updates (Pusher)](#real-time-updates-pusher)
9. [State Management](#state-management)
10. [Microservices Integration](#microservices-integration)
11. [Key Files Reference](#key-files-reference)

---

## High-Level Architecture

### Conceptual Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │   Dashboard Container (Overview)                           │ │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐               │ │
│  │   │ Widget 1 │  │ Widget 2 │  │ Widget 3 │  (24-col grid)│ │
│  │   │  Chart   │  │  Table   │  │ Timeline │               │ │
│  │   └──────────┘  └──────────┘  └──────────┘               │ │
│  │   ┌──────────┐  ┌──────────┐                             │ │
│  │   │ Widget 4 │  │ Widget 5 │                             │ │
│  │   │ Counter  │  │ Calendar │                             │ │
│  │   └──────────┘  └──────────┘                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                      STATE LAYER (Redux)                         │
│  • Overview Entities    • Overview Sections (Widgets)            │
│  • Data Source Entities • Board Entities                         │
│  • Overview Views       • Data Source Data                       │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                      API / CONTROLLERS                           │
│  • OverviewsController                                           │
│  • OverviewSectionsInternalController                            │
│  • FetchersInternalController                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                                │
│  • OverviewDataService    • OverviewSectionService               │
│  • DataSourceService      • WidgetsDataAsyncFetcher              │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES                                 │
│  • Insights-Widgets MS (data orchestration, caching)             │
│  • Insights-Reporting MS (widget data computation)               │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  • MySQL (overviews, overview_sections, data_sources)            │
│  • Redis (flow IDs, caching)                                     │
│  • IndexedDB (client-side cache)                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                   REAL-TIME UPDATES                              │
│  • Pusher (overview channel, data_source channels)               │
└─────────────────────────────────────────────────────────────────┘
```

### Core Concepts

**1. Overview (Dashboard)**
- Top-level container entity
- Has settings including `layout` (widget positions), `theme`, `context`
- Belongs to an account, has a creator, can be in a workspace/folder
- Can be public (shareable) or private (owner-only)
- Has `data_infra_version` (V1 or V2) determining data loading strategy

**2. OverviewSection (Widget)**
- Individual widgets on a dashboard
- 100+ types: Chart, Counter, Battery, Timeline, Table, Calendar, etc.
- Each has `settings` (widget-specific configuration)
- Has `config_data` (filters, search terms)
- References boards via `query` (board_ids)
- Can be nested (container sections can have child sections)

**3. DataSource**
- Represents a data contract between widgets and data fetchers
- Has `contract_type` (TABLE_DATA, AGGREGATED_DATA, PAGED_TABLE_DATA, etc.)
- Has `query_type` (DATA_ENTITIES, SEARCH_OPTIONS, BLANK)
- Has `fetcher_type` (which service fetches the data)
- Multiple widgets can share a single DataSource

**4. Grid Layout**
- 24-column grid system (historical: V1=3 cols, V2=6 cols, V3=24 cols)
- Each widget has layout properties: `{i, x, y, w, h, minW, maxW, minH, maxH}`
- Layout stored in overview `settings.layout` as array of layout items
- Compaction algorithm prevents gaps

---

## Database Schema

### Core Tables

#### `overviews` Table
```sql
CREATE TABLE overviews (
  id BIGINT PRIMARY KEY,
  account_id BIGINT NOT NULL,
  created_by BIGINT, -- creator user_id
  name VARCHAR(255),
  state VARCHAR(50), -- 'running', 'deleted', 'completed' (archived)
  kind VARCHAR(50), -- 'public', 'private'
  configuration TEXT, -- JSON: {context, settings, permissions, data_infra_version, ...}
  board_folder_id BIGINT,
  workspace_id BIGINT,
  created_at DATETIME,
  updated_at DATETIME,
  
  INDEX idx_account_id (account_id),
  INDEX idx_workspace_id (workspace_id),
  INDEX idx_board_folder_id (board_folder_id)
);
```

**Configuration JSON Structure:**
```javascript
{
  context: "dashboard" | "my_monday",
  settings: {
    layout: [
      {i: "widget_id", x: 0, y: 0, w: 12, h: 8, minW: 6, maxW: 24, minH: 4, maxH: 24}
    ],
    layout_version: 3,
    theme: "light" | "dark"
  },
  permissions: "owners" | "workspace",
  is_account_homepage_entity: boolean,
  data_load_strategy: {
    type: 1 (LIVE) | 2 (CLIENT_CACHE),
    updated_at: timestamp,
    configuration: {}
  },
  data_infra_version: 1 | 2,
  infra_downgraded: boolean,
  infra_auto_upgrade: boolean,
  stats: {...},
  flavor: "default" | ...,
  token: {token: "share_link_token", ...}
}
```

#### `overview_sections` Table
```sql
CREATE TABLE overview_sections (
  id BIGINT PRIMARY KEY,
  account_id BIGINT NOT NULL,
  entity_id BIGINT NOT NULL, -- overview_id or item_id
  entity_type VARCHAR(50), -- 'Overview' or 'Item'
  parent_section_id BIGINT, -- for nested widgets
  created_by BIGINT,
  name VARCHAR(255),
  type VARCHAR(255), -- 'ChartOverviewSection', 'CounterOverviewSection', etc.
  state VARCHAR(50),
  query TEXT, -- JSON: {board_ids: [1, 2, 3]}
  configuration TEXT, -- JSON: {settings, config_data, app_feature_id, ...}
  created_at DATETIME,
  updated_at DATETIME,
  
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_account_id (account_id),
  INDEX idx_parent_section_id (parent_section_id)
);
```

**Configuration JSON Structure:**
```javascript
{
  settings: {
    // Widget-specific settings
    // Example for Counter:
    column_mapping: {"board_id": ["column_id"]},
    counter_type: "numbers",
    calculation_type: "sum",
    exclude_board_ids: [],
    groups_data: {...}
  },
  config_data: {
    // Filters and search
    ruleBasedFilterValues: {...},
    filter_by: "search text",
    filter_user_id: 123,
    filter_team_id: 456,
    filterOptions: {...},
    areParentFiltersApplied: true
  },
  settings_validation_result: {...},
  app_feature_id: 12345, // for app-based widgets
  additional_view_data: {...},
  hide_columns_from_settings: [...],
  data_infra_version: 1 | 2,
  dtos_version: 1 // incremented on settings change for cache invalidation
}
```

#### `data_sources` Table
```sql
CREATE TABLE data_sources (
  id BIGINT PRIMARY KEY,
  account_id BIGINT NOT NULL,
  entity_id BIGINT NOT NULL, -- overview_id or item_id
  entity_type VARCHAR(50),
  created_by BIGINT,
  updated_by BIGINT,
  name VARCHAR(255),
  state VARCHAR(50),
  contract_type VARCHAR(100), -- 'TABLE_DATA', 'AGGREGATED_DATA', etc.
  query_type VARCHAR(100), -- 'DATA_ENTITIES', 'SEARCH_OPTIONS', 'BLANK'
  fetcher_type VARCHAR(100), -- 'TABLE_DATA_EXTRACTOR', 'AGGREGATED_DATA_EXTRACTOR', etc.
  query TEXT, -- JSON: same as overview_section query
  additional_data TEXT, -- JSON: extra fetcher params
  created_at DATETIME,
  updated_at DATETIME,
  
  INDEX idx_entity (entity_type, entity_id)
);
```

#### `data_sources_overview_sections` Join Table
```sql
CREATE TABLE data_sources_overview_sections (
  data_source_id BIGINT,
  overview_section_id BIGINT,
  
  PRIMARY KEY (data_source_id, overview_section_id)
);
```

#### Supporting Tables

- `object_subscriptions`: Manages overview subscribers (owners/members)
- `leftpane_object_positions`: Position in left sidebar
- `form_dashboard_links`: Links forms to dashboards
- `overview_object_instance_relations`: Links app objects to dashboards

---

## Server-Side Components

### Controllers

#### `OverviewsController`

**Purpose:** Main REST API for dashboard operations

**Key Endpoints:**

```ruby
# GET /overviews/:id/overview_data
# Returns complete dashboard data including metadata and sections
def overview_data
  @overview = Overview.find(params[:id])
  authorize! :entity_data, @overview
  
  fetch_mode = params[:skip_async_fetch] ? :ONLY_METADATA : :ASYNC
  data = OverviewDataService.get_overview_data(
    current_user, 
    @overview, 
    fetch_mode, 
    metadata: params[:metadata]
  )
  
  render json: data
end

# GET /overviews/:id/overview_metadata  
# Returns just metadata without widget data
def overview_metadata
  @overview = Overview.exposed_to_user(current_user).find(params[:id])
  scope = "without_sections_data"
  data = OverviewSerializer.new(@overview, scope: scope).serializable_hash
  render json: data
end

# POST /overviews
# Create new dashboard
def create
  overview_params = params.only(:name, :permissions, :kind, :workspace_id, ...)
  overview_params[:context] = CONTEXT[:DASHBOARD]
  
  res = OverviewUpdateService.new(current_user, nil).create_overview(overview_params)
  # Returns serialized Overview
end

# PUT /overviews/:id
# Update dashboard (name, layout, theme, etc.)
def update
  overview_params = params.only(:name, :settings, :data_load_strategy)
  res = OverviewUpdateService.new(current_user, @overview).update_overview(overview_params)
end

# DELETE /overviews/:id
def destroy
  is_archive = params[:is_archive]
  res = OverviewUpdateService.new(current_user, @overview).delete_overview(is_archive)
end

# PUT /overviews/:id/update_subscribers
# Add/remove dashboard members
def update_subscribers
  users = params[:users]
  is_add = params[:is_add]
  is_owner = params[:is_owner]
  
  res = OverviewUpdateService.new(current_user, @overview)
    .update_subscribers(users, is_add, is_owner: is_owner)
end

# POST /overviews/:id/export_excel
# Export dashboard to Excel
def export_excel
  ExportDashboardToExcelService.export_to_excel_async(
    current_user, @overview, params[:dataMap], request_id
  )
end

# POST /overviews/:id/duplicate
def duplicate
  new_overview = DuplicateOverviewService.duplicate_overview_same_account(
    current_user, @overview
  )
end

# POST /overviews/:id/migrate
# Migrate dashboard from V1 to V2 data infrastructure
def migrate
  migrated_overview = OverviewMigrator.migrate(
    current_user, @overview, OverviewMigrationConstants::WIDGETS_V2
  )
end
```

#### `InternalMs::OverviewSectionsInternalController`

**Purpose:** Internal API for widget CRUD operations

**Key Endpoints:**

```ruby
# POST /internal_ms/overview_sections
# Create new widget
def create
  section = OverviewSectionService.create_overview_section(
    current_user,
    entity,
    section_params,
    options
  )
  
  # Auto-creates associated DataSources
  # Updates parent layout
  # Sends Pusher notifications
end

# PUT /internal_ms/overview_sections/:id
# Update widget settings/filters
def update
  section = OverviewSection.find(params[:id])
  
  updated_section = OverviewSectionService.update_overview_section(
    current_user,
    section,
    update_params
  )
end

# DELETE /internal_ms/overview_sections/:id
# Delete widget and optionally its DataSources
def destroy
  section = OverviewSection.find(params[:id])
  
  OverviewSectionService.delete_overview_section(
    current_user,
    section,
    should_delete_data_sources: true
  )
end

# PUT /internal_ms/overview_sections/:id/duplicate
# Duplicate widget
def duplicate
  original_section = OverviewSection.find(params[:id])
  duplicated_section = OverviewSectionService.duplicate_overview_section(
    current_user,
    original_section
  )
end

# POST /internal_ms/overview_sections/validate_settings
# Validate widget settings against boards
def validate_settings
  validation_result = section.validate_settings(board_ids, settings: settings)
end
```

#### `InternalMs::FetchersInternalController`

**Purpose:** Internal API for data fetching coordination

```ruby
# POST /internal_ms/fetchers/generate_dtos_for_widgets_ms_flow
# Generate widget DTOs for Insights Widgets MS
def generate_dtos_for_widgets_ms_flow
  overview_sections = OverviewSection.where(id: params[:overview_sections_ids])
  
  widget_queries, data_source_ids = OverviewSectionService
    .get_overview_sections_data_fetching_dto(
      overview_sections,
      params[:strategy],
      params[:data_fetching_options]
    )
  
  render json: widget_queries
end

# POST /internal_ms/fetchers/generate_board_dtos_for_widgets_ms_flow
# Generate board structure DTOs
def generate_board_dtos_for_widgets_ms_flow
  # Returns board structure metadata
end
```

### Services

#### `OverviewDataService`

**Purpose:** Orchestrates dashboard data loading

```ruby
class OverviewDataService
  # Main entry point for loading dashboard data
  def self.get_overview_data(user, overview, fetch_mode, options = {})
    scope = specify_scope(fetch_mode)
    
    # Serialize overview metadata
    data = OverviewSerializer.new(overview, 
      user: user, 
      scope: scope,
      is_mobile_app: options[:is_mobile_app]
    ).serializable_hash
    
    # Resolve dynamic queries (e.g., "all boards in workspace")
    if overview.query.present?
      resolved_board_ids, metadata = resolve_dynamic_query(overview.query)
      data[:resolved_board_ids] = resolved_board_ids
    end
    
    # Async mode: Trigger background data fetching
    if is_async(fetch_mode)
      OverviewSectionsDataAsyncFetcher.fetch(
        user, 
        overview, 
        options.merge(metadata: metadata)
      )
    end
    
    # Check authorization for each widget
    data[:overview_sections].each do |section_id, section|
      unless section[:authorized]
        section[:authorized] = false
      end
    end
    
    data
  end
  
  # Automatically upgrade dashboard from V1 to V2 if eligible
  def self.auto_upgrade_if_needed(user, overview)
    # Check criteria (item count, board count, etc.)
    # Migrate if eligible
  end
  
  # Clear cached data source data
  def self.clear_cached_data_source_data(user, overview)
    # Clear Redis/IndexedDB caches
  end
end
```

#### `OverviewSectionService`

**Purpose:** Widget lifecycle management

```ruby
class OverviewSectionService
  # Create widget
  def self.create_overview_section(user, entity, params, options = {})
    section = OverviewSection.new(
      type: params[:type],
      name: params[:name],
      query: params[:query],
      entity: entity,
      creator: user,
      account: user.account
    )
    
    section.settings = params[:settings] || section.initial_settings
    section.config_data = params[:config_data]
    section.parent_section_id = params[:parent_section_id]
    
    # Create associated DataSources
    unless section.skip_datasources_creation_before_create
      create_data_sources_for_section(section)
    end
    
    section.save!
    
    # Update parent layout if adding to dashboard
    if params[:overview_layout].present?
      update_parent_layout(entity, params[:overview_layout])
    end
    
    # Send Pusher notification
    send_pusher_add_event(section)
    
    section
  end
  
  # Update widget
  def self.update_overview_section(user, section, params)
    # Update settings, config_data, query
    # Increment dtos_version for cache invalidation
    # Send Pusher notification
  end
  
  # Delete widget
  def self.delete_overview_section(user, section, options = {})
    section.state = Item::STATE_DELETED
    section.save!
    
    # Delete associated DataSources if requested
    if options[:should_delete_data_sources]
      delete_unused_data_sources(section)
    end
    
    # Remove from parent layout
    remove_from_parent_layout(section)
    
    # Send Pusher notification
    send_pusher_delete_event(section)
  end
  
  # Generate DTOs for Insights Widgets MS
  def self.get_overview_sections_data_fetching_dto(sections, strategy, options = {})
    widget_queries = []
    data_source_ids = []
    
    sections.each do |section|
      data_sources = section.active_data_sources_by_strategy(strategy)
      
      data_sources.each do |ds|
        widget_queries << {
          id: ds.id,
          type: section.type,
          query: ds.query,
          settings: section.settings,
          filters: section.get_all_filters,
          contract_type: ds.contract_type,
          fetcher_type: ds.fetcher_type
        }
        
        data_source_ids << ds.id
      end
    end
    
    [widget_queries, data_source_ids.uniq]
  end
end
```

#### `WidgetsDataAsyncFetcher`

**Purpose:** Triggers async widget data loading via Insights Widgets MS

```ruby
class WidgetsDataAsyncFetcher
  # Initiate async data fetch flow
  def self.fetch(user, widget_queries, data_source_ids, options = {})
    return if data_source_ids.empty?
    return if SystemFlags.is_enabled?(SystemFlags::BLOCK_INSIGHTS_DOMAIN)
    
    metadata = options[:metadata]
    metadata[:board_structure_metadata] = prepare_structure_metadata
    
    # Start flow in Insights Widgets MS
    result = InsightsWidgetsInternalMsRequestService.start_widgets_loading_flow(
      widget_queries,
      user.account.id,
      user.id,
      metadata
    )
    
    flow_id = result["flowId"]
    
    # Store flow_id in Redis for each data_source
    data_source_ids.each do |data_source_id|
      redis_service = get_redis_service(user, data_source_id)
      redis_service.hset('flow_id', flow_id)
      redis_service.expire(5.minutes)
    end
  end
  
  # Retrieve results from completed flow
  def self.get_batch_resolved_data(user, data_source_ids, data_sources_to_load)
    flow_ids = []
    flow_id_for_data_source_id = {}
    
    # Get flow_id from Redis for each data_source
    data_source_ids.each do |ds_id|
      redis_service = get_redis_service(user, ds_id)
      flow_id = redis_service.execute('hget', 'flow_id')
      flow_ids << flow_id if flow_id.present?
      flow_id_for_data_source_id[ds_id] = flow_id
    end
    
    return {data: nil} if flow_ids.empty?
    
    # Fetch results from Insights Widgets MS
    flow_result = InsightsWidgetsInternalMsRequestService
      .get_batch_flow_results(flow_ids, data_source_ids, user.account.id, user.id)
    
    flow_result
  end
end
```

#### Data Fetcher Services

Multiple fetcher services handle different data contract types:

```ruby
# app/services/fetchers/table_data_extractor_fetcher_service.rb
class TableDataExtractorFetcherService < BaseFetcherService
  # Fetches full table data (items, groups, columns)
  def self.perform(user, query, additional_data, contract_type, context, options = {})
    board_ids = query["board_ids"]
    boards = Board.where(id: board_ids).exposed_to_user(user)
    
    # Build complete board data structure
    boards_data = boards.map do |board|
      {
        id: board.id,
        items: board.pulses.active,
        groups: board.groups.active,
        columns: board.columns.active,
        # ... more board metadata
      }
    end
    
    {data: boards_data}
  end
end

# app/services/fetchers/aggregated_data_fetcher_service.rb
class AggregatedDataFetcherService < BaseFetcherService
  # Fetches aggregated/computed widget data from Insights Reporting MS
  def self.perform(user, query, additional_data, contract_type, context, options = {})
    data_source = DataSource.find(context[:data_source_id])
    sections = data_source.overview_sections.active
    
    # Build payload for each widget
    payload = sections.map do |section|
      {
        type: section.type,
        id: section.id,
        settings: section.settings,
        filters: merge_section_filters_with_parent_filters(section),
        query: {boards: get_section_boards(query, section)}
      }
    end
    
    # Call Insights Reporting MS
    response = InternalMsHttpRequestService.send_request(
      'insights-reporting',
      'widgets_data',
      payload: payload
    )
    
    {data: response}
  end
end

# Other fetchers:
# - PagedTableDataExtractorFetcherService
# - PagedCrossBoardItemsExtractorFetcherService
# - BoardStructureExtractorFetcherService
# - TimeTrackingSessionsFetcherService
# - PostsExtractorFetcherService
# - AvailabilitiesDataFetcherService
# - QuoteOfTheDayFetcherService
```

---

## Client-Side Architecture

### Component Hierarchy

```
OverviewContainer (router-containers/overview-container.jsx)
└── LazyOverviewContainer (chunks/overview/lazy-overview-container.jsx)
    └── CurrentOverviewContainer (chunks/overview/components/current-overview/...)
        └── OverviewComponent (chunks/overview/components/overview-component/overview-component.jsx)
            ├── OverviewHeaderComponent (varies by context)
            ├── OverviewContentComponent
            │   └── DashboardContainerOverviewSectionComponent
            │       └── DashboardContainerOverviewSectionContentComponent
            │           ├── GridLayoutComponent (react-grid-layout)
            │           │   └── [Widget Components]
            │           │       ├── ChartOverviewSectionComponent
            │           │       ├── CounterOverviewSectionComponent
            │           │       ├── BatteryOverviewSectionComponent
            │           │       ├── TimelineOverviewSectionComponent
            │           │       ├── CalendarOverviewSectionComponent
            │           │       ├── TableOverviewSectionComponent
            │           │       └── ... (100+ widget types)
            │           └── AddWidgetDialogComponent
            └── OverviewTimeoutComponent (if loading hangs)
```

### Key React Components

#### `OverviewContainer`

**Location:** `app/react/router-containers/overview-container.jsx`

```jsx
function OverviewContainer({overviewId, accessDenied, ...}) {
  return (
    <Provider store={getPerformanceStore()} context={PerformanceContext}>
      <Provider store={getGlobalStore()}>
        <BoardViewStateBranchContext.Provider value={{
          boardViewStateBranchID: boardViewStateBranchTypes.CURRENT_OVERVIEW_VIEW,
          containerID: getContentElementId()
        }}>
          <LazyOverviewContainer
            overviewId={overviewId}
            accessDenied={accessDenied}
            {...props}
          />
        </BoardViewStateBranchContext.Provider>
      </Provider>
    </Provider>
  );
}
```

#### `OverviewComponent`

**Location:** `app/react/chunks/overview/components/overview-component/overview-component.jsx`

```jsx
class OverviewComponent extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      forceHideLoading: false,
      toggledViewMode: false
    };
    
    // Timeout to force-hide loading after 3 minutes
    this.forceHideLoadingIfNeeded();
  }
  
  componentDidMount() {
    this.setEditModeIfNeeded(true);
    this.renderStaticDashboardNotificationModalIfNeeded();
  }
  
  render() {
    const {
      overviewId,
      isEditMode,
      layout,
      overviewSectionIds,
      ...
    } = this.props;
    
    if (this.isLoading) {
      return <SkeletonOverviewComponent />;
    }
    
    return (
      <div className="overview-component">
        <OverviewHeaderComponent
          overviewId={overviewId}
          isEditMode={isEditMode}
          onToggleEditMode={this.toggleEditMode}
        />
        
        <OverviewContentComponent
          overviewId={overviewId}
          layout={layout}
          overviewSectionIds={overviewSectionIds}
          isEditMode={isEditMode}
        />
      </div>
    );
  }
}

export default withOverviewErrorState(OverviewComponent);
```

#### `DashboardContainerOverviewSectionContentComponent`

**Location:** `app/react/overview-sections/dashboard-container-overview-section/components/...`

```jsx
class DashboardContainerOverviewSectionContentComponent extends Component {
  render() {
    const {layout, overviewSectionIds, isEditMode} = this.props;
    
    return (
      <div className="dashboard-container-content">
        <ReactGridLayout
          layout={layout}
          cols={GRID_COLUMNS_COUNT} // 24
          rowHeight={GRID_ROW_HEIGHT}
          width={containerWidth}
          onLayoutChange={this.handleLayoutChange}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          compactType="vertical"
        >
          {overviewSectionIds.map(sectionId => (
            <div key={sectionId} data-grid={layout.find(l => l.i === sectionId)}>
              <OverviewSectionComponent
                overviewSectionId={sectionId}
                isEditMode={isEditMode}
              />
            </div>
          ))}
        </ReactGridLayout>
        
        {isEditMode && (
          <AddWidgetButtonComponent onClick={this.openAddWidgetDialog} />
        )}
      </div>
    );
  }
}
```

### Redux Actions

#### Fetch Overview Data

**Location:** `app/react/actions/overview-entities/fetch-overview.js`

```javascript
export const fetchOverviewDataAction = (overviewId, options = {}) => {
  return (dispatch, getState, apiService) => {
    dispatch(fetchOverviewDataRequest(overviewId));
    
    return apiService.overviews
      .getOverviewData(overviewId, options)
      .done(result => {
        // Normalize data with normalizr
        const normalizedData = normalize(result, overviewSchema);
        const {entities} = normalizedData;
        
        // Dispatch success action with entities
        dispatch(fetchOverviewDataSuccess(entities, overviewId));
        
        // Process data sources
        const {dataSources = []} = entities;
        dispatch(processDataSourcesAction(dataSources));
        
        // Subscribe to Pusher channels
        dispatch(subscribeToOverviewChannelsAction(overviewId));
      })
      .fail(error => {
        dispatch(fetchOverviewDataFailure(overviewId, error));
        dispatch(Notice.errorAction("Failed to load dashboard"));
      });
  };
};
```

#### Fetch Data Source Data

**Location:** `app/react/actions/data-source-entities/fetch-data-source-data.js`

```javascript
const fetchDataSourceDataFromServerAction = (dataSourceId, options = {}) => {
  return (dispatch, getState, apiService) => {
    const state = getState();
    const entityId = getDataSourceEntityId(state, dataSourceId);
    const entityType = getDataSourceEntityType(state, dataSourceId);
    
    dispatch(fetchDataSourceDataRequest(dataSourceId));
    
    // For V2 dashboards, use Insights Widgets MS
    const isDataInfraV2 = getIsEntityContractsDataInfraV2(state, entityId, entityType);
    
    if (isDataInfraV2) {
      // Poll for async results
      return pollForDataSourceData(dispatch, getState, apiService, dataSourceId);
    } else {
      // V1: Direct fetch
      return apiService.dataSources
        .getDataSourceData(dataSourceId, options)
        .done(result => {
          dispatch(fetchDataSourceDataSuccess(dataSourceId, result));
        })
        .fail(error => {
          dispatch(fetchDataSourceDataFailure(dataSourceId, error));
        });
    }
  };
};

const pollForDataSourceData = (dispatch, getState, apiService, dataSourceId) => {
  let pollAttempts = 0;
  const maxPolls = 60; // 60 seconds
  
  const poll = () => {
    pollAttempts++;
    
    return apiService.dataSources
      .getBatchResolvedData([dataSourceId])
      .done(result => {
        if (result && result.data && result.data[dataSourceId]) {
          // Data ready
          dispatch(fetchDataSourceDataSuccess(dataSourceId, result.data[dataSourceId]));
        } else if (pollAttempts < maxPolls) {
          // Keep polling
          setTimeout(poll, 1000);
        } else {
          // Timeout
          dispatch(fetchDataSourceDataFailure(dataSourceId, 'Timeout'));
        }
      });
  };
  
  return poll();
};
```

#### Create Widget

**Location:** `app/react/actions/overview-section-entities/create-overview-section.js`

```javascript
export const createOverviewSectionAction = (params) => {
  return (dispatch, getState, apiService) => {
    const {
      entityId,
      entityType,
      type,
      name,
      query,
      settings,
      config_data,
      layout_temp_id
    } = params;
    
    // Optimistic update: Add temp widget to layout
    dispatch(addTempOverviewSectionToLayout(entityId, layout_temp_id, type));
    
    return apiService.overviewSections
      .createOverviewSection({
        entity_id: entityId,
        entity_type: entityType,
        type: type,
        name: name,
        query: query,
        settings: settings,
        config_data: config_data,
        layout_temp_id: layout_temp_id
      })
      .done(result => {
        // Normalize and add to store
        const normalizedData = normalize(result, overviewSectionSchema);
        dispatch(createOverviewSectionSuccess(normalizedData.entities));
        
        // Replace temp widget with real one
        dispatch(replaceTempOverviewSection(entityId, layout_temp_id, result.id));
        
        // Fetch widget data
        const dataSources = result.data_sources || [];
        dataSources.forEach(ds => {
          dispatch(fetchDataSourceDataAction(ds.id));
        });
      })
      .fail(error => {
        dispatch(createOverviewSectionFailure(error));
        // Remove temp widget from layout
        dispatch(removeTempOverviewSectionFromLayout(entityId, layout_temp_id));
      });
  };
};
```

---

## Data Flow & Loading Strategies

### Data Infrastructure Versions

**V1 (Legacy - All Data Upfront):**
- Server fetches all board data immediately
- Single large response with full items/groups/columns
- Simple but slow for large dashboards
- No pagination

**V2 (Modern - On-Demand Loading):**
- Server returns only metadata initially
- Widgets loaded asynchronously via Insights Widgets MS
- Each widget fetches only its required data
- Paginated data contracts
- Client-side caching in IndexedDB

### V2 Loading Flow

```
1. Client requests dashboard
   GET /overviews/:id/overview_data?skip_async_fetch=false
   
2. Server returns metadata + widget definitions
   {
     overview: {id, name, settings: {layout}, ...},
     overview_sections: {
       123: {id: 123, type: "ChartOverviewSection", settings: {...}, data_sources: [456]},
       ...
     },
     data_sources: {
       456: {id: 456, contract_type: "AGGREGATED_DATA", query: {board_ids: [1,2,3]}},
       ...
     }
   }
   
3. Server triggers async data fetch
   WidgetsDataAsyncFetcher.fetch(user, widget_queries, data_source_ids)
   ↓
   POST to Insights Widgets MS: /v2/flow
   {
     widget_dtos: [
       {id: 456, type: "ChartOverviewSection", query: {...}, settings: {...}, contract_type: "AGGREGATED_DATA"}
     ],
     metadata: {first_fold: 10, timezone_offset: -420, ...}
   }
   ↓
   Insights Widgets MS returns flow_id: "abc123"
   ↓
   Server stores flow_id in Redis: data_source:456:flow_id = "abc123"
   
4. Client renders skeleton widgets
   
5. Client polls for data
   POST /api/v1/data_sources/get_batch_resolved_data
   {data_source_ids: [456]}
   ↓
   Server retrieves flow_id from Redis
   ↓
   POST to Insights Widgets MS: /v2/flow/getMany
   {flow_ids: ["abc123"], data_source_ids: [456]}
   ↓
   Insights Widgets MS orchestrates:
     - Calls back to DaPulse: /internal_ms/fetchers/generate_dtos_for_widgets_ms_flow
     - Fetches data from Insights Reporting MS
     - Aggregates results
     - Caches in Redis
   ↓
   Returns: {data: {456: {data: {...}, cacheTimestampUTC: ...}}}
   
6. Client receives data and updates widgets
   dispatch(fetchDataSourceDataSuccess(456, data))
   
7. Client caches in IndexedDB
   IndexedDB.put("data_sources_data", {id: 456, data: {...}, timestamp: ...})
   
8. Real-time updates via Pusher
   On data change:
     - Server sends Pusher event on data_source:456 channel
     - Client receives event and re-fetches or updates locally
```

### Contract Types & Load Strategies

```javascript
// Data contract types
const CONTRACT_TYPES = {
  TABLE_DATA: 1,           // Full board data (items, groups, columns)
  PAGED_TABLE_DATA: 2,     // Paginated board data
  PAGED_CROSS_BOARD_ITEMS: 3, // Paginated cross-board items
  AGGREGATED_DATA: 4,      // Computed/aggregated widget data
  BOARD_STRUCTURE: 5,      // Board metadata only (columns, groups)
  TIME_TRACKING_SESSIONS: 6,
  POSTS_DATA: 7,           // Updates/posts
  QUOTE_OF_THE_DAY: 8,
  AVAILABILITIES_DATA: 9,
  NO_DATA: 10
};

// Load strategies
class ContractLoadStrategy {
  constructor({
    eager = false,              // Load immediately on dashboard load
    fetch_on_creation_if_missing = false, // Create if doesn't exist
    fetch_on_query_change = false         // Re-fetch on query change
  }) {
    this.eager = eager;
    this.fetch_on_creation_if_missing = fetch_on_creation_if_missing;
    this.fetch_on_query_change = fetch_on_query_change;
  }
}

// Widget defines required data contracts
class ChartOverviewSection {
  work_surface_required_data_sources() {
    return [
      RequiredDataContract.new(
        contract_type: CONTRACT_TYPES.AGGREGATED_DATA,
        load_strategy: ContractLoadStrategy.new(
          eager: false, // Loaded on-demand
          fetch_on_creation_if_missing: true
        )
      )
    ];
  }
}

class DashboardContainerOverviewSection {
  required_data_sources() {
    if (this.is_data_infra_v2_for_contracts) {
      return [
        RequiredDataContract.new(
          contract_type: CONTRACT_TYPES.TABLE_DATA,
          load_strategy: ContractLoadStrategy.new(eager: false)
        ),
        RequiredDataContract.new(
          contract_type: CONTRACT_TYPES.BOARD_STRUCTURE,
          load_strategy: ContractLoadStrategy.new(
            eager: true,
            fetch_on_query_change: true,
            fetch_on_creation_if_missing: true
          )
        )
      ];
    } else {
      // V1: Load all table data upfront
      return [
        RequiredDataContract.new(
          contract_type: CONTRACT_TYPES.TABLE_DATA,
          load_strategy: ContractLoadStrategy.new(
            eager: true,
            fetch_on_creation_if_missing: true
          )
        )
      ];
    }
  }
}
```

---

## Widget System

### Widget Types (100+ Available)

**Visualization Widgets:**
- `ChartOverviewSection` - Charts (bar, line, pie, etc.)
- `CounterOverviewSection` - Numeric counters with aggregations
- `BatteryOverviewSection` - Progress visualization
- `GaugeOverviewSection` - Gauge charts
- `ThresholdOverviewSection` - Threshold indicators

**Board View Widgets:**
- `TableOverviewSection` - Table/grid view
- `TimelineOverviewSection` - Timeline view
- `TimelineGanttOverviewSection` - Gantt chart
- `CalendarOverviewSection` - Calendar view
- `CardViewOverviewSection` - Card/kanban view
- `MapOverviewSection` - Map view
- `KanbanOverviewSection` - Kanban board
- `PivotOverviewSection` - Pivot table
- `RoadmapOverviewSection` - Product roadmap

**Resource Management:**
- `ResourceAllocationOverviewSection` - Resource allocation
- `ResourcePlannerOverviewSection` - Resource planning
- `ProjectsWorkloadResourceAllocationOverviewSection` - Workload view
- `TimeTrackingOverviewSection` - Time tracking

**Content Widgets:**
- `TextOverviewSection` - Rich text
- `FilesGalleryOverviewSection` - Files gallery
- `DamGalleryOverviewSection` - DAM gallery
- `EmbeddedSiteOverviewSection` - Embedded websites

**Info Widgets:**
- `RecentBoardsOverviewSection` - Recent boards
- `InboxOverviewSection` - Inbox/notifications
- `MentionsOverviewSection` - Mentions
- `TodoListOverviewSection` - Todo list
- `MyWeekOverviewSection` - My week
- `AssignedToMeOverviewSection` - Assigned to me

**Container/Layout Widgets:**
- `DashboardContainerOverviewSection` - Dashboard container
- `BoardContainerOverviewSection` - Board 360 container
- `ContainerOverviewSection` - Generic container
- `ItemLayoutOverviewSection` - Item page layout
- `BoardLayoutOverviewSection` - Board layout

**App-Based Widgets:**
- `AppFeatureOverviewSection` - Generic app widget
- `AppFeatureDashboardWidget` - App dashboard widget
- `CrmReportingOverviewSection` - CRM reporting
- `PortfolioCardsOverviewSection` - Portfolio cards
- `PortfolioAiRisksOverviewSection` - Portfolio AI risks

**Utility Widgets:**
- `ClockOverviewSection` - Clock
- `CountdownOverviewSection` - Countdown timer
- `QuoteOfTheDayOverviewSection` - Quote of the day
- `OnboardingWidgetOverviewSection` - Onboarding
- `EmptyOverviewSection` - Empty placeholder

### Widget Lifecycle

```javascript
// 1. Widget class registered
const overviewSectionTypes = {
  ChartOverviewSection: ChartOverviewSectionService,
  CounterOverviewSection: CounterOverviewSectionService,
  // ... 100+ types
};

// 2. Widget service defines metadata
class ChartOverviewSectionService extends BaseOverviewSectionService {
  getType() {
    return 'ChartOverviewSection';
  }
  
  getTitle() {
    return _t('widgets.chart.title');
  }
  
  getIcon() {
    return 'chart';
  }
  
  getCategory() {
    return CATEGORY.VISUALIZATION;
  }
  
  getDefaultSettings() {
    return {
      chart_type: 'bar',
      aggregation: 'count',
      column_mapping: {},
      group_by: null
    };
  }
  
  getDefaultLayoutForNewSection(layoutItem) {
    layoutItem.w = 12; // width in grid units
    layoutItem.h = 8;  // height in grid units
    layoutItem.minW = 6;
    layoutItem.maxW = 24;
    layoutItem.minH = 4;
    layoutItem.maxH = 24;
  }
  
  getRequiredDataContracts() {
    return [{
      contract_type: CONTRACT_TYPES.AGGREGATED_DATA,
      load_strategy: {eager: false}
    }];
  }
  
  validateSettings(settings, boardIds) {
    // Validate that required columns exist on boards
    const errors = [];
    boardIds.forEach(boardId => {
      if (!settings.column_mapping[boardId]) {
        errors.push(`Missing column mapping for board ${boardId}`);
      }
    });
    return {isValid: errors.length === 0, errors};
  }
}

// 3. Widget component renders
class ChartOverviewSectionComponent extends BaseOverviewSectionComponent {
  render() {
    const {overviewSectionId, dataSourceData, isEditMode} = this.props;
    const section = this.getOverviewSection();
    const settings = section.settings;
    
    if (!dataSourceData || dataSourceData.loading) {
      return <SkeletonChart />;
    }
    
    if (dataSourceData.error) {
      return <ErrorState error={dataSourceData.error} />;
    }
    
    return (
      <div className="chart-overview-section">
        {isEditMode && (
          <WidgetHeader
            onSettings={this.openSettings}
            onDelete={this.deleteWidget}
            onDuplicate={this.duplicateWidget}
          />
        )}
        
        <ChartRenderer
          chartType={settings.chart_type}
          data={dataSourceData.data}
          settings={settings}
        />
      </div>
    );
  }
}
```

### Widget Settings Structure

```javascript
// Counter widget settings example
{
  counter_type: "numbers" | "status" | "people",
  calculation_type: "sum" | "average" | "count" | "unique",
  column_mapping: {
    "board_id_1": ["column_id_1"],
    "board_id_2": ["column_id_2"]
  },
  groups_data: {
    "board_id_1": {
      selected_groups: ["group_id_1", "group_id_2"],
      include_mode: "include" | "exclude"
    }
  },
  exclude_board_ids: [],
  show_comparison: true,
  comparison_period: "last_week" | "last_month"
}

// Chart widget settings example
{
  chart_type: "bar" | "line" | "pie" | "area" | "combo",
  aggregation: "count" | "sum" | "average",
  column_mapping: {
    "board_id": ["column_id"] // y-axis
  },
  group_by_column_mapping: {
    "board_id": ["column_id"] // x-axis
  },
  stacking: "none" | "normal" | "percent",
  show_legend: true,
  show_values_on_bars: true,
  x_axis_label: "Custom label",
  y_axis_label: "Custom label"
}

// Timeline widget settings example
{
  main_column_mapping: {
    "board_id": ["timeline_column_id"]
  },
  color_by_mapping: {
    "board_id": ["status_column_id"]
  },
  label_by_mapping: {
    "board_id": ["text_column_id"]
  },
  dependency_column_mapping: {
    "board_id": ["dependency_column_id"]
  },
  zoom_level: "day" | "week" | "month",
  show_weekends: true
}
```

### Widget Filtering

Widgets support multiple filter types applied at different levels:

```javascript
// Widget config_data filters
{
  // Text search
  filter_by: "search term",
  
  // Person filters
  filter_user_id: 123, // single person (deprecated)
  filter_user_ids: [123, 456], // multiple people
  
  // Team filters
  filter_team_id: 789, // single team (deprecated)
  filter_team_ids: [789, 012], // multiple teams
  
  // Rule-based filters
  ruleBasedFilterValues: {
    operator: "and" | "or",
    rules: [
      {
        column_id: "status",
        operator: "is_any_of",
        value: ["Done", "Working on it"]
      },
      {
        column_id: "date",
        operator: "within_the_next",
        value: {count: 7, period: "days"}
      },
      {
        column_id: "person",
        operator: "contains_terms",
        value: [123, 456] // user_ids
      }
    ]
  },
  
  // Additional filter options
  filterOptions: {
    show_only_items_with_updates: true,
    hide_completed_items: true
  },
  
  // Parent filters inheritance
  areParentFiltersApplied: true // inherit filters from container
}
```

---

## Grid Layout System

### Layout Configuration

**Constants:**
```javascript
const GRID_COLUMNS_COUNT = 24;
const MINIMUM_GRID_ROWS = 12;
const GRID_ROW_HEIGHT = 40; // pixels

// Layout versions
const LAYOUT_VERSIONS = {
  V1: 1, // 3 columns
  V2: 2, // 6 columns
  V3: 3  // 24 columns (current)
};
```

**Layout Item Structure:**
```javascript
{
  i: "widget_id",  // unique identifier (overview_section_id)
  x: 0,            // column position (0-23)
  y: 0,            // row position (0-∞)
  w: 12,           // width in columns
  h: 8,            // height in rows
  minW: 6,         // minimum width
  maxW: 24,        // maximum width
  minH: 4,         // minimum height
  maxH: 24,        // maximum height
  moved: false,    // user moved?
  static: false,   // locked position?
  new: false       // newly added (for auto-scroll)
}
```

### Layout Algorithms

#### Grid Compactor

**Purpose:** Removes vertical gaps between widgets

```javascript
// app/react/services/grid-layout/grid-layout-compactor.js
class GridLayoutCompactor {
  compact(layout) {
    // Sort widgets by position (top-left first)
    const sortedLayout = layout.sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
    
    // Move each widget as high as possible
    sortedLayout.forEach(item => {
      if (item.static) return; // Skip locked widgets
      
      let newY = 0;
      
      // Find highest position without collision
      while (this.hasCollision(item, newY, sortedLayout)) {
        newY++;
      }
      
      item.y = newY;
    });
    
    return sortedLayout;
  }
  
  hasCollision(item, testY, layout) {
    return layout.some(other => {
      if (other.i === item.i) return false;
      
      const xOverlap = (item.x < other.x + other.w) && (item.x + item.w > other.x);
      const yOverlap = (testY < other.y + other.h) && (testY + item.h > other.y);
      
      return xOverlap && yOverlap;
    });
  }
}
```

#### Coordinates Finder

**Purpose:** Finds next available position for new widget

```javascript
// app/react/services/grid-layout/grid-layout-coordinates-finder.js
class GridLayoutCoordinatesFinder {
  find(currentLayout, newItemLayout) {
    const {w: width, h: height} = newItemLayout;
    
    // Build 2D grid map
    const gridMap = this.buildGridMap(currentLayout);
    
    // Find first available space
    for (let row = 0; row < gridMap.length; row++) {
      for (let col = 0; col <= GRID_COLUMNS_COUNT - width; col++) {
        if (this.canFitAt(gridMap, row, col, width, height)) {
          return {x: col, y: row};
        }
      }
    }
    
    // If no space found, add to bottom
    const maxY = Math.max(...currentLayout.map(item => item.y + item.h));
    return {x: 0, y: maxY};
  }
  
  buildGridMap(layout) {
    const maxY = layout.length > 0
      ? Math.max(...layout.map(item => item.y + item.h))
      : MINIMUM_GRID_ROWS;
    
    // Create 2D array: gridMap[row][col] = 0 (empty) or 1 (occupied)
    const gridMap = [];
    for (let row = 0; row < maxY; row++) {
      gridMap[row] = new Array(GRID_COLUMNS_COUNT).fill(0);
    }
    
    // Mark occupied cells
    layout.forEach(item => {
      for (let row = item.y; row < item.y + item.h; row++) {
        for (let col = item.x; col < item.x + item.w; col++) {
          if (gridMap[row]) gridMap[row][col] = 1;
        }
      }
    });
    
    return gridMap;
  }
  
  canFitAt(gridMap, row, col, width, height) {
    for (let r = row; r < row + height; r++) {
      if (!gridMap[r]) return false; // Beyond grid
      for (let c = col; c < col + width; c++) {
        if (gridMap[r][c] === 1) return false; // Occupied
      }
    }
    return true;
  }
}
```

### React Grid Layout Integration

```jsx
import ReactGridLayout from 'react-grid-layout';

<ReactGridLayout
  className="dashboard-grid-layout"
  layout={layout}
  cols={GRID_COLUMNS_COUNT}
  rowHeight={GRID_ROW_HEIGHT}
  width={containerWidth}
  containerPadding={[0, 0]}
  margin={[GRID_MARGIN, GRID_MARGIN]}
  onLayoutChange={this.handleLayoutChange}
  onDragStart={this.handleDragStart}
  onDragStop={this.handleDragStop}
  onResizeStart={this.handleResizeStart}
  onResizeStop={this.handleResizeStop}
  isDraggable={isEditMode}
  isResizable={isEditMode}
  compactType="vertical"
  preventCollision={false}
  useCSSTransforms={true}
>
  {overviewSectionIds.map(sectionId => {
    const layoutItem = layout.find(l => l.i === sectionId);
    return (
      <div key={sectionId} data-grid={layoutItem}>
        <OverviewSectionComponent
          overviewSectionId={sectionId}
          isEditMode={isEditMode}
        />
      </div>
    );
  })}
</ReactGridLayout>
```

---

## Real-Time Updates (Pusher)

### Pusher Channels

**Channel Types:**
1. **Overview Channel:** `overview-{account_id}-{overview_id}`
   - Widget CRUD events
   - Layout changes
   - Dashboard metadata changes

2. **Data Source Channel:** `data_source-{account_id}-{data_source_id}`
   - Data refresh events
   - Cache invalidation

3. **Board Channel:** `board-{account_id}-{board_id}`
   - Item/group/column changes
   - Relevant for widgets querying this board

4. **User Channel:** `private-user-{account_id}-{user_id}`
   - Personal notifications
   - Dashboard access grants

### Pusher Event Handlers

#### Overview Channel Events

**Location:** `app/react/services/pusher-service/handlers/overview-channel/`

```javascript
// Overview channel mapping
class OverviewChannelMapping {
  getChannelType() {
    return 'overview';
  }
  
  getEventHandlers() {
    return {
      'add_overview_section': this.handleAddOverviewSection,
      'change_overview_section': this.handleChangeOverviewSection,
      'delete_overview_section': this.handleDeleteOverviewSection,
      'change_overview': this.handleChangeOverview,
      'delete_overview': this.handleDeleteOverview,
      'add_subscriber': this.handleAddSubscriber,
      'remove_subscriber': this.handleRemoveSubscriber
    };
  }
  
  handleAddOverviewSection(info, store) {
    const {overview_id, overview_section} = info;
    const {dispatch} = store;
    
    // Add widget to store
    dispatch(addOverviewSectionAction(overview_id, overview_section));
    
    // Add to layout
    const layoutItem = {
      i: overview_section.id,
      x: overview_section.layout_x,
      y: overview_section.layout_y,
      w: overview_section.layout_w,
      h: overview_section.layout_h
    };
    dispatch(addOverviewSectionToLayoutAction(overview_id, layoutItem));
    
    // Fetch widget data
    const dataSources = overview_section.data_sources || [];
    dataSources.forEach(ds => {
      dispatch(fetchDataSourceDataAction(ds.id));
    });
  }
  
  handleChangeOverviewSection(info, store) {
    const {overview_id, overview_section_id, data} = info;
    const {dispatch} = store;
    
    // Update widget in store
    dispatch(changeOverviewSectionAction(overview_id, overview_section_id, data));
    
    // If settings changed, may need to re-fetch data
    if (data.settings || data.config_data) {
      dispatch(refreshOverviewSectionDataAction(overview_section_id));
    }
  }
  
  handleDeleteOverviewSection(info, store) {
    const {overview_id, overview_section_id} = info;
    const {dispatch} = store;
    
    // Remove widget from store
    dispatch(deleteOverviewSectionAction(overview_id, overview_section_id));
    
    // Remove from layout
    dispatch(removeOverviewSectionFromLayoutAction(overview_id, overview_section_id));
  }
  
  handleChangeOverview(info, store) {
    const {overview_id, data} = info;
    const {dispatch} = store;
    
    // Update overview metadata
    if (data.name) {
      dispatch(changeOverviewNameAction(overview_id, data.name));
    }
    
    if (data.settings && data.settings.layout) {
      dispatch(updateOverviewLayoutAction(overview_id, data.settings.layout));
    }
  }
}
```

#### Data Source Channel Events

**Location:** `app/react/services/pusher-service/handlers/data-source-channel/`

```javascript
class DataSourceChannelMapping {
  getChannelType() {
    return 'data_source';
  }
  
  getEventHandlers() {
    return {
      'data_source_data_changed': this.handleDataChanged,
      'data_source_query_changed': this.handleQueryChanged
    };
  }
  
  handleDataChanged(info, store) {
    const {data_source_id, trigger} = info;
    const {dispatch, getState} = store;
    
    // Check if this data_source is currently in view
    const state = getState();
    const isDataSourceInView = isDataSourceVisible(state, data_source_id);
    
    if (isDataSourceInView) {
      // Re-fetch data
      dispatch(fetchDataSourceDataAction(data_source_id, {
        ignoreCache: true,
        origin: 'pusher_event'
      }));
    } else {
      // Just invalidate cache
      dispatch(invalidateDataSourceCacheAction(data_source_id));
    }
  }
  
  handleQueryChanged(info, store) {
    const {data_source_id, new_query} = info;
    const {dispatch} = store;
    
    // Update query and re-fetch
    dispatch(updateDataSourceQueryAction(data_source_id, new_query));
    dispatch(fetchDataSourceDataAction(data_source_id, {ignoreCache: true}));
  }
}
```

### Pusher Throttling

To prevent overwhelming the client with rapid updates:

```javascript
// app/react/services/pusher-service/pusher-service.js
const OVERVIEW_PUSHER_THROTTLE_TIME_MS = 3000; // 3 seconds

class PusherService {
  constructor(reduxStore) {
    this.throttledHandlerCallbacks = [];
    this.throttledHandlersTimeouts = {};
  }
  
  executeHandler(channelType, eventName, info) {
    const handler = this.getHandler(channelType, eventName);
    
    if (this.shouldThrottle(channelType, eventName)) {
      this.executeThrottledHandler(channelType, eventName, info, handler);
    } else {
      handler(info, this.store);
    }
  }
  
  shouldThrottle(channelType, eventName) {
    // Throttle data_source_data_changed events
    return channelType === 'data_source' && eventName === 'data_source_data_changed';
  }
  
  executeThrottledHandler(channelType, eventName, info, handler) {
    const throttleKey = `${channelType}_${info.data_source_id}`;
    
    // Clear existing timeout
    if (this.throttledHandlersTimeouts[throttleKey]) {
      clearTimeout(this.throttledHandlersTimeouts[throttleKey]);
    }
    
    // Set new timeout
    this.throttledHandlersTimeouts[throttleKey] = setTimeout(() => {
      handler(info, this.store);
      delete this.throttledHandlersTimeouts[throttleKey];
    }, OVERVIEW_PUSHER_THROTTLE_TIME_MS);
  }
}
```

---

## State Management

### Redux Store Structure

```javascript
{
  // Overview entities
  overviewEntities: {
    123: {
      id: 123,
      name: "My Dashboard",
      account_id: 456,
      created_by: 789,
      kind: "public",
      context: "dashboard",
      state: "running",
      workspace_id: 101,
      board_folder_id: null,
      settings: {
        layout: [...],
        layout_version: 3,
        theme: "light"
      },
      data_infra_version: 2,
      permissions: "owners",
      owner_ids: [789],
      subscriber_ids: [789, 111, 222]
    }
  },
  
  // Overview sections (widgets)
  overviewSectionEntities: {
    456: {
      id: 456,
      entity_id: 123,
      entity_type: "Overview",
      parent_section_id: null,
      type: "ChartOverviewSection",
      name: "Project Status Chart",
      state: "running",
      query: {board_ids: [1, 2, 3]},
      settings: {
        chart_type: "bar",
        aggregation: "count",
        column_mapping: {
          "1": ["status_col_id"],
          "2": ["status_col_id"],
          "3": ["status_col_id"]
        }
      },
      config_data: {
        ruleBasedFilterValues: {...},
        filter_by: "",
        areParentFiltersApplied: true
      },
      data_sources: [789],
      data_infra_version: 2,
      authorized: true
    }
  },
  
  // Data sources
  dataSourceEntities: {
    789: {
      id: 789,
      entity_id: 123,
      entity_type: "Overview",
      state: "running",
      contract_type: "AGGREGATED_DATA",
      query_type: "DATA_ENTITIES",
      fetcher_type: "AGGREGATED_DATA_EXTRACTOR",
      query: {board_ids: [1, 2, 3]},
      additional_data: {}
    }
  },
  
  // Data source data (widget data)
  dataSourceDataEntities: {
    789: {
      loading: false,
      error: null,
      data: {
        type: "bar_chart",
        series: [
          {name: "Done", value: 25},
          {name: "Working on it", value: 15},
          {name: "Stuck", value: 5}
        ]
      },
      serverCacheTimestampUTC: 1699999999,
      entitiesDigested: true
    }
  },
  
  // Overview views (UI state)
  overviewViews: {
    id: 123,
    isEditMode: true,
    renamingOverview: false,
    subscribersDialog: {
      isOpen: false,
      subscribeLoading: false
    },
    shareOverviewLinkDialog: {
      isOpen: false,
      isGeneratingToken: false
    },
    savedScrollTopPosition: null,
    startLoadingTime: 1699999990000,
    overviewDataFetchFinished: true,
    alreadyReportedOverviewIds: {123: true}
  },
  
  // Overview section views (widget UI state)
  overviewSectionViews: {
    generalOverviewSectionsData: {
      renamingOverviewSectionId: null,
      overviewSectionIdWithInnerDialogOpen: null,
      overviewSectionIdWithInnerMenuOpen: null,
      overviewSectionIdInFullScreenMode: null,
      overviewSectionIdInSettingsScreenMode: 456,
      overviewSectionRightDrawerSettings: {
        tab: "filters",
        overviewSectionId: 456,
        additionalData: {}
      },
      isAddWidgetDialogOpen: false,
      isSectionInFullScreen: false,
      notice: null
    },
    specificOverviewSectionsData: {
      456: {
        // Widget-specific UI state
      }
    }
  },
  
  // Board entities (referenced by widgets)
  boardsEntities: {
    1: {
      id: 1,
      name: "Project Board",
      board_kind: 1,
      columns: [
        {id: "status_col_id", title: "Status", type: "status"},
        {id: "person_col_id", title: "Person", type: "people"}
      ]
    }
  },
  
  // Board data (items/groups for V1 or board structure for V2)
  boardDataEntities: {
    1: {
      groups: [...],
      pulses: [...],
      columns: [...]
    }
  }
}
```

### Key Selectors

```javascript
// app/react/selectors/overview-entities/overview-entities-selectors.js

export const getOverview = (state, overviewId) => {
  return state.overviewEntities[overviewId];
};

export const getOverviewName = (state, overviewId) => {
  return getOverview(state, overviewId)?.name;
};

export const getOverviewLayout = (state, overviewId) => {
  return getOverview(state, overviewId)?.settings?.layout || [];
};

export const getOverviewSectionIds = (state, overviewId) => {
  const overview = getOverview(state, overviewId);
  if (!overview) return [];
  
  return Object.keys(state.overviewSectionEntities)
    .filter(id => {
      const section = state.overviewSectionEntities[id];
      return section.entity_id === overviewId &&
             section.entity_type === 'Overview' &&
             section.state === 'running';
    })
    .map(id => parseInt(id));
};

export const getOverviewSection = (state, overviewSectionId) => {
  return state.overviewSectionEntities[overviewSectionId];
};

export const getOverviewSectionDataSources = (state, overviewSectionId) => {
  const section = getOverviewSection(state, overviewSectionId);
  if (!section) return [];
  
  return (section.data_sources || []).map(dsId => state.dataSourceEntities[dsId]);
};

export const getDataSourceData = (state, dataSourceId) => {
  return state.dataSourceDataEntities[dataSourceId];
};

export const isOverviewLoading = (state, overviewId) => {
  const sectionIds = getOverviewSectionIds(state, overviewId);
  
  return sectionIds.some(sectionId => {
    const dataSources = getOverviewSectionDataSources(state, sectionId);
    return dataSources.some(ds => {
      const data = getDataSourceData(state, ds.id);
      return !data || data.loading;
    });
  });
};

export const getOverviewBoardIds = (state, overviewId) => {
  const sectionIds = getOverviewSectionIds(state, overviewId);
  const boardIdsSet = new Set();
  
  sectionIds.forEach(sectionId => {
    const section = getOverviewSection(state, sectionId);
    const boardIds = section.query?.board_ids || [];
    boardIds.forEach(id => boardIdsSet.add(id));
  });
  
  return Array.from(boardIdsSet);
};
```

---

## Microservices Integration

### Insights Widgets MS

**Purpose:** Orchestrates widget data fetching, caching, and aggregation

**Architecture:**
- Node.js service
- Redis for flow state and caching
- Coordinates between DaPulse (Rails) and Insights Reporting MS
- Handles async data loading flows

**Key Endpoints:**

```typescript
// POST /v2/flow
// Start async widget loading flow
interface StartFlowRequest {
  widget_dtos: WidgetDTO[];
  metadata: {
    first_fold?: number;
    timezone_offset?: number;
    origin?: string;
    board_structure_metadata?: object;
  };
  chain_name?: string;
  widget_ids?: number[];
}

interface WidgetDTO {
  id: number; // data_source_id
  type: string; // overview_section type
  query: {
    board_ids: number[];
  };
  settings: object;
  filters: object;
  contract_type: string;
  fetcher_type: string;
}

interface StartFlowResponse {
  flowId: string;
}

// POST /v2/flow/getMany
// Retrieve results from completed flows
interface GetBatchFlowResultsRequest {
  flow_ids: string[];
  data_source_ids: number[];
}

interface GetBatchFlowResultsResponse {
  data: {
    [dataSourceId: number]: {
      data: any;
      cacheTimestampUTC?: number;
      error?: string;
    };
  };
  flowsMetadata?: object;
}

// POST /v2/chain-callback/:flow_id
// Callback from DaPulse with fetcher results
interface ChainCallbackRequest {
  data: {
    [dataSourceId: number]: any;
  };
}
```

**Flow Orchestration:**

```
1. DaPulse calls POST /v2/flow
   → Insights Widgets MS creates flow_id
   
2. Insights Widgets MS determines what data is needed:
   - Check cache (Redis)
   - Identify which widgets need fresh data
   
3. For widgets needing data:
   a. If AGGREGATED_DATA contract:
      → Call Insights Reporting MS directly
   b. If TABLE_DATA contract:
      → Callback to DaPulse: POST /internal_ms/fetchers/return_fetcher_result
      → DaPulse fetches from DB
      → DaPulse returns data to Insights Widgets MS
   
4. Insights Widgets MS aggregates results:
   - Cache in Redis (with TTL)
   - Store flow results keyed by flow_id
   
5. Client polls: POST /v2/flow/getMany
   → Returns aggregated data for all data_sources in flow
```

**Caching Strategy:**
- **Cache Key:** `data_source:{id}:{query_hash}:{filters_hash}`
- **TTL:** 5 minutes default (configurable)
- **Invalidation:** On board data change (via Pusher callback)

### Insights Reporting MS

**Purpose:** Computes aggregated widget data (charts, counters, etc.)

**Architecture:**
- Node.js service
- Direct DB queries (read replicas)
- Optimized aggregation queries
- Handles complex analytics

**Key Endpoints:**

```typescript
// POST /widgets_data
// Compute data for multiple widgets
interface WidgetsDataRequest {
  payload: WidgetPayload[];
}

interface WidgetPayload {
  id: number; // overview_section_id
  type: string; // widget type
  settings: object;
  filters: object;
  query: {
    boards: BoardQuery[];
  };
}

interface BoardQuery {
  id: number;
  parentBoardId?: number;
}

interface WidgetsDataResponse {
  [widgetId: number]: WidgetData;
}

interface WidgetData {
  type: 'bar_chart' | 'line_chart' | 'number' | 'gauge' | ...;
  data: any; // widget-specific structure
}
```

**Example Response (Counter Widget):**
```json
{
  "123": {
    "type": "number",
    "data": {
      "value": 42,
      "comparison": {
        "value": 35,
        "change": 20,
        "period": "last_week"
      }
    }
  }
}
```

**Example Response (Chart Widget):**
```json
{
  "456": {
    "type": "bar_chart",
    "data": {
      "series": [
        {
          "name": "Done",
          "data": [10, 15, 20, 25]
        },
        {
          "name": "Working on it",
          "data": [5, 8, 12, 15]
        }
      ],
      "categories": ["Week 1", "Week 2", "Week 3", "Week 4"]
    }
  }
}
```

---

## Key Files Reference

### Server-Side (Ruby on Rails)

**Models:**
- `app/models/overviews/overview.rb` - Dashboard model
- `app/models/overviews/overview_section.rb` - Widget model (100+ subclasses)
- `app/models/data_source.rb` - Data contract model
- `app/models/form_dashboard_link.rb` - Form-dashboard linking

**Controllers:**
- `app/controllers/overviews_controller.rb` - Dashboard REST API
- `app/controllers/internal_ms/overview_sections_internal_controller.rb` - Widget CRUD
- `app/controllers/internal_ms/fetchers_internal_controller.rb` - Data fetching coordination

**Services:**
- `app/services/overview_data_service.rb` - Dashboard data orchestration
- `app/services/overview_section_service.rb` - Widget lifecycle
- `app/services/widgets_data_async_fetcher.rb` - Async data fetching
- `app/services/overview_layout_service.rb` - Layout utilities
- `app/services/data_source/data_source_service.rb` - DataSource management
- `app/services/fetchers/` - Various data fetchers (table, aggregated, paged, etc.)

**Serializers:**
- `app/serializers/overview_serializer.rb`
- `app/serializers/overview_section_serializer.rb`
- `app/serializers/data_source_serializer.rb`

**Pusher:**
- `app/services/pusher/overviews_pusher_service.rb`
- `app/services/pusher/data_sources_pusher_service.rb`

**MS Integration:**
- `app/services/insights_widgets_internal_ms_request_service.rb`
- `app/services/internal_ms_communication/services_config/insights_widgets_endpoints.rb`
- `app/services/internal_ms_communication/services_config/insights_reporting_endpoints.rb`

### Client-Side (React/Redux)

**Components:**
- `app/react/router-containers/overview-container.jsx` - Root container
- `app/react/chunks/overview/components/overview-component/overview-component.jsx` - Main component
- `app/react/chunks/overview/components/current-overview/current-overview-container.jsx`
- `app/react/overview-sections/dashboard-container-overview-section/` - Dashboard container
- `app/react/overview-sections/*/` - 100+ widget components

**Actions:**
- `app/react/actions/overview-entities/fetch-overview.js`
- `app/react/actions/overview-entities/update-overview.js`
- `app/react/actions/overview-section-entities/create-overview-section.js`
- `app/react/actions/overview-section-entities/update-overview-section.js`
- `app/react/actions/data-source-entities/fetch-data-source-data.js`

**Reducers:**
- `app/react/reducers/overview-entities.js`
- `app/react/reducers/overview-section-entities.js`
- `app/react/reducers/data-source-entities.js`
- `app/react/reducers/data-source-data-entities.js`
- `app/react/reducers/overview-views.js`
- `app/react/reducers/overview-section-views.js`

**Selectors:**
- `app/react/selectors/overview-entities/overview-entities-selectors.js`
- `app/react/selectors/overview-section-entities/overview-section-entities-selectors.js`
- `app/react/selectors/data-source-entities/data-source-entities-selectors.js`

**Services:**
- `app/react/services/overview-service/` - Dashboard utilities
- `app/react/services/overview-sections/` - Widget services (100+ classes)
- `app/react/services/grid-layout/` - Grid layout algorithms
- `app/react/services/pusher-service/` - Pusher integration

**Grid Layout:**
- `app/react/services/grid-layout/grid-layout-compactor.js`
- `app/react/services/grid-layout/grid-layout-coordinates-finder.js`
- `app/react/services/grid-layout/grid-layout-duplicator.js`
- `app/react/services/grid-layout/grid-layout-fixer.js`
- `app/react/services/grid-layout/grid-layout-item-finder.js`

**Pusher Handlers:**
- `app/react/services/pusher-service/handlers/overview-channel/`
- `app/react/services/pusher-service/handlers/data-source-channel/`

**Constants:**
- `app/react/constants/grid-layout-constants.js`
- `app/services/overviews_constants.rb`
- `app/services/overview_sections/overview_section_constants.rb`
- `app/services/data_source_constants.rb`

---

## Summary: How to Recreate This System

To build a similar dashboard system, you need:

### 1. Database Layer
- **Dashboards table:** Store metadata, layout, permissions
- **Widgets table:** Store type, settings, filters, query
- **Data contracts table:** Define what data each widget needs
- **Junction table:** Link widgets to data contracts (many-to-many)

### 2. Server API
- **Dashboard CRUD:** Create, read, update, delete dashboards
- **Widget CRUD:** Add, modify, remove widgets
- **Data fetching:** Load widget data based on contracts
- **Authorization:** Check user permissions on dashboards and boards

### 3. Data Loading Strategy
- **Metadata-first:** Return dashboard structure immediately
- **Async widget data:** Load widget data in background
- **Client polling:** Client polls for completed data
- **Caching:** Cache widget data with invalidation on source changes

### 4. Client Application
- **Redux store:** Centralized state for dashboards, widgets, data
- **Grid layout:** Use react-grid-layout or similar for positioning
- **Widget components:** 100+ specialized components for different visualizations
- **Real-time updates:** WebSocket/Pusher for live data sync

### 5. Widget System
- **Base widget class:** Common interface for all widgets
- **Widget service:** Defines metadata, settings schema, data contracts
- **Widget component:** React component for rendering
- **Settings modal:** UI for configuring widget

### 6. Grid Layout System
- **24-column grid:** Flexible positioning
- **Compaction algorithm:** Remove vertical gaps
- **Collision detection:** Prevent overlap
- **Responsive:** Adjust for mobile (collapse to single column)

### 7. Microservices (Optional but Recommended)
- **Data orchestration service:** Coordinate multi-widget data fetching
- **Analytics service:** Compute aggregations for chart/counter widgets
- **Caching layer:** Redis for flow state and data caching

### 8. Real-Time Updates
- **Pusher/WebSocket:** Broadcast changes to connected clients
- **Event types:** Widget CRUD, data changes, layout updates
- **Throttling:** Prevent overwhelming clients with rapid updates

### 9. Cross-Board Aggregation
- **Query engine:** Support filtering across multiple data sources
- **Permission checks:** Verify user can access all queried boards
- **Data merging:** Combine results from multiple sources

### 10. Advanced Features
- **Export to Excel/PDF:** Generate reports from dashboard data
- **Sharing:** Public links with tokens
- **Scheduling:** Automated email reports
- **Migration:** Upgrade dashboards between infrastructure versions
- **Theming:** Light/dark mode support

---

**END OF DOCUMENT**

This comprehensive guide covers the entire monday.com dashboards architecture from database to UI, providing all necessary information to understand or recreate the system. For specific implementation details, refer to the file paths listed in the Key Files Reference section.


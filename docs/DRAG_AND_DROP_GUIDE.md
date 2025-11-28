# Comprehensive Drag and Drop Guide - Leftpane Workspace & Favorites Lists

## Table of Contents
1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [Key Libraries & Dependencies](#key-libraries--dependencies)
4. [Data Types & Interfaces](#data-types--interfaces)
5. [DnD Context & Providers](#dnd-context--providers)
6. [The DnD Service Layer](#the-dnd-service-layer)
7. [Position Calculation System](#position-calculation-system)
8. [Component Hierarchy](#component-hierarchy)
9. [State Management](#state-management)
10. [Event Flow](#event-flow)
11. [Implementation Examples](#implementation-examples)
12. [Best Practices & Patterns](#best-practices--patterns)

---

## Overview

The leftpane drag and drop system enables users to reorder boards, overviews, and other items within workspace lists and favorites lists. The system supports:

- **Vertical Movement**: Dragging items up and down in the list
- **Horizontal Movement**: Changing hierarchy levels (indentation) to move items into/out of folders
- **Dynamic Position Calculation**: Smart positioning between items
- **Permission Control**: Drag actions are permission-based
- **Optimistic Updates**: Local state updates immediately with backend sync

---

## Core Architecture

### High-Level Flow

```
User Interaction (Drag Start)
    ↓
DnD Context (from @dnd-kit/core)
    ↓
DraggableItem Component (useSortable hook)
    ↓
DnD Event Handlers (onDragStart, onDragMove, onDragOver, onDragEnd)
    ↓
DnDService (abstract base class)
    ↓
Specific Service (WorkspaceListDndService or FavoritesDndService)
    ↓
Position Calculation (positions-service.ts)
    ↓
Backend API Call + State Update
```

### Key Design Principles

1. **Separation of Concerns**: DnD logic is separated from rendering logic
2. **Service-Based Architecture**: Each list type has its own DnD service extending a base
3. **Abstract Base Class**: Common DnD logic in `DnDService`, specific implementations extend it
4. **Immutable Position Calculation**: New positions calculated without mutating original data
5. **MobX Store Integration**: Global DnD state managed through MobX store

---

## Key Libraries & Dependencies

### @dnd-kit/core

The foundation library providing drag and drop primitives.

**Main Exports Used:**
- `DndContext`: Provider component wrapping draggable area
- `DragStartEvent`, `DragOverEvent`, `DragEndEvent`: Event types
- `useSensor`, `useSensors`: Configuring input methods
- `PointerSensor`: Mouse/touch drag detection
- `closestCenter`: Collision detection algorithm
- `DragOverlay`: Visual layer for dragged item preview

### @dnd-kit/sortable

Extension for sortable list functionality.

**Main Exports Used:**
- `SortableContext`: Provides sortable context to children
- `useSortable`: Hook for making items draggable/sortable
- `verticalListSortingStrategy`: Strategy for vertical lists

### @dnd-kit/utilities

Utility functions for transformations.

**Main Exports Used:**
- `CSS.Transform.toString()`: Converting transform objects to CSS

---

## Data Types & Interfaces

### LeftpaneDraggableListItem

The core interface for all draggable items:

```typescript
export interface LeftpaneDraggableListItem {
  id: string;                    // Unique item ID (board ID, overview ID, etc.)
  name: string;                  // Display name
  itemType: FAVORITE_ITEM_KIND | LEFTPANE_LIST_ITEM_TYPES | PLACEHOLDER_ITEM_TYPES;
  dndId?: string;                // Drag and drop identifier (usually same as unique_id)
  unique_id: string;             // Globally unique identifier for DnD
  height: number;                // Item height in pixels (usually 32)
  itemHierarchyLevel: number;    // Indentation level (0 = root, 1 = nested once, etc.)
  position: number;              // Numeric position in list
  listAppFeatureReferenceId?: string;  // Reference to app feature if custom list
}
```

### Item Types

```typescript
export enum LEFTPANE_LIST_ITEM_TYPES {
  OVERVIEW = 'overview',
  BOARD = 'board',
  FOLDER = 'folder',
}

export enum FAVORITE_ITEM_KIND {
  BOARD = 'board',
  OVERVIEW = 'overview',
  FOLDER = 'folder',
}
```

### LeftpanePosition

Result of position calculation during drag operations:

```typescript
export type LeftpanePosition = {
  newLevel: number;               // New hierarchy level
  newFolderId?: string;           // Parent folder ID (undefined if root level)
  newPosition?: number;           // New numeric position
  newDynamicPosition?: DynamicPosition;  // Relative position descriptor
};
```

### DynamicPosition

Describes position relative to another item:

```typescript
export interface DynamicPosition {
  object_id: string;      // Reference item ID
  object_type: string;    // Reference item type ('Item', 'BoardFolder', 'Overview')
  is_after: boolean;      // true = place after reference, false = place before
}
```

This is sent to the backend API which can resolve the exact position even if the list changes.

---

## DnD Context & Providers

### DndContext Setup

Located in `LeftpaneVirtualizedList` component:

```typescript
<DndContext
  collisionDetection={customCollisionDetectionAlgorithm}
  onDragStart={onDragStartWrapper}
  onDragEnd={onDragEndWrapper}
  onDragOver={onDragOverWrapper}
  onDragMove={onDragMoveWrapper}
  cancelDrop={cancelDropWrapper}
  modifiers={[restrictToSmallHorizontalAxis]}
  sensors={dndSensors}
>
  <SortableContext items={dndItems} strategy={verticalListSortingStrategy} disabled={disableDnD}>
    {/* List content */}
  </SortableContext>
  
  <DragOverlay style={{ zIndex: 1000 }}>
    {draggedItem && itemRenderer(draggedItem, draggedItemIndex, true)}
  </DragOverlay>
</DndContext>
```

### Sensors Configuration

Sensors determine how drag operations are initiated:

```typescript
const dndSensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10,  // Drag must move 10px before activating
    },
  })
);
```

This prevents accidental drags during clicks.

### Collision Detection

Custom algorithm that respects permissions:

```typescript
const customCollisionDetectionAlgorithm = args => {
  return !permissionToDrag ? [] : closestCenter(args);
};
```

If user doesn't have permission, return empty array (no collisions = no drop targets).

### Modifiers

Restrict horizontal movement:

```typescript
export const restrictToSmallHorizontalAxis: Modifier = ({ transform }) => {
  const newX = transform.x > 0 ? Math.min(transform.x, 100) : Math.max(transform.x, -100);
  return {
    ...transform,
    x: newX,
  };
};
```

Limits drag movement to ±100px horizontally, keeping items visually close to their column.

---

## The DnD Service Layer

### Base DnDService Class

Abstract base class providing common drag and drop logic:

```typescript
export abstract class DnDService {
  allSortedItems: LeftpaneDraggableListItem[];
  supportNestedFolders: boolean = true;  // Override in subclasses

  constructor(allSortedItems: LeftpaneDraggableListItem[]) {
    this.allSortedItems = allSortedItems;
  }

  // Abstract methods - must be implemented by subclasses
  abstract getItemFolder(item: LeftpaneDraggableListItem): string | undefined;
  abstract collapseFolderAction(folderId: string): void;
  abstract expandFolderAction(folderId: string): void;
  abstract dragEndAction(draggedItem: LeftpaneDraggableListItem, newPosition: LeftpanePosition): void;

  // Concrete methods - shared logic
  isFolderListItem(item: LeftpaneDraggableListItem): boolean;
  handleDnDStart(item: LeftpaneDraggableListItem): void;
  handleDnDMove(...): void;
  handleDnDOver(...): void;
  handleDnDEnd(...): void;
}
```

### WorkspaceListDndService

Handles workspace-specific drag and drop:

```typescript
export class WorkspaceListDndService extends DnDService {
  activeWorkspaceId: number;
  
  constructor(allSortedItems: LeftpaneDraggableListItem[], activeWorkspaceId: number) {
    super(allSortedItems);
    this.activeWorkspaceId = activeWorkspaceId;
  }

  // Get folder containing this item
  getItemFolder(item: LeftpaneDraggableListItem): string | undefined {
    const vulcanState = vulcan.getState();
    return getObjectFolderId(vulcanState, item.itemType, item.id);
  }

  // Collapse folder in UI
  collapseFolderAction(folderId: string): void {
    collapseFolder(folderId);
  }

  // Expand folder in UI
  expandFolderAction(folderId: string): void {
    expandFolder(folderId);
  }

  // Execute drop - update position
  dragEndAction = (draggedItem: LeftpaneDraggableListItem, newPosition: LeftpanePosition): void => {
    const currFolderId = this.getItemFolder(draggedItem);

    if (newPosition.newPosition && newPosition.newDynamicPosition) {
      const options: ChangeObjectPositionActionOptions = {
        objectId: draggedItem.id,
        currentPosition: draggedItem.position,
        newPosition: newPosition.newPosition,
        currFolderId: currFolderId,
        targetFolderId: newPosition.newFolderId,
        currWorkspaceId: this.activeWorkspaceId,
        targetWorkspaceId: this.activeWorkspaceId,
        newDynamicPosition: newPosition.newDynamicPosition,
        bigbrainArgs: { info2: newPosition.newFolderId?.toString(), placement: BIG_BRAIN_PLACEMENTS.LEFTPANE },
      };
      
      // Track analytics
      trackEvent(DROP_LEFTPANE_ITEM, { /* ... */ });
      
      // Update position by type
      this.changePositionByObjectType(draggedItem.itemType, options);
    }
  };

  // Route to correct update action based on item type
  changePositionByObjectType(itemType, options) {
    switch (itemType) {
      case LEFTPANE_LIST_ITEM_TYPES.FOLDER:
        changeFolderPositionAction(options);
        updateFolderPosition(options.objectId, options.newPosition, options.targetFolderId);
        break;
      case LEFTPANE_LIST_ITEM_TYPES.BOARD:
        changeBoardPositionAction(options);
        updateBoardPosition(options.objectId, options.newPosition, options.targetFolderId);
        break;
      case LEFTPANE_LIST_ITEM_TYPES.OVERVIEW:
        changeOverviewPositionAction(options);
        updateOverviewPosition(options.objectId, options.newPosition, options.targetFolderId);
        break;
    }
  }
}
```

### FavoritesDndService

Handles favorites-specific drag and drop:

```typescript
export class FavoritesDndService extends DnDService {
  supportNestedFolders: boolean = false;  // Favorites don't support nested folders

  isFolderListItem = (item: LeftpaneDraggableListItem): boolean => 
    item.itemType === FAVORITE_ITEM_KIND.FOLDER;

  getItemFolder(item: LeftpaneDraggableListItem): string | undefined {
    const vulcanState = vulcan.getState();
    return selectItemFolderId(vulcanState, item.unique_id);
  }

  collapseFolderAction(folderId: string): void {
    collapseFolder(folderId);
  }

  expandFolderAction(folderId: string): void {
    expandFolder(folderId);
  }

  dragEndAction = async (draggedItem: LeftpaneDraggableListItem, newPosition: LeftpanePosition): Promise<void> => {
    if (newPosition.newPosition) {
      try {
        await updateFavoriteItemPosition(
          draggedItem.unique_id,
          newPosition.newPosition,
          newPosition.newFolderId,
          newPosition.newDynamicPosition
        );
      } catch (error) {
        getAPI().loggerService.error(error, { message: 'Error updating favorite item position' });
      }
    }
  };
}
```

---

## Position Calculation System

### Overview

Position calculation determines where an item should be placed when dropped. The system uses:

1. **Numeric Positions**: Decimal numbers allowing infinite insertions without reordering
2. **Dynamic Positions**: Relative descriptors (before/after another item)
3. **Hierarchy Levels**: Track folder nesting depth

### Key Functions

#### calcNewItemPosition

Main function calculating new position:

```typescript
export const calcNewItemPosition = (
  draggedItem: LeftpaneDraggableListItem,
  sortedList: LeftpaneDraggableListItem[],
  overItem: LeftpaneDraggableListItem,
  overItemIndex: number,
  isMovingUp: boolean,
  newLevel: number
) => {
  let newPosition: number;
  let dynamicPosition: DynamicPosition;

  // Three scenarios:
  
  // 1. Dropping at end of list or folder
  if (isLastInList(...) || isLastInFolder(...)) {
    const upperItem = /* find item above in same level */;
    newPosition = getNewLastItemPosition(upperItem.position);
    dynamicPosition = {
      object_id: upperItem.id,
      object_type: getServerObjectType(upperItem.itemType),
      is_after: true,
    };
  }
  
  // 2. Dropping at start of list or folder
  else if (isFirstInList(...) || isFirstInFolder(...)) {
    const lowerItem = /* find item below */;
    newPosition = getNewFirstPosition(lowerItem.position);
    dynamicPosition = {
      object_id: lowerItem.id,
      object_type: getServerObjectType(lowerItem.itemType),
      is_after: false,
    };
  }
  
  // 3. Dropping between two items
  else {
    const upperItem = /* find item above in same level */;
    const lowerItem = /* find item below in same level */;
    newPosition = calcNewMiddlePosition(lowerItem.position, upperItem.position);
    dynamicPosition = {
      object_id: upperItem.id,
      object_type: getServerObjectType(upperItem.itemType),
      is_after: true,
    };
  }

  reportConflictsIfNeeded(newPosition, overItem.position);
  
  return { newPosition, newDynamicPosition: dynamicPosition };
};
```

### Position Generation

```typescript
// Inserting before first item
const getNewFirstPosition = (currentFirstPosition: number): number => {
  return Math.max(currentFirstPosition / 2, currentFirstPosition - FIRST_ITEM_MARGIN);
};

// Inserting after last item
const getNewLastItemPosition = (currentLastPosition: number): number => {
  return currentLastPosition + NEW_LAST_ITEM_MARGIN;
};

// Inserting between two items
const calcNewMiddlePosition = (prevItemPosition: number, nextItemPosition: number): number => {
  return (prevItemPosition + nextItemPosition) / 2;
};
```

**Constants:**
- `FIRST_ITEM_MARGIN = 128`: Space before first item
- `NEW_LAST_ITEM_MARGIN = 65536`: Large gap after last item

This approach creates decimal positions between existing items, avoiding the need to renumber all items.

### Horizontal Movement (Folder Nesting)

#### Movement Detection

```typescript
const MIN_HORIZONTAL_MOVEMENT = 25;  // Minimum pixels to register movement
const HORIZONTAL_MOVEMENT_JUMPS = 15; // Pixels per hierarchy level change

const calcHorizontalJumps = (deltaX: number) => {
  if (Math.abs(deltaX) < MIN_HORIZONTAL_MOVEMENT) {
    return 0;
  }
  if (Math.abs(deltaX) < MIN_HORIZONTAL_MOVEMENT + HORIZONTAL_MOVEMENT_JUMPS) {
    return 1;
  }
  return Math.floor((Math.abs(deltaX) - MIN_HORIZONTAL_MOVEMENT) / HORIZONTAL_MOVEMENT_JUMPS) + 1;
};
```

#### Level Calculation

The DnD service tracks horizontal movements and calculates new hierarchy levels:

```typescript
// Moving right (into folder)
private handleEnterToFolder = (upperItem: LeftpaneDraggableListItem, jumpsToMake: number, currLevel: number) => {
  const maxLevel = this.isFolderListItem(upperItem) 
    ? upperItem.itemHierarchyLevel + 1 
    : upperItem.itemHierarchyLevel;
  const newLevel = Math.min(maxLevel, currLevel + jumpsToMake);
  Store.leftpaneDnDStore.incrementHorizontalMovements(newLevel - currLevel);
  return newLevel;
};

// Moving left (out of folder)
private handleExitFromFolder = (lowerItem: LeftpaneDraggableListItem | undefined, jumpsToMake: number, currLevel: number) => {
  const minLevel = lowerItem?.itemHierarchyLevel || 0;
  const newLevel = Math.max(minLevel, currLevel - jumpsToMake);
  Store.leftpaneDnDStore.incrementHorizontalMovements(currLevel - newLevel);
  return newLevel;
};
```

### Folder Detection

```typescript
private getPrevFolderInHigherLevel = (sortedList: LeftpaneDraggableListItem[], currIndex: number, level: number) => {
  if (level === 0) {
    return undefined;  // Root level has no folder
  }
  // Search backwards for folder at parent level
  for (let i = currIndex; i >= 0; i--) {
    const item = sortedList[i];
    if (this.isFolderListItem(item) && item.itemHierarchyLevel < level) {
      return item;
    }
  }
  return undefined;
};
```

---

## Component Hierarchy

### Overall Structure

```
LeftpaneVirtualizedList (DnD Context Provider)
  ├── DndContext (@dnd-kit/core)
  │   └── SortableContext (@dnd-kit/sortable)
  │       └── VirtualizedListV2 (Virtualized rendering)
  │           └── [For each visible item]
  │               └── DraggableItem (useSortable wrapper)
  │                   └── WorkspaceListItem / FavoritesListItem
  │                       └── LeftpaneBaseListItem
  └── DragOverlay (Dragged item preview)
```

### LeftpaneVirtualizedList

The main list component that sets up DnD:

```typescript
const LeftpaneVirtualizedList = ({
  itemsList,          // Array of draggable items
  itemRenderer,       // Function to render each item
  dndService,         // DnD service instance
  disableDnD,         // Disable drag and drop
  permissionToDrag,   // User has permission to drag
  shouldCancelDrop,   // Optional callback to cancel drop
  sectionType,        // WORKSPACE_ITEMS_STATE or FAVORITES_STATE
  // ... other props
}) => {
  // State for current drag
  const [draggedItem, setDraggedItem] = useState<LeftpaneDraggableListItem | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number>(0);

  // Configure sensors
  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  // Prepare items for sortable context
  const dndItems: string[] = useMemo(
    () => itemsList
      .filter(item => !PLACEHOLDER_ITEM_TYPES_VALUES.includes(item.itemType))
      .map(item => item.unique_id),
    [itemsList]
  );

  // Event handlers (detailed in Event Flow section)
  const onDragStartWrapper = useCallback(...);
  const onDragEndWrapper = useCallback(...);
  const onDragOverWrapper = useCallback(...);
  const onDragMoveWrapper = useCallback(...);
  const cancelDropWrapper = useCallback(...);

  return (
    <DndContext
      collisionDetection={customCollisionDetectionAlgorithm}
      onDragStart={onDragStartWrapper}
      onDragEnd={onDragEndWrapper}
      onDragOver={onDragOverWrapper}
      onDragMove={onDragMoveWrapper}
      cancelDrop={cancelDropWrapper}
      modifiers={[restrictToSmallHorizontalAxis]}
      sensors={dndSensors}
    >
      <SortableContext items={dndItems} strategy={verticalListSortingStrategy} disabled={disableDnD}>
        {/* List rendering */}
      </SortableContext>
      
      <DragOverlay style={{ zIndex: 1000 }}>
        {draggedItem && itemRenderer(draggedItem, draggedItemIndex, true)}
      </DragOverlay>
    </DndContext>
  );
};
```

### DraggableItem Component

Wrapper making individual items draggable:

```typescript
const DraggableItem = ({ dndId, item, children, index }: DraggableItemProps) => {
  const { leftpaneDnDStore } = useStore();
  const { isDnDItemDisabled } = leftpaneDnDStore;

  // useSortable hook provides drag functionality
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dndId,
    data: { item, index: index },  // Attach item data to drag event
    disabled: isDnDItemDisabled(item) || undefined,
  });

  // Apply transform for visual drag feedback
  const style = useMemo(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
    };
  }, [transform, transition]);

  return (
    <div 
      ref={setNodeRef} 
      className={classNames(styles.isDragging)} 
      style={style} 
      {...listeners}  // Attach drag listeners
    >
      {React.cloneElement(children, { isDragging })}
    </div>
  );
};
```

**Key Points:**
- `useSortable` hook connects to SortableContext
- `listeners` contains mouse/touch event handlers
- `setNodeRef` registers the DOM node
- `transform` contains current drag translation
- `data` object passed will be available in drag events

### WorkspaceListItem / FavoritesListItem

Specific list item implementations:

```typescript
const WorkspaceListItem = ({ item, isDragLayer, isDragging, indexInList }: WorkspaceListItemProps) => {
  const { leftpaneDnDStore } = useStore();
  const { enableDnDItem, disableDnDItem } = leftpaneDnDStore;

  // Disable dragging when in edit mode
  const isEditMode = itemService.isListItemInEditMode();
  
  useEffect(() => {
    if (isEditMode) {
      disableDnDItem(item);
    } else {
      enableDnDItem(item);
    }
  }, [isEditMode, enableDnDItem, disableDnDItem, item]);

  return (
    <LeftpaneBaseListItem
      id={item.unique_id}
      title={item.name}
      itemHierarchyLevel={item.itemHierarchyLevel}
      isDragLayer={isDragLayer}
      isDragging={isDragging}
      // ... other props
    />
  );
};
```

### LeftpaneBaseListItem

Base component rendering list item UI:

```typescript
const LeftpaneBaseListItem = ({
  id,
  title,
  iconRenderer,
  onClick,
  selected,
  itemHierarchyLevel,
  isDragLayer,
  isDragging,
  // ... other props
}: LeftpaneListItemProps) => {
  // Calculate indentation based on hierarchy level
  const listItemIndent = getListItemIndent(itemHierarchyLevel);
  
  return (
    <div 
      style={{ 
        paddingLeft: listItemIndent,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={classNames({
        [styles.selected]: selected,
        [styles.dragging]: isDragging,
        [styles.dragLayer]: isDragLayer,
      })}
    >
      <ListItem>
        {iconRenderer()}
        <span>{title}</span>
        {/* Menu, etc. */}
      </ListItem>
    </div>
  );
};
```

**Indentation Calculation:**

```typescript
const ITEM_INDENT_BASE = 12;
const ITEM_INDENT_PER_LEVEL = 16;

export const getListItemIndent = (itemHierarchyLevel: number): number => {
  return ITEM_INDENT_BASE + (itemHierarchyLevel * ITEM_INDENT_PER_LEVEL);
};
```

- Level 0: 12px padding
- Level 1: 28px padding (12 + 16)
- Level 2: 44px padding (12 + 32)
- etc.

---

## State Management

### DnD Store (MobX)

Global state for drag and drop operations:

```typescript
export default class leftpaneDnDStore {
  api!: MicroFrontendAPI;
  draggedItem?: LeftpaneDraggableListItem;
  horizontalMovements: number = 0;
  disabledDnDItems: Set<string> = new Set<string>();

  constructor() {
    makeAutoObservable(this);
  }

  // Track currently dragged item
  setDraggedItem(draggedItem: LeftpaneDraggableListItem) {
    this.draggedItem = draggedItem;
  }

  removeDraggedItem() {
    this.draggedItem = undefined;
  }

  // Update hierarchy level during drag
  setDraggedItemHierarchyLevel(itemHierarchyLevel: number) {
    if (this.draggedItem) {
      this.draggedItem.itemHierarchyLevel = itemHierarchyLevel;
    }
  }

  // Track cumulative horizontal movements
  incrementHorizontalMovements(increaseBy: number) {
    this.horizontalMovements += increaseBy;
  }

  resetHorizontalMovements() {
    this.horizontalMovements = 0;
  }

  // Enable/disable drag for specific items
  disableDnDItem = (item: LeftpaneDraggableListItem) => {
    this.disabledDnDItems.add(item.unique_id);
  };

  enableDnDItem = (item: LeftpaneDraggableListItem) => {
    this.disabledDnDItems.delete(item.unique_id);
  };

  isDnDItemDisabled = (item: LeftpaneDraggableListItem) => {
    return this.disabledDnDItems.has(item.unique_id);
  };
}
```

**Usage:**
- Items in edit mode are disabled from dragging
- Horizontal movements accumulated during a drag to calculate level changes
- Dragged item reference used for visual feedback

### Local State in List Components

#### WorkspaceListContent

```typescript
const WorkspaceListContent = () => {
  const { workspacesStoreData, leftpaneGeneralData, workspaceListData } = useStore();
  
  // Permission checks
  const canDragInScope = workspacesStoreData.activeWorkspacePermissions.getCanDragInWorkspace;
  const disableDnd = isGuest;
  const permissionToDrag = canDragInScope;

  // Alphabetical sort check
  const isInAlphabeticalSortMode = workspaceListData.getIsListOrderedInAlphabeticalSortByWorkspaceId(identifyKey);

  // Cancel drop if in alphabetical mode
  const shouldCancelDrop = useCallback(() => {
    if (isInAlphabeticalSortMode) {
      onAlphabeticalSort(identifyKey);
      return true;
    }
    return false;
  }, [identifyKey, isInAlphabeticalSortMode]);

  // Get sorted items
  const sortedWorkspaceList = useMemo(() => {
    return getUnifiedVirtualizedItemsList(
      leftpaneWorkspaceData,
      isInAlphabeticalSortMode,
      leftpaneMaxFolderLevel,
      leftpaneSearchObject
    );
  }, [leftpaneWorkspaceData, isInAlphabeticalSortMode, leftpaneMaxFolderLevel]);

  // Create DnD service
  const dndService = useMemo(() => {
    return new WorkspaceListDndService(sortedWorkspaceList, activeWorkspaceId!);
  }, [activeWorkspaceId, sortedWorkspaceList]);

  return (
    <LeftpaneVirtualizedList
      itemsList={sortedWorkspaceList}
      itemRenderer={itemRenderer}
      dndService={dndService}
      disableDnD={disableDnd}
      permissionToDrag={permissionToDrag}
      shouldCancelDrop={shouldCancelDrop}
      sectionType={NAVIGATION_STATES.WORKSPACE_ITEMS_STATE}
    />
  );
};
```

#### FavoritesListContent

```typescript
const FavoritesListContent = () => {
  // Get sorted favorites
  const sortedFavoritesList = useGetSortedFavoriteItems();

  // Create DnD service
  const dndService = useMemo(() => {
    return new FavoritesDndService(sortedFavoritesList);
  }, [sortedFavoritesList]);

  return (
    <LeftpaneVirtualizedList
      itemsList={favoritesItemsList}
      itemRenderer={itemRenderer}
      dndService={dndService}
      sectionType={NAVIGATION_STATES.FAVORITES_STATE}
    />
  );
};
```

---

## Event Flow

### Complete Drag Lifecycle

```
1. User presses mouse/touch on item
2. PointerSensor detects movement > 10px
3. onDragStart fires
4. During drag: onDragMove fires continuously
5. When hovering items: onDragOver fires
6. User releases: onDragEnd fires
7. Position calculated and backend updated
```

### Event Handlers in Detail

#### onDragStart

Called when drag begins:

```typescript
const onDragStartWrapper = useCallback(
  (event: DragStartEvent) => {
    // Extract item data attached in DraggableItem
    const draggedItem = event.active.data.current?.item as LeftpaneDraggableListItem;
    const draggedItemIndex = event.active.data.current?.index as number;
    
    // Notify service (collapses folder if dragging a folder)
    dndService.handleDnDStart(draggedItem);
    
    // Store in local state for drag overlay
    setDraggedItem(draggedItem);
    setDraggedItemIndex(draggedItemIndex);
  },
  [dndService]
);
```

**In DnDService.handleDnDStart:**

```typescript
handleDnDStart = (item: LeftpaneDraggableListItem) => {
  Store.leftpaneDnDStore.setDraggedItem(item);
  
  // Collapse folder being dragged so it doesn't interfere
  if (this.isFolderListItem(item)) {
    this.collapseFolderAction(item.id);
  }
};
```

#### onDragMove

Called continuously as item moves:

```typescript
const onDragMoveWrapper = useCallback(
  (event: DragOverEvent) => {
    const { over } = event;
    const overItem = over?.data.current?.item as LeftpaneDraggableListItem;
    const overItemIndex = over?.data.current?.index as number;
    
    // Calculate movement direction and magnitude
    const { verticalMovement, horizontalMovement } = getVerticalAndHorizontalData(event, draggedItemIndex);

    if (draggedItem) {
      // Update dragged item's hierarchy level in real-time
      dndService.handleDnDMove(draggedItem, overItem, overItemIndex, verticalMovement, horizontalMovement);
    }
  },
  [draggedItem, draggedItemIndex, dndService]
);
```

**getVerticalAndHorizontalData:**

```typescript
export const getVerticalAndHorizontalData = (event: DragOverEvent | DragEndEvent, draggedItemIndex: number) => {
  const overItemIndex = event.over?.data.current?.index as number;
  
  // Horizontal movement
  const horizontalMovement =
    Math.abs(event.delta.x) > MIN_HORIZONTAL_MOVEMENT
      ? {
          isMovingRight: event.delta.x > 0,
          horizontalJumps: calcHorizontalJumps(event.delta.x),
        }
      : undefined;
  
  // Vertical movement
  const verticalMovement = overItemIndex !== draggedItemIndex 
    ? { isMovingUp: event.delta.y < 0 } 
    : undefined;
  
  return { verticalMovement, horizontalMovement };
};
```

**In DnDService.handleDnDMove:**

```typescript
handleDnDMove = (
  draggedItem: LeftpaneDraggableListItem,
  overItem?: LeftpaneDraggableListItem,
  overItemIndex?: number,
  verticalMovement?: { isMovingUp: boolean },
  horizontalMovement?: { isMovingRight: boolean; horizontalJumps: number }
): void => {
  if (!overItem) return;
  
  // Calculate new position (without persisting)
  const { newLevel } = this.calcNewLeftpanePosition(
    draggedItem,
    overItem,
    overItemIndex!,
    verticalMovement,
    horizontalMovement
  );

  // Update visual hierarchy level
  const draggedItemInStore = Store.leftpaneDnDStore.draggedItem;
  if (draggedItemInStore && newLevel !== undefined && newLevel !== draggedItemInStore.itemHierarchyLevel) {
    Store.leftpaneDnDStore.setDraggedItemHierarchyLevel(newLevel);
  }
};
```

#### onDragOver

Called when dragging over different items:

```typescript
const onDragOverWrapper = useCallback(
  (event: DragOverEvent) => {
    const { over } = event;
    const overItem = over?.data.current?.item as LeftpaneDraggableListItem;
    
    if (draggedItem) {
      dndService.handleDnDOver(draggedItem, overItem);
    }
  },
  [dndService, draggedItem]
);
```

**In DnDService.handleDnDOver:**

```typescript
handleDnDOver = (draggedItem: LeftpaneDraggableListItem, overItem?: LeftpaneDraggableListItem) => {
  if (!overItem || draggedItem.id === overItem.id) {
    return;
  }
  
  // Handle folder expansion/collapse
  if (!this.supportNestedFolders && this.isFolderListItem(draggedItem)) {
    // Dragging a folder in favorites - collapse any folder we hover over
    let folderToCollapse;
    if (this.isFolderListItem(overItem)) {
      folderToCollapse = overItem?.id;
    } else {
      folderToCollapse = this.getItemFolder(overItem);
    }
    if (folderToCollapse) {
      this.collapseFolderAction(folderToCollapse);
    }
  } else if (this.isFolderListItem(overItem)) {
    // Hovering over a folder - expand it
    this.expandFolderAction(overItem.id);
  }
};
```

This creates the UX where folders expand as you hover over them during drag.

#### onDragEnd

Called when drag completes:

```typescript
const onDragEndWrapper = useCallback(
  (event: DragEndEvent) => {
    const { over } = event;
    const overItem = over?.data.current?.item as LeftpaneDraggableListItem;
    const overItemIndex = over?.data.current?.index as number;
    const { verticalMovement, horizontalMovement } = getVerticalAndHorizontalData(event, draggedItemIndex);
    
    if (draggedItem) {
      // Calculate final position and execute drop
      dndService.handleDnDEnd(draggedItem, overItem, overItemIndex, verticalMovement, horizontalMovement);
    }
    
    // Clear drag state
    setDraggedItem(null);
  },
  [draggedItem, draggedItemIndex, dndService]
);
```

**In DnDService.handleDnDEnd:**

```typescript
handleDnDEnd = (
  draggedItem: LeftpaneDraggableListItem,
  overItem: LeftpaneDraggableListItem,
  overItemIndex: number,
  verticalMovement?: { isMovingUp: boolean },
  horizontalMovement?: { isMovingRight: boolean; horizontalJumps: number }
) => {
  if (!overItem || overItemIndex == undefined) {
    return;
  }

  // Calculate final position WITH position calculation
  const newPositionObject = this.calcNewLeftpanePosition(
    draggedItem,
    overItem,
    overItemIndex!,
    verticalMovement,
    horizontalMovement,
    true  // withPositionCalculation = true
  );

  // Execute drop (calls backend API)
  this.dragEndAction(draggedItem, newPositionObject);
  
  // Expand destination folder
  if (newPositionObject.newFolderId) {
    this.expandFolderAction(newPositionObject.newFolderId);
  }
  
  // Reset state
  Store.leftpaneDnDStore.resetHorizontalMovements();
  Store.leftpaneDnDStore.removeDraggedItem();
};
```

#### cancelDrop

Determines if drop should be canceled:

```typescript
const cancelDropWrapper = useCallback(
  (event: DragEndEvent) => {
    // No permission - cancel
    if (!permissionToDrag) {
      onNoPermissionToDrag();
      return true;
    }
    
    // Custom cancel logic (e.g., alphabetical sort mode)
    if (shouldCancelDrop && shouldCancelDrop()) {
      return true;
    }
    
    // Dropped outside list bounds - cancel
    return isOutsideListBounds(event, ref);
  },
  [ref, permissionToDrag, shouldCancelDrop]
);
```

**isOutsideListBounds:**

```typescript
export const isOutsideListBounds = (event: DragEndEvent, ref: MutableRefObject<HTMLDivElement>) => {
  const draggedRectTop = event.active.rect.current.translated?.top;
  const draggedRectBot = event.active.rect.current.translated?.bottom;
  const boundsOfList = ref.current.getBoundingClientRect();
  
  return (
    (draggedRectBot && boundsOfList.top > draggedRectBot) ||
    (draggedRectTop && boundsOfList.bottom < draggedRectTop) ||
    false
  );
};
```

---

## Implementation Examples

### Example 1: Basic Workspace List with DnD

```typescript
import { useMemo } from 'react';
import { observer } from 'mobx-react';
import { LeftpaneVirtualizedList } from 'components/leftpane-items-list/base/leftpane-virtualized-list/leftpane-virtualized-list';
import { WorkspaceListDndService } from 'components/leftpane-items-list/workspace-list/workspace-list/services/workspace-list-dnd-service';
import WorkspaceListItem from 'components/leftpane-items-list/workspace-list/workspace-list-item/workspace-list-item';

const MyWorkspaceList = () => {
  // Get sorted items from your data source
  const sortedItems = useGetSortedWorkspaceItems();
  const activeWorkspaceId = useActiveWorkspaceId();
  
  // Create DnD service
  const dndService = useMemo(() => {
    return new WorkspaceListDndService(sortedItems, activeWorkspaceId);
  }, [sortedItems, activeWorkspaceId]);
  
  // Render function
  const itemRenderer = useCallback((item, index, isDragLayer) => {
    return (
      <WorkspaceListItem 
        item={item} 
        isDragLayer={isDragLayer} 
        indexInList={index} 
      />
    );
  }, []);
  
  return (
    <LeftpaneVirtualizedList
      itemsList={sortedItems}
      itemRenderer={itemRenderer}
      dndService={dndService}
      disableDnD={false}
      permissionToDrag={true}
      sectionType={NAVIGATION_STATES.WORKSPACE_ITEMS_STATE}
    />
  );
};

export default observer(MyWorkspaceList);
```

### Example 2: Custom DnD Service

```typescript
import { DnDService } from 'components/leftpane-items-list/base/dnd/dnd-service';
import { LeftpaneDraggableListItem, LeftpanePosition } from 'types';

export class CustomListDndService extends DnDService {
  // Set nested folder support
  supportNestedFolders: boolean = true;

  // Implement required methods
  getItemFolder(item: LeftpaneDraggableListItem): string | undefined {
    // Return parent folder ID from your data source
    return myDataStore.getParentFolderId(item.id);
  }

  collapseFolderAction(folderId: string): void {
    // Collapse folder in your UI
    myDataStore.collapseFolder(folderId);
  }

  expandFolderAction(folderId: string): void {
    // Expand folder in your UI
    myDataStore.expandFolder(folderId);
  }

  dragEndAction = async (draggedItem: LeftpaneDraggableListItem, newPosition: LeftpanePosition): Promise<void> => {
    if (!newPosition.newPosition || !newPosition.newDynamicPosition) {
      return;
    }

    // Update local state optimistically
    myDataStore.updateItemPosition(
      draggedItem.id,
      newPosition.newPosition,
      newPosition.newFolderId
    );

    try {
      // Call your backend API
      await myApi.updateItemPosition({
        itemId: draggedItem.id,
        position: newPosition.newPosition,
        folderId: newPosition.newFolderId,
        dynamicPosition: newPosition.newDynamicPosition,
      });
      
      // Track analytics
      trackEvent('ITEM_REPOSITIONED', {
        itemType: draggedItem.itemType,
        newLevel: newPosition.newLevel,
      });
    } catch (error) {
      // Rollback on error
      myDataStore.rollbackItemPosition(draggedItem.id);
      showErrorNotification('Failed to update position');
    }
  };
}
```

### Example 3: Custom Item Renderer

```typescript
const CustomItemRenderer = ({ item, isDragLayer, isDragging, indexInList }) => {
  const itemService = useItemService(item);
  
  return (
    <LeftpaneBaseListItem
      id={item.unique_id}
      title={item.name}
      iconRenderer={() => <MyCustomIcon item={item} />}
      onClick={(e, isNewTab) => handleItemClick(item, isNewTab)}
      selected={isItemSelected(item)}
      itemHierarchyLevel={item.itemHierarchyLevel}
      isDragLayer={isDragLayer}
      isDragging={isDragging}
      menuToRender={() => <MyCustomMenu item={item} />}
      isLoading={itemService.isLoading}
      isEditMode={false}
      onNameChange={(newName) => itemService.rename(newName)}
      onEditModeChange={(editing) => itemService.setEditMode(editing)}
    />
  );
};
```

### Example 4: Permission-Based Dragging

```typescript
const PermissionAwareList = () => {
  const { canDragItems, canDropIntoFolders } = usePermissions();
  const sortedItems = useSortedItems();
  
  // Disable specific items based on permissions
  useEffect(() => {
    sortedItems.forEach(item => {
      if (!canDragItem(item)) {
        leftpaneDnDStore.disableDnDItem(item);
      }
    });
  }, [sortedItems, canDragItem]);
  
  // Custom cancel logic
  const shouldCancelDrop = useCallback((event) => {
    const overItem = event.over?.data.current?.item;
    
    // Don't allow dropping into folders user doesn't have access to
    if (overItem?.itemType === 'folder' && !canDropIntoFolders(overItem.id)) {
      showNotification('No permission to drop here');
      return true;
    }
    
    return false;
  }, [canDropIntoFolders]);
  
  return (
    <LeftpaneVirtualizedList
      itemsList={sortedItems}
      itemRenderer={itemRenderer}
      dndService={dndService}
      disableDnD={!canDragItems}
      permissionToDrag={canDragItems}
      shouldCancelDrop={shouldCancelDrop}
      sectionType={NAVIGATION_STATES.WORKSPACE_ITEMS_STATE}
    />
  );
};
```

---

## Best Practices & Patterns

### 1. Service Instantiation

**✅ Good:**
```typescript
const dndService = useMemo(() => {
  return new WorkspaceListDndService(sortedList, workspaceId);
}, [sortedList, workspaceId]);
```

**❌ Bad:**
```typescript
// Creates new service on every render
const dndService = new WorkspaceListDndService(sortedList, workspaceId);
```

**Why:** DnD service should be stable across renders. Only recreate when dependencies change.

### 2. Item Unique IDs

**✅ Good:**
```typescript
const item: LeftpaneDraggableListItem = {
  id: '12345',
  unique_id: 'board_12345',  // Type-prefixed
  dndId: 'board_12345',       // Same as unique_id
  // ...
};
```

**❌ Bad:**
```typescript
const item = {
  id: '12345',
  unique_id: '12345',  // Not unique across types
  // ...
};
```

**Why:** Unique IDs must be globally unique across all draggable item types. Prefix with type to ensure uniqueness.

### 3. Position Updates

**✅ Good:**
```typescript
dragEndAction = async (draggedItem, newPosition) => {
  // Update local state first (optimistic)
  updateLocalState(draggedItem.id, newPosition);
  
  try {
    // Then call backend
    await api.updatePosition(draggedItem.id, newPosition);
  } catch (error) {
    // Rollback on error
    rollbackLocalState(draggedItem.id);
    showErrorNotification();
  }
};
```

**❌ Bad:**
```typescript
dragEndAction = async (draggedItem, newPosition) => {
  // Wait for backend before updating UI
  await api.updatePosition(draggedItem.id, newPosition);
  updateLocalState(draggedItem.id, newPosition);
};
```

**Why:** Optimistic updates provide better UX. Update UI immediately, rollback on error.

### 4. Disabling Items

**✅ Good:**
```typescript
useEffect(() => {
  if (isEditMode) {
    leftpaneDnDStore.disableDnDItem(item);
  } else {
    leftpaneDnDStore.enableDnDItem(item);
  }
}, [isEditMode, item]);
```

**❌ Bad:**
```typescript
// Disabling in render
if (isEditMode) {
  leftpaneDnDStore.disableDnDItem(item);
}
```

**Why:** Use effects for side effects. Render should be pure.

### 5. Event Handler Memoization

**✅ Good:**
```typescript
const onDragEndWrapper = useCallback(
  (event: DragEndEvent) => {
    // handler logic
  },
  [draggedItem, dndService]
);
```

**❌ Bad:**
```typescript
const onDragEndWrapper = (event: DragEndEvent) => {
  // handler logic - recreated every render
};
```

**Why:** Memoize event handlers to prevent unnecessary re-renders of DndContext.

### 6. Hierarchy Level Visualization

**✅ Good:**
```typescript
const getListItemIndent = (level: number): number => {
  return BASE_INDENT + (level * INDENT_PER_LEVEL);
};

<div style={{ paddingLeft: getListItemIndent(item.itemHierarchyLevel) }}>
  {/* item content */}
</div>
```

**❌ Bad:**
```typescript
<div style={{ paddingLeft: item.itemHierarchyLevel * 20 }}>
  {/* item content - magic number */}
</div>
```

**Why:** Use constants for indentation values. Makes it easy to adjust spacing consistently.

### 7. Folder Behavior

**✅ Good:**
```typescript
handleDnDStart = (item) => {
  Store.leftpaneDnDStore.setDraggedItem(item);
  
  // Collapse folder being dragged
  if (this.isFolderListItem(item)) {
    this.collapseFolderAction(item.id);
  }
};

handleDnDOver = (draggedItem, overItem) => {
  // Expand folder being hovered
  if (this.isFolderListItem(overItem)) {
    this.expandFolderAction(overItem.id);
  }
};
```

**Why:** This creates intuitive folder interaction:
- Collapsed folder when dragging it (so children don't interfere)
- Expand folder when hovering to show drop zone

### 8. Error Boundaries

**✅ Good:**
```typescript
const WorkspaceListItemWithErrorBoundary = (props) => (
  <ErrorBoundary fallback={<ErrorListItem />}>
    <WorkspaceListItem {...props} />
  </ErrorBoundary>
);
```

**Why:** Drag operations can trigger complex state changes. Error boundaries prevent full app crashes.

### 9. Analytics Tracking

**✅ Good:**
```typescript
dragEndAction = (draggedItem, newPosition) => {
  // Track successful drops
  trackEvent(DROP_LEFTPANE_ITEM, {
    placement: BIG_BRAIN_PLACEMENTS.LEFTPANE,
    direct_object_id: draggedItem.id,
    direct_object: draggedItem.itemType,
    info1: currFolderId,
    info2: newPosition.newFolderId,
    info3: draggedItem.itemHierarchyLevel,
  });
  
  // Execute action
  this.updatePosition(draggedItem, newPosition);
};
```

**Why:** Track user interactions for product analytics and debugging.

### 10. Virtualization Considerations

**✅ Good:**
```typescript
<VirtualizedListV2
  overscanCount={5}  // Render extra items above/below viewport
  itemsList={sortedItems}
  draggableItemRenderer={itemRenderer}
/>
```

**Why:** Overscan ensures smooth scrolling during drag operations. Items being dragged to should already be rendered.

---

## Advanced Topics

### Custom Collision Detection

You can implement custom collision detection for specific behaviors:

```typescript
const customCollisionDetection = (args) => {
  // Get default collisions
  const collisions = closestCenter(args);
  
  // Filter out items that shouldn't be drop targets
  const validCollisions = collisions.filter(collision => {
    const item = collision.data?.item;
    return item && canDropOnItem(item);
  });
  
  return validCollisions;
};

<DndContext collisionDetection={customCollisionDetection}>
  {/* ... */}
</DndContext>
```

### Drag Handles

For items with specific drag handles (not entire item draggable):

```typescript
const DraggableItemWithHandle = ({ item, children }) => {
  const { listeners, setNodeRef, transform, transition } = useSortable({
    id: item.unique_id,
    data: { item },
  });

  return (
    <div ref={setNodeRef} style={{ transform, transition }}>
      <div className="content">
        {children}
      </div>
      <div className="drag-handle" {...listeners}>
        <DragIcon />
      </div>
    </div>
  );
};
```

### Multi-Selection Drag

For dragging multiple items at once:

```typescript
const handleDnDEnd = (draggedItem, overItem, overItemIndex, movement) => {
  const selectedItems = selectionStore.getSelectedItems();
  
  if (selectedItems.includes(draggedItem.id)) {
    // Dragging a selected item - move all selected items
    const newPositions = calculateMultiItemPositions(selectedItems, overItem, overItemIndex);
    selectedItems.forEach((itemId, index) => {
      updateItemPosition(itemId, newPositions[index]);
    });
  } else {
    // Single item drag
    const newPosition = calculatePosition(draggedItem, overItem, overItemIndex);
    updateItemPosition(draggedItem.id, newPosition);
  }
};
```

### Drag Preview Customization

Customize the drag overlay appearance:

```typescript
<DragOverlay style={{ zIndex: 1000 }}>
  {draggedItem && (
    <div className="custom-drag-preview">
      <Badge count={selectedCount} />
      {itemRenderer(draggedItem, draggedItemIndex, true)}
    </div>
  )}
</DragOverlay>
```

---

## Debugging Tips

### 1. Log DnD Events

```typescript
const onDragStartWrapper = useCallback((event) => {
  console.log('Drag Start:', {
    item: event.active.data.current?.item,
    index: event.active.data.current?.index,
  });
  dndService.handleDnDStart(event.active.data.current?.item);
}, [dndService]);
```

### 2. Visualize Hierarchy Levels

```typescript
<div 
  style={{ 
    paddingLeft: getIndent(item.itemHierarchyLevel),
    borderLeft: `${item.itemHierarchyLevel * 2}px solid hsl(${item.itemHierarchyLevel * 60}, 70%, 50%)`,
  }}
>
  <span style={{ fontSize: '10px', opacity: 0.5 }}>
    L{item.itemHierarchyLevel}
  </span>
  {item.name}
</div>
```

### 3. Position Validation

```typescript
const validatePosition = (position: number) => {
  if (position < 0) {
    console.error('Negative position detected:', position);
  }
  if (position === 0) {
    console.warn('Zero position detected');
  }
  if (String(position).replace(/[^0-9]/g, '').length > 16) {
    console.error('Position exceeds max digits:', position);
  }
};
```

### 4. Track Horizontal Movements

```typescript
const onDragMoveWrapper = useCallback((event) => {
  const { horizontalMovement } = getVerticalAndHorizontalData(event, draggedItemIndex);
  
  if (horizontalMovement) {
    console.log('Horizontal movement:', {
      direction: horizontalMovement.isMovingRight ? 'right' : 'left',
      jumps: horizontalMovement.horizontalJumps,
      totalMovements: Store.leftpaneDnDStore.horizontalMovements,
    });
  }
  
  dndService.handleDnDMove(/* ... */);
}, [dndService, draggedItemIndex]);
```

---

## Common Pitfalls

### 1. Forgetting to Reset State

**Problem:**
```typescript
handleDnDEnd = () => {
  this.dragEndAction(/* ... */);
  // Forgot to reset!
};
```

**Solution:**
```typescript
handleDnDEnd = () => {
  this.dragEndAction(/* ... */);
  Store.leftpaneDnDStore.resetHorizontalMovements();
  Store.leftpaneDnDStore.removeDraggedItem();
};
```

### 2. Not Handling Permissions

**Problem:**
```typescript
<LeftpaneVirtualizedList
  dndService={dndService}
  // Missing permission props
/>
```

**Solution:**
```typescript
<LeftpaneVirtualizedList
  dndService={dndService}
  disableDnD={!hasPermission}
  permissionToDrag={hasPermission}
  cancelDrop={(event) => {
    if (!hasPermission) {
      showPermissionError();
      return true;
    }
    return false;
  }}
/>
```

### 3. Mutating Item Data

**Problem:**
```typescript
dragEndAction = (draggedItem, newPosition) => {
  draggedItem.position = newPosition.newPosition;  // Mutation!
  draggedItem.itemHierarchyLevel = newPosition.newLevel;
};
```

**Solution:**
```typescript
dragEndAction = (draggedItem, newPosition) => {
  // Create new item or update through state management
  updateItem(draggedItem.id, {
    position: newPosition.newPosition,
    itemHierarchyLevel: newPosition.newLevel,
  });
};
```

### 4. Not Memoizing DnD Service

**Problem:**
```typescript
// Service recreated every render
const dndService = new WorkspaceListDndService(items, workspaceId);
```

**Solution:**
```typescript
const dndService = useMemo(
  () => new WorkspaceListDndService(items, workspaceId),
  [items, workspaceId]
);
```

### 5. Missing unique_id

**Problem:**
```typescript
const items = boards.map(board => ({
  id: board.id,
  name: board.name,
  // Missing unique_id!
}));
```

**Solution:**
```typescript
const items = boards.map(board => ({
  id: board.id,
  name: board.name,
  unique_id: `board_${board.id}`,
  dndId: `board_${board.id}`,
}));
```

---

## Testing Considerations

### Unit Testing DnD Service

```typescript
describe('WorkspaceListDndService', () => {
  let service: WorkspaceListDndService;
  let mockItems: LeftpaneDraggableListItem[];

  beforeEach(() => {
    mockItems = [
      { id: '1', unique_id: 'board_1', itemHierarchyLevel: 0, position: 100, /* ... */ },
      { id: '2', unique_id: 'board_2', itemHierarchyLevel: 0, position: 200, /* ... */ },
    ];
    service = new WorkspaceListDndService(mockItems, 123);
  });

  it('should calculate correct position when dropping between items', () => {
    const draggedItem = mockItems[0];
    const overItem = mockItems[1];
    const result = service['calcNewLeftpanePosition'](
      draggedItem,
      overItem,
      1,
      { isMovingUp: false },
      undefined,
      true
    );

    expect(result.newPosition).toBe(150);  // (100 + 200) / 2
  });

  it('should increment hierarchy level when moving right', () => {
    const draggedItem = mockItems[0];
    const overItem = mockItems[1];
    
    service.handleDnDMove(
      draggedItem,
      overItem,
      1,
      undefined,
      { isMovingRight: true, horizontalJumps: 1 }
    );

    expect(Store.leftpaneDnDStore.draggedItem?.itemHierarchyLevel).toBe(1);
  });
});
```

### Integration Testing

```typescript
describe('Drag and Drop Integration', () => {
  it('should reorder items when dragged', async () => {
    const { getByTestId } = render(<WorkspaceListContent />);
    
    const item1 = getByTestId('board-1');
    const item2 = getByTestId('board-2');

    // Simulate drag
    fireEvent.dragStart(item1);
    fireEvent.dragOver(item2);
    fireEvent.drop(item2);

    // Assert API was called
    await waitFor(() => {
      expect(mockApi.updatePosition).toHaveBeenCalledWith({
        itemId: '1',
        position: expect.any(Number),
      });
    });
  });
});
```

---

## Performance Optimization

### 1. Virtualization

Use virtualized lists for large datasets:

```typescript
<VirtualizedListV2
  overscanCount={5}
  itemsList={items}
  draggableItemRenderer={itemRenderer}
/>
```

### 2. Memoization

Memoize expensive calculations:

```typescript
const sortedItems = useMemo(() => {
  return getSortedItems(rawItems, sortMode, filters);
}, [rawItems, sortMode, filters]);

const dndService = useMemo(() => {
  return new WorkspaceListDndService(sortedItems, workspaceId);
}, [sortedItems, workspaceId]);
```

### 3. Debounce Hover Actions

Prevent excessive folder expand/collapse:

```typescript
const debouncedExpandFolder = useMemo(
  () => debounce((folderId) => expandFolder(folderId), 300),
  []
);

expandFolderAction(folderId: string): void {
  this.debouncedExpandFolder(folderId);
}
```

### 4. Batch Updates

Batch multiple position updates:

```typescript
dragEndAction = async (items: LeftpaneDraggableListItem[], newPositions: LeftpanePosition[]) => {
  // Update all local state at once
  batchUpdate(() => {
    items.forEach((item, index) => {
      updateItemPosition(item.id, newPositions[index]);
    });
  });

  // Single API call for multiple updates
  await api.batchUpdatePositions(
    items.map((item, index) => ({
      itemId: item.id,
      position: newPositions[index],
    }))
  );
};
```

---

## Conclusion

This guide covers the complete drag and drop implementation in the monday.com leftpane. Key takeaways:

1. **@dnd-kit** provides the foundation for drag and drop
2. **Service-based architecture** separates DnD logic from UI
3. **Position calculation** uses dynamic positions for robust reordering
4. **Horizontal movement** enables folder hierarchy changes
5. **State management** through MobX store for global DnD state
6. **Event flow** from drag start through position calculation to backend update

To implement similar functionality:
- Extend `DnDService` for your specific list type
- Implement required abstract methods
- Wrap list in `LeftpaneVirtualizedList` or create similar component
- Use `useSortable` hook in draggable items
- Calculate positions using relative (dynamic) positioning
- Handle permissions and edge cases

This architecture scales from simple reorderable lists to complex nested hierarchies with folder support.


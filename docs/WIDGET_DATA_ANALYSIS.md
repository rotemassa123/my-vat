# Widget Data Analysis

This document analyzes whether the current database schema and widget model contain all necessary data to support all graphs listed in `POSSIBLE_GRAPHS.md`.

---

## Current Widget Schema

**Location**: `backend/src/Common/Infrastructure/DB/schemas/widget.schema.ts`

```typescript
export interface WidgetDataConfig {
  source: 'invoices' | 'summaries' | 'entities' | 'custom';
  xAxisField?: string;
  yAxisField?: string;
  filters?: {
    dateRange?: { start: Date; end: Date };
    entityIds?: string[];
    [key: string]: any];
  };
}

export interface WidgetDisplayConfig {
  title: string;
  showLabels?: boolean;
  showLegend?: boolean;
  showGridLines?: boolean;
  colors?: string[];
  axisLabels?: { x?: string; y?: string };
}
```

---

## Missing from Widget Schema

### 1. **Subtitle Field** ❌
**Required for**: Number (Metric) widgets and potentially other widget types

**Current State**: `WidgetDisplayConfig` only has `title`, no `subtitle`

**Recommendation**: Add `subtitle?: string;` to `WidgetDisplayConfig`

```typescript
export interface WidgetDisplayConfig {
  title: string;
  subtitle?: string;  // ← ADD THIS
  showLabels?: boolean;
  // ... rest
}
```

### 2. **Aggregation Type** ❌
**Required for**: All metric widgets and many chart widgets that need to aggregate data

**Current State**: No way to specify how to aggregate data (count, sum, average, min, max, percentage)

**Recommendation**: Add `aggregation` field to `WidgetDataConfig`

```typescript
export interface WidgetDataConfig {
  source: 'invoices' | 'summaries' | 'entities' | 'custom';
  xAxisField?: string;
  yAxisField?: string;
  aggregation?: 'count' | 'sum' | 'average' | 'min' | 'max' | 'percentage';  // ← ADD THIS
  filters?: {
    dateRange?: { start: Date; end: Date };
    entityIds?: string[];
    [key: string]: any];
  };
}
```

### 3. **Time Grouping** ❌
**Required for**: Line charts and time-based bar charts (daily, weekly, monthly, quarterly, yearly)

**Current State**: No way to specify time grouping granularity

**Recommendation**: Add `timeGrouping` field to `WidgetDataConfig`

```typescript
export interface WidgetDataConfig {
  source: 'invoices' | 'summaries' | 'entities' | 'custom';
  xAxisField?: string;
  yAxisField?: string;
  aggregation?: 'count' | 'sum' | 'average' | 'min' | 'max' | 'percentage';
  timeGrouping?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';  // ← ADD THIS
  filters?: {
    dateRange?: { start: Date; end: Date };
    entityIds?: string[];
    [key: string]: any];
  };
}
```

### 4. **Amount Range Configuration** ❌
**Required for**: Graphs showing "invoices by amount range" (0-100, 100-500, 500-1000, 1000+)

**Current State**: No way to configure range buckets

**Recommendation**: Add `ranges` field to `WidgetDataConfig` filters

```typescript
filters?: {
  dateRange?: { start: Date; end: Date };
  entityIds?: string[];
  ranges?: { field: string; buckets: number[] };  // ← ADD THIS (e.g., { field: 'total_amount', buckets: [0, 100, 500, 1000, Infinity] })
  [key: string]: any];
};
```

---

## Missing from Summary Schema

**Location**: `backend/src/Common/Infrastructure/DB/schemas/summary.schema.ts`

### 1. **Classification Field** ❌
**Required for**: All graphs showing T&E vs AP breakdown

**Current State**: `SummaryContent` interface doesn't have `classification` field

**Recommendation**: Add to `SummaryContent` interface

```typescript
export interface SummaryContent {
  country: string;
  supplier: string;
  date: string;
  id: string;
  description: string;
  net_amount: string;
  vat_amount: string;
  vat_rate: string;
  currency: string;
  classification?: 'T&E' | 'AP';  // ← ADD THIS
  category?: string;  // ← ADD THIS (travel, meals, office supplies, software, hardware, other)
  total_amount?: string;  // ← ADD THIS (currently only in Summary class, not in SummaryContent)
  detailed_items?: Array<{  // ← ADD THIS
    description: string;
    amount: number;
    vat_rate: number;
  }>;
}
```

### 2. **Category Field** ❌
**Required for**: All graphs showing category breakdown (travel, meals, office supplies, software, hardware, other)

**Current State**: Not present in schema

**Recommendation**: Add `category` field (see above)

### 3. **Total Amount in SummaryContent** ⚠️
**Required for**: Graphs using `total_amount` from summary content

**Current State**: `total_amount` exists as a separate field on `Summary` class but not in `SummaryContent` interface

**Recommendation**: Add to `SummaryContent` interface (see above)

### 4. **Detailed Items Array** ❌
**Required for**: Graphs analyzing line items within invoices

**Current State**: Not present in schema

**Recommendation**: Add `detailed_items` array (see above)

---

## Available Data Fields Analysis

### ✅ Available in Invoice Model
- `status` - InvoiceStatus enum (processing, failed, not_claimable, claimable, awaiting_claim_result, claim_accepted, claim_rejected)
- `source` - IntegrationSource enum (google_drive, dropbox, onedrive)
- `claimable_amount` - Assessed claimable VAT amount
- `claim_submitted_at` - When claim was submitted
- `claim_result_received_at` - When claim result was received
- `created_at` - Invoice creation timestamp
- `updated_at` - Invoice update timestamp
- `entity_id` - Link to Entity
- `account_id` - Link to Account
- `name` - File name
- `size` - File size in bytes

### ✅ Available in Summary Model (flattened)
- `country` - From summary_content
- `supplier` - From summary_content
- `invoice_date` - From summary_content.date
- `invoice_number` - From summary_content.id
- `description` - From summary_content
- `net_amount` - From summary_content
- `vat_amount` - From summary_content (string) and as number field
- `vat_rate` - From summary_content
- `currency` - From summary_content
- `total_amount` - As number field (but not in SummaryContent interface)
- `vendor_name` - Computed field
- `is_invoice` - Boolean flag
- `processing_time_seconds` - Processing metadata
- `success` - Processing success flag
- `confidence_score` - AI confidence score

### ❌ Missing from Summary Model
- `classification` - T&E vs AP (not in schema)
- `category` - travel, meals, office supplies, software, hardware, other (not in schema)
- `detailed_items` - Array of line items (not in schema)

### ✅ Available in Entity Model
- `entity_name` - Entity name
- `entity_type` - individual or business
- `status` - active/inactive
- `account_id` - Link to Account

### ✅ Available in Account Model
- `account_type` - individual or business
- `company_name` - Company name
- `status` - active/inactive

---

## Summary of Required Changes

### Widget Schema Changes

1. **Add `subtitle` to `WidgetDisplayConfig`**
   ```typescript
   subtitle?: string;
   ```

2. **Add `aggregation` to `WidgetDataConfig`**
   ```typescript
   aggregation?: 'count' | 'sum' | 'average' | 'min' | 'max' | 'percentage';
   ```

3. **Add `timeGrouping` to `WidgetDataConfig`**
   ```typescript
   timeGrouping?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
   ```

4. **Add `ranges` to filters**
   ```typescript
   ranges?: { field: string; buckets: number[] };
   ```

### Summary Schema Changes

1. **Update `SummaryContent` interface to include:**
   - `classification?: 'T&E' | 'AP'`
   - `category?: string` (travel, meals, office supplies, software, hardware, other)
   - `total_amount?: string`
   - `detailed_items?: Array<{ description: string; amount: number; vat_rate: number; }>`

2. **Ensure `total_amount` is properly stored** (currently exists as number field but should also be in SummaryContent)

---

## Graphs That Will Work Without Changes

✅ **Status-based graphs** - All invoice status graphs work (status field available)
✅ **Geographic graphs** - Country-based graphs work (country field available)
✅ **Entity graphs** - Entity-based graphs work (entity_id available)
✅ **Time-based graphs** - Basic time graphs work (created_at, invoice_date available)
✅ **VAT rate graphs** - VAT rate graphs work (vat_rate field available)
✅ **Currency graphs** - Currency graphs work (currency field available)
✅ **Supplier graphs** - Supplier graphs work (supplier field available)

## Graphs That Won't Work Without Changes

❌ **Classification graphs** - T&E vs AP graphs (classification field missing)
❌ **Category graphs** - Category breakdown graphs (category field missing)
❌ **Detailed items graphs** - Line items analysis (detailed_items array missing)
❌ **Metric widgets with subtitles** - No subtitle support in display config
❌ **Advanced aggregations** - No aggregation type specified in data config
❌ **Time-grouped charts** - No time grouping granularity specified
❌ **Amount range graphs** - No range bucket configuration

---

## Recommended Implementation Order

1. **Phase 1: Widget Schema Updates** (High Priority)
   - Add `subtitle` to `WidgetDisplayConfig`
   - Add `aggregation` to `WidgetDataConfig`
   - Add `timeGrouping` to `WidgetDataConfig`
   - Add `ranges` to filters

2. **Phase 2: Summary Schema Updates** (High Priority)
   - Add `classification` to `SummaryContent`
   - Add `category` to `SummaryContent`
   - Add `total_amount` to `SummaryContent` (ensure consistency)
   - Add `detailed_items` array to `SummaryContent`

3. **Phase 3: Data Migration** (If needed)
   - Backfill `classification` and `category` for existing summaries
   - Extract `detailed_items` from existing invoice data if available

4. **Phase 4: Backend Service Updates**
   - Update widget data service to handle new aggregation types
   - Update widget data service to handle time grouping
   - Update widget data service to handle range bucketing
   - Update widget data service to query detailed_items

---

## Notes

- The `total_amount` field exists as a number on the `Summary` class but should also be in `SummaryContent` for consistency
- The `detailed_items` array structure should match the format described: `{ description: string; amount: number; vat_rate: number; }`
- Consider adding validation for `category` values to ensure they match expected values (travel, meals, office supplies, software, hardware, other)
- Consider adding validation for `classification` to ensure it's either 'T&E' or 'AP'


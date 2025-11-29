# Possible Graphs for Analysis Feature

This document lists all possible graphs that can be created using the 5 available graph types:
- **Pie Chart** - Distribution/percentage breakdowns
- **Bar Chart** - Categorical comparisons
- **Line Chart** - Trends over time
- **Number (Metric)** - Single aggregated values
- **Battery** - State transitions and evolution (shows how invoices move through different stages over time)

---

## Pie Charts

### By Invoice Status
- **Pie chart of invoices by status** (processing, failed, not_claimable, claimable, awaiting_claim_result, claim_accepted, claim_rejected)
- **Pie chart of claimable vs non-claimable invoices**
- **Pie chart of accepted vs rejected claims**

### By Geographic Data
- **Pie chart of invoices by country**
- **Pie chart of VAT amounts by country**
- **Pie chart of invoice count by country**

### By Entity
- **Pie chart of invoices by entity**
- **Pie chart of total amount by entity**
- **Pie chart of VAT amount by entity**

### By Amount Ranges
- **Pie chart of invoices by amount range** (0-100, 100-500, 500-1000, 1000+)
- **Pie chart of invoices by VAT amount range**

### By Classification
- **Pie chart of invoices by classification** (T&E vs AP)
- **Pie chart of total amount by classification** (T&E vs AP)
- **Pie chart of VAT amount by classification** (T&E vs AP)
- **Pie chart of invoice count by classification**

### By Category
- **Pie chart of invoices by category** (travel, meals, office supplies, software, hardware, other)
- **Pie chart of total amount by category**
- **Pie chart of VAT amount by category**
- **Pie chart of invoice count by category**
- **Pie chart of T&E invoices by category** (travel, meals, other)
- **Pie chart of AP invoices by category** (office supplies, software, hardware, other)

---

## Bar Charts

### Time-Based Comparisons
- **Bar chart of invoice count by month**
- **Bar chart of total amount by month**
- **Bar chart of VAT amount by month**
- **Bar chart of invoice count by quarter**
- **Bar chart of invoice count by year**

### Geographic Analysis
- **Bar chart of invoice count by country**
- **Bar chart of total amount by country**
- **Bar chart of VAT amount by country**
- **Bar chart of average invoice amount by country**

### VAT Rate Analysis
- **Bar chart of invoice count by VAT rate**
- **Bar chart of total amount by VAT rate**
- **Bar chart of VAT amount by VAT rate**

### Entity Analysis
- **Bar chart of invoice count by entity**
- **Bar chart of total amount by entity**
- **Bar chart of VAT amount by entity**
- **Bar chart of average invoice amount by entity**

### Processing Metrics
- **Bar chart of processing time by country**

### Amount Ranges
- **Bar chart of invoice count by amount range**
- **Bar chart of invoice count by VAT amount range**

### Classification Analysis
- **Bar chart of invoice count by classification** (T&E vs AP)
- **Bar chart of total amount by classification** (T&E vs AP)
- **Bar chart of VAT amount by classification** (T&E vs AP)
- **Bar chart of average invoice amount by classification**
- **Bar chart of claimable amount by classification**

### Category Analysis
- **Bar chart of invoice count by category** (travel, meals, office supplies, software, hardware, other)
- **Bar chart of total amount by category**
- **Bar chart of VAT amount by category**
- **Bar chart of average invoice amount by category**
- **Bar chart of claimable amount by category**
- **Bar chart of T&E invoices by category** (travel, meals, other)
- **Bar chart of AP invoices by category** (office supplies, software, hardware, other)
- **Bar chart comparing T&E vs AP by category**

### Detailed Items Analysis
- **Bar chart of top line items by amount** (from detailed_items array)
- **Bar chart of line items by VAT rate** (from detailed_items)
- **Bar chart of line items count by description category**
- **Bar chart of average line item amount by category**
- **Bar chart of line items count by invoice**
- **Bar chart of line items amount by invoice**
- **Bar chart of line items by classification** (T&E vs AP line items)
- **Bar chart of line items by category**

---

## Line Charts

### Revenue Trends
- **Line chart of total returns over time** (daily, weekly, monthly)
- **Line chart of total VAT amount over time**
- **Line chart of total invoice amount over time**
- **Line chart of net amount over time**
- **Line chart of claimable amount over time**

### Invoice Volume Trends
- **Line chart of invoice count over time** (daily, weekly, monthly)
- **Line chart of invoice count by day**
- **Line chart of invoice count by week**
- **Line chart of invoice count by month**
- **Line chart of invoice count by quarter**

### Status Trends
- **Line chart of claimable invoices over time**
- **Line chart of pending claims over time**
- **Line chart of processing invoices over time**

### Entity Trends
- **Line chart of total amount by entity over time**
- **Line chart of invoice count by entity over time**

### Classification Trends
- **Line chart of T&E vs AP invoices over time**
- **Line chart of total amount by classification over time** (T&E vs AP)
- **Line chart of VAT amount by classification over time** (T&E vs AP)
- **Line chart of invoice count by classification over time** (T&E vs AP)

### Line Items Trends
- **Line chart of top line items over time** (from detailed_items)
- **Line chart of line items count over time**
- **Line chart of average line item amount over time**

---

## Number (Metric) Widgets

### Totals
- **Total number of invoices**
- **Total invoice amount** (total_amount from summary_content)
- **Total VAT amount**
- **Total claimable amount**
- **Total refunded amount**
- **Total pending amount**
- **Total rejected amount**
- **Total net amount**
- **Total T&E amount**
- **Total AP amount**
- **Total amount by category** (travel, meals, office supplies, software, hardware, other)
- **Total line items count** (sum of all detailed_items across invoices)

### Averages
- **Average price for an invoice**
- **Average VAT amount per invoice**
- **Average claimable amount per invoice**
- **Average invoice amount**
- **Average processing time**
- **Average confidence score**

### Counts
- **Number of claimable invoices**
- **Number of non-claimable invoices**
- **Number of accepted claims**
- **Number of rejected claims**
- **Number of pending claims**
- **Number of processing invoices**
- **Number of failed invoices**
- **Number of invoices by status**
- **Number of invoices by source**
- **Number of invoices by country**
- **Number of invoices by supplier**
- **Number of invoices by entity**
- **Number of invoices by currency**
- **Number of T&E invoices**
- **Number of AP invoices**
- **Number of invoices by category** (travel, meals, office supplies, software, hardware, other)
- **Number of line items** (total count from detailed_items)

### Percentages
- **Percentage of claimable invoices**
- **Percentage of accepted claims**
- **Percentage of rejected claims**
- **Percentage of successful processing**
- **Percentage of invoices by status**
- **Percentage of invoices by source**
- **Percentage of invoices by country**
- **Percentage of T&E vs AP invoices**
- **Percentage of invoices by category**
- **Percentage of amount by classification** (T&E vs AP)
- **Percentage of amount by category**

### Processing Metrics
- **Total processing time**
- **Average processing time**

### Time-Based Metrics
- **Invoices this month**
- **Invoices this week**
- **Invoices this year**
- **Invoices today**
- **Total amount this month**
- **Total amount this week**
- **Total amount this year**
- **Total VAT this month**
- **Total VAT this week**
- **Total VAT this year**
- **T&E invoices this month**
- **AP invoices this month**
- **T&E amount this month**
- **AP amount this month**
- **Invoices by category this month**

---

## Battery Widgets

### Invoice Processing Pipeline
- **Battery showing invoice processing pipeline** (discovered → processing → summarized → claimability checked → claimable/not_claimable)
- **Battery showing processing stage breakdown** (discovered, processing, failed, completed)

### Claim Lifecycle
- **Battery showing claim lifecycle** (claimable → submitted → awaiting_result → accepted/rejected)
- **Battery showing claim status evolution** (not_claimable → claimable → submitted → accepted/rejected)
- **Battery showing claim progression** (pending submission → submitted → accepted/rejected)

### Status Transitions
- **Battery showing status transitions** (processing → claimable → submitted → accepted)
- **Battery showing failed invoice recovery** (failed → reprocessing → claimable)
- **Battery showing claim rejection recovery** (rejected → review → resubmitted)

### Processing Progress
- **Battery showing processing progress** (discovered → processing → completed)
- **Battery showing claim submission progress** (claimable → submitted → awaiting_result)
- **Battery showing refund progress** (accepted → refunded)

### Time-Based Evolution
- **Battery showing monthly status evolution** (how invoices move through states each month)
- **Battery showing quarterly claim progression** (claimable → submitted → accepted by quarter)

---

## Combined/Advanced Graphs

### Multi-Series Line Charts
- **Line chart comparing total amount vs VAT amount over time**
- **Line chart comparing claimable vs non-claimable over time**
- **Line chart comparing accepted vs rejected claims over time**
- **Line chart comparing multiple suppliers over time**
- **Line chart comparing multiple entities over time**
- **Line chart comparing multiple currencies over time**
- **Line chart comparing T&E vs AP over time**
- **Line chart comparing categories over time** (travel, meals, office supplies, software, hardware, other)
- **Line chart comparing T&E categories over time** (travel, meals, other)
- **Line chart comparing AP categories over time** (office supplies, software, hardware, other)

### Stacked Bar Charts
- **Stacked bar chart of invoice count by status over time**
- **Stacked bar chart of total amount by status over time**
- **Stacked bar chart of invoices by source over time**
- **Stacked bar chart of invoices by country over time**
- **Stacked bar chart of invoices by entity over time**
- **Stacked bar chart of invoices by classification over time** (T&E vs AP)
- **Stacked bar chart of invoices by category over time**
- **Stacked bar chart of total amount by classification over time** (T&E vs AP)
- **Stacked bar chart of total amount by category over time**

### Grouped Bar Charts
- **Grouped bar chart comparing invoice count by supplier and status**
- **Grouped bar chart comparing total amount by country and currency**
- **Grouped bar chart comparing VAT amount by entity and status**
- **Grouped bar chart comparing invoice count by classification and status** (T&E/AP vs status)
- **Grouped bar chart comparing total amount by classification and country**
- **Grouped bar chart comparing invoice count by category and classification** (T&E/AP breakdown)
- **Grouped bar chart comparing VAT amount by category and country**

---

## Notes

- All graphs can be filtered by:
  - Date range (start date, end date)
  - Entity IDs
  - Status
  - Source
  - Country
  - Currency
  - Amount ranges
  - Supplier/vendor
  - Classification (T&E, AP)
  - Category (travel, meals, office supplies, software, hardware, other)
  - Invoice date range

- Aggregations available:
  - Count
  - Sum
  - Average
  - Minimum
  - Maximum
  - Percentage

- Time groupings available:
  - Daily
  - Weekly
  - Monthly
  - Quarterly
  - Yearly

- All monetary values can be displayed in:
  - Original currency
  - Converted to account default currency
  - Multiple currencies side-by-side


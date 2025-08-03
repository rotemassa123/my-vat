# Backend Endpoint Requirements

## Updated Reporting API Endpoint

The frontend now expects the existing reporting endpoint to optionally include embedded summary data within each invoice.

### Location
Update the existing endpoint: `GET /api/v1/reporting` (or wherever your reporting endpoint currently lives)

### New Query Parameter
Add support for `include_summary: boolean` parameter:

```typescript
interface ReportingQueryParams {
  limit: number;
  skip: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  include_summary?: boolean;  // NEW - when true, embed summary_content in each invoice
  // ... existing filter parameters
}
```

### Response Format
When `include_summary=true`, each invoice should include a `summary_content` field:

```json
{
  "data": [
    {
      "_id": "invoice123",
      "name": "Invoice.pdf",
      "status": "completed",
      "currency": "EUR",
      "total_amount": 548.00,
      "vat_amount": "109.80",
      // ... existing invoice fields ...
      
      "summary_content": {
        "country": "Denmark",
        "supplier": "BabySam Herlev", 
        "date": "2025-07-09",
        "id": "0000000291000116312",
        "description": "Sovepose Hasselnød",
        "net_amount": "439.20",
        "vat_amount": "109.80", 
        "vat_rate": "25",
        "currency": "Krone"
      }
    }
  ],
  "metadata": {
    "total": 1500,
    "limit": 1000,
    "skip": 0
  }
}
```

### Implementation Details

1. **Database Query**: When `include_summary=true`, join/lookup the summary collection data for each invoice
2. **Performance**: Consider adding an index on the relationship field between invoices and summaries
3. **Backwards Compatibility**: When `include_summary` is not provided or false, return invoices without the `summary_content` field (existing behavior)
4. **Limit Validation**: Update the `limit` parameter validation to allow up to 2000 records per request (currently capped at 500)

### Benefits
- **Simplified Frontend**: No more separate API calls for summaries
- **Better Performance**: Single request instead of N+1 queries  
- **Reduced Complexity**: No need for separate summary endpoints
- **Atomic Data**: Invoice and its summary always in sync

### Migration Path
1. Add the `include_summary` parameter support to your existing endpoint
2. The frontend will automatically start using this parameter
3. You can deprecate any separate summary endpoints once this is working 
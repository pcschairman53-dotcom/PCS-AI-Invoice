# MongoDB Atlas Database Architecture Specification

## Enterprise AI Invoice & GST Management System

### 1. Overview & Architecture Strategy
This document specifies the production-ready MongoDB Atlas architecture for the Enterprise AI Invoice & GST Management System. It is designed to handle high-throughput invoice extraction, automated Indian GST compliance auditing, fast compound search queries, and complete audit trail logging for over **1,000,000+ invoices**.

---

### 2. Collection Schemas

#### 2.1 `invoice_documents`
Primary collection storing extracted structured JSON data from Gemini AI, validation flags, financial totals, and lifecycle statuses.

```json
{
  "_id": "INV-8A2F90B1C3D4",
  "invoice_id": "INV-8A2F90B1C3D4",
  "document_type": "GST Tax Invoice",
  "invoice": {
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-03-15",
    "due_date": "2024-04-15",
    "place_of_supply": "27-Maharashtra",
    "po_number": "PO-99210",
    "irn": "4b5d23e0...1a8e",
    "qr_code_data": "https://einv.gst.gov.in/...",
    "reverse_charge": false
  },
  "seller": {
    "name": "Reliance Digital Retail Ltd",
    "trade_name": "Reliance Digital",
    "address": "Bandra Kurla Complex, Mumbai, Maharashtra - 400051",
    "gstin": "27AAACR1234A1Z5",
    "pan": "AAACR1234A",
    "state": "Maharashtra",
    "state_code": "27",
    "phone": "+91 9820012345",
    "email": "tax@reliancedigital.in"
  },
  "buyer": {
    "name": "Infosys Limited",
    "trade_name": "Infosys",
    "address": "Electronics City, Hosur Road, Bengaluru, Karnataka - 560100",
    "gstin": "29AAACI1681G1ZD",
    "pan": "AAACI1681G",
    "state": "Karnataka",
    "state_code": "29",
    "phone": "+91 8028520261",
    "email": "accounts@infosys.com",
    "shipping_address": "Electronics City Phase 1, Bengaluru"
  },
  "summary": {
    "total_taxable_value": 150000.00,
    "cgst_total": 0.00,
    "sgst_total": 0.00,
    "igst_total": 27000.00,
    "cess_total": 0.00,
    "total_tax": 27000.00,
    "discount_total": 5000.00,
    "freight_charges": 1200.00,
    "round_off": 0.00,
    "grand_total": 173200.00,
    "amount_in_words": "One Lakh Seventy Three Thousand Two Hundred Rupees Only"
  },
  "validation": {
    "is_gstin_seller_valid": true,
    "is_gstin_buyer_valid": true,
    "is_pan_seller_valid": true,
    "is_pan_buyer_valid": true,
    "is_tax_calculation_valid": true,
    "is_grand_total_valid": true,
    "is_gst_breakup_valid": true,
    "is_duplicate_invoice": false,
    "missing_mandatory_fields": []
  },
  "warnings": [],
  "overall_confidence": 0.98,
  "ai_model": "gemini-3.6-flash",
  "status": "VERIFIED",
  "is_deleted": false,
  "created_at": "2026-07-26T00:15:00Z",
  "updated_at": "2026-07-26T00:15:00Z"
}
```

#### 2.2 `invoice_items`
Collection for granular item-level breakdown referencing parent invoices.

```json
{
  "_id": ObjectId("66a34b2f1234567890abcdef"),
  "invoice_id": "INV-8A2F90B1C3D4",
  "sl_no": 1,
  "item_name": "Enterprise Server Rack Workstation",
  "description": "Dell PowerEdge R750 Server",
  "hsn": "84713010",
  "quantity": 2.0,
  "rate": 75000.00,
  "discount": 0.00,
  "taxable_value": 150000.00,
  "cgst": 0.00,
  "sgst": 0.00,
  "igst": 27000.00,
  "cess": 0.00,
  "line_total": 177000.00,
  "confidence": 0.99
}
```

#### 2.3 `vendors`
Collection tracking vendor/supplier directories aggregated from processed invoices.

```json
{
  "_id": ObjectId("66a34b2f1234567890aaaaaa"),
  "vendor_code": "VEN-27AAACR1234A1Z5",
  "vendor_name": "Reliance Digital Retail Ltd",
  "gstin": "27AAACR1234A1Z5",
  "pan": "AAACR1234A",
  "address": "Bandra Kurla Complex, Mumbai, Maharashtra - 400051",
  "phone": "+91 9820012345",
  "email": "tax@reliancedigital.in",
  "invoice_count": 42,
  "total_purchase": 6420000.00,
  "created_at": "2026-07-01T10:00:00Z",
  "updated_at": "2026-07-26T00:15:00Z"
}
```

#### 2.4 `customers`
Collection tracking customer/recipient directories aggregated from processed invoices.

```json
{
  "_id": ObjectId("66a34b2f1234567890bbbbbb"),
  "customer_code": "CUST-29AAACI1681G1ZD",
  "customer_name": "Infosys Limited",
  "gstin": "29AAACI1681G1ZD",
  "pan": "AAACI1681G",
  "address": "Electronics City, Bengaluru",
  "phone": "+91 8028520261",
  "email": "accounts@infosys.com",
  "invoice_count": 18,
  "total_sales": 3120000.00,
  "created_at": "2026-07-05T12:00:00Z",
  "updated_at": "2026-07-26T00:15:00Z"
}
```

#### 2.5 `gst_validation_logs`
Logs detailed tax audit validation results per invoice execution.

```json
{
  "_id": ObjectId("66a34b2f1234567890cccccc"),
  "invoice_id": "INV-8A2F90B1C3D4",
  "validation_result": {
    "is_gstin_seller_valid": true,
    "is_gstin_buyer_valid": true,
    "is_tax_calculation_valid": true
  },
  "timestamp": "2026-07-26T00:15:00Z"
}
```

#### 2.6 `duplicate_invoice_logs`
Logs duplicate invoice detection occurrences.

```json
{
  "_id": ObjectId("66a34b2f1234567890dddddd"),
  "invoice_number": "INV-2024-001",
  "duplicate_ids": ["INV-8A2F90B1C3D4", "INV-111111111111"],
  "confidence": 1.0,
  "timestamp": "2026-07-26T00:15:00Z"
}
```

#### 2.7 `audit_logs`
Security and soft-delete audit trail.

```json
{
  "_id": ObjectId("66a34b2f1234567890eeeeee"),
  "action": "CREATE_INVOICE",
  "collection": "invoice_documents",
  "document_id": "INV-8A2F90B1C3D4",
  "performed_by": "SYSTEM_GEMINI_AI",
  "timestamp": "2026-07-26T00:15:00Z"
}
```

#### 2.8 `ai_processing_logs`
Performance telemetry for Gemini model latency, confidence, and token usage.

```json
{
  "_id": ObjectId("66a34b2f1234567890ffffff"),
  "invoice_id": "INV-8A2F90B1C3D4",
  "ai_model": "gemini-3.6-flash",
  "processing_time": 1.42,
  "token_usage": {
    "prompt_tokens": 850,
    "completion_tokens": 420,
    "total_tokens": 1270
  },
  "confidence": 0.98,
  "warnings": [],
  "timestamp": "2026-07-26T00:15:00Z"
}
```

#### 2.9 `invoice_upload_logs`
Upload session records for PDFs/images ingested into the pipeline.

```json
{
  "_id": ObjectId("66a34b2f1234567890111222"),
  "filename": "sample_tax_invoice.pdf",
  "file_size": 245012,
  "file_type": "application/pdf",
  "uploaded_by": "user@enterprise.com",
  "upload_time": "2026-07-26T00:14:58Z",
  "status": "PROCESSED"
}
```

---

### 3. Indexes & Performance Tuning

To support high-speed compound searches and duplicate checks across 1M+ invoices:

```js
// 1. Compound Index for Quick Search & Date Range Sorting
db.invoice_documents.createIndex(
  { "status": 1, "created_at": -1 },
  { name: "idx_status_created", background: true }
);

// 2. Index for Invoice Number lookup
db.invoice_documents.createIndex(
  { "invoice.invoice_number": 1 },
  { name: "idx_invoice_number", background: true }
);

// 3. GSTIN Indexes for Vendor & Customer filtering
db.invoice_documents.createIndex(
  { "seller.gstin": 1 },
  { name: "idx_seller_gstin", background: true }
);
db.invoice_documents.createIndex(
  { "buyer.gstin": 1 },
  { name: "idx_buyer_gstin", background: true }
);

// 4. Duplicate Check Compound Index
db.invoice_documents.createIndex(
  { "invoice.invoice_number": 1, "seller.gstin": 1, "summary.grand_total": 1 },
  { name: "idx_duplicate_check", background: true }
);

// 5. Amount Range Search Index
db.invoice_documents.createIndex(
  { "summary.grand_total": 1 },
  { name: "idx_grand_total", background: true }
);

// 6. Text Index for Full Text Company Search
db.invoice_documents.createIndex(
  {
    "invoice.invoice_number": "text",
    "seller.name": "text",
    "buyer.name": "text"
  },
  { name: "idx_text_search", background: true }
);
```

---

### 4. Duplicate Detection & Scalability Strategy

- **Duplicate Hash Vector**: A composite key composed of `invoice.invoice_number` + `seller.gstin` + `summary.grand_total` provides O(1) indexed duplicate resolution.
- **Sharding Key for 1M+ Records**: On MongoDB Atlas clusters, shard `invoice_documents` using `seller.gstin` (Hashed) or `created_at` (Ranged) for uniform horizontal partition distribution.
- **Soft Deletion**: `is_deleted: true` flag prevents hard purges and preserves complete audit trails for GST tax authority inquiries.

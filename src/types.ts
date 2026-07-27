/**
 * PCS Enterprise Invoice Intelligence AI Types
 * Structured schema definitions for Indian GST Invoices, Tax Validation, and Document Intelligence.
 */

export interface InvoiceMetadata {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  place_of_supply: string | null;
  po_number: string | null;
  irn: string | null;
  qr_code_data: string | null;
  reverse_charge: boolean | null;
}

export interface PartyDetails {
  name: string | null;
  trade_name: string | null;
  address: string | null;
  gstin: string | null;
  pan: string | null;
  state: string | null;
  state_code: string | null;
  phone: string | null;
  email: string | null;
  shipping_address?: string | null;
}

export interface InvoiceItem {
  sl_no: number;
  description: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  cess_rate: number;
  cess_amount: number;
  total_amount: number;
}

export interface InvoiceSummary {
  total_taxable_value: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  cess_total: number;
  total_tax: number;
  discount_total: number;
  freight_charges: number;
  round_off: number;
  grand_total: number;
  amount_in_words: string;
}

export interface PaymentDetails {
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch: string | null;
  upi_id: string | null;
  payment_mode: string | null;
  payment_terms: string | null;
}

export interface ValidationResult {
  is_gstin_seller_valid: boolean;
  is_gstin_buyer_valid: boolean;
  is_pan_seller_valid: boolean;
  is_pan_buyer_valid: boolean;
  is_tax_calculation_valid: boolean;
  is_grand_total_valid: boolean;
  is_gst_breakup_valid: boolean;
  is_duplicate_invoice: boolean;
  missing_mandatory_fields: string[];
}

export interface ExtractionResult {
  document_type: string;
  invoice: InvoiceMetadata;
  seller: PartyDetails;
  buyer: PartyDetails;
  items: InvoiceItem[];
  summary: InvoiceSummary;
  payment: PaymentDetails;
  validation: ValidationResult;
  warnings: string[];
  overall_confidence: number;
}

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileSize?: string;
  fileType: string;
  previewUrl?: string;
  uploadedAt: string;
  extraction: ExtractionResult;
  status: 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface SampleDocument {
  id: string;
  title: string;
  category: string;
  description: string;
  badge: string;
  fileName: string;
  data: ExtractionResult;
}

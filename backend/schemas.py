from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class InvoiceStatus(str, Enum):
    NEW = "NEW"
    VERIFIED = "VERIFIED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    FAILED = "FAILED"

class InvoiceMetadata(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    place_of_supply: Optional[str] = None
    po_number: Optional[str] = None
    irn: Optional[str] = None
    qr_code_data: Optional[str] = None
    reverse_charge: Optional[bool] = None

class PartyDetails(BaseModel):
    name: Optional[str] = None
    trade_name: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    shipping_address: Optional[str] = None

class InvoiceItem(BaseModel):
    sl_no: Optional[int] = 1
    description: Optional[str] = ""
    hsn_sac: Optional[str] = ""
    quantity: Optional[float] = 0.0
    unit: Optional[str] = ""
    rate: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    taxable_value: Optional[float] = 0.0
    cgst_rate: Optional[float] = 0.0
    cgst_amount: Optional[float] = 0.0
    sgst_rate: Optional[float] = 0.0
    sgst_amount: Optional[float] = 0.0
    igst_rate: Optional[float] = 0.0
    igst_amount: Optional[float] = 0.0
    cess_rate: Optional[float] = 0.0
    cess_amount: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0

class InvoiceSummary(BaseModel):
    total_taxable_value: Optional[float] = 0.0
    cgst_total: Optional[float] = 0.0
    sgst_total: Optional[float] = 0.0
    igst_total: Optional[float] = 0.0
    cess_total: Optional[float] = 0.0
    total_tax: Optional[float] = 0.0
    discount_total: Optional[float] = 0.0
    freight_charges: Optional[float] = 0.0
    round_off: Optional[float] = 0.0
    grand_total: Optional[float] = 0.0
    amount_in_words: Optional[str] = ""

class PaymentDetails(BaseModel):
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch: Optional[str] = None
    upi_id: Optional[str] = None
    payment_mode: Optional[str] = None
    payment_terms: Optional[str] = None

class ValidationResult(BaseModel):
    is_gstin_seller_valid: bool = True
    is_gstin_buyer_valid: bool = True
    is_pan_seller_valid: bool = True
    is_pan_buyer_valid: bool = True
    is_tax_calculation_valid: bool = True
    is_grand_total_valid: bool = True
    is_gst_breakup_valid: bool = True
    is_duplicate_invoice: bool = False
    missing_mandatory_fields: List[str] = Field(default_factory=list)

class GeminiInvoiceData(BaseModel):
    document_type: Optional[str] = "Tax Invoice"
    invoice: Optional[InvoiceMetadata] = Field(default_factory=InvoiceMetadata)
    seller: Optional[PartyDetails] = Field(default_factory=PartyDetails)
    buyer: Optional[PartyDetails] = Field(default_factory=PartyDetails)
    items: Optional[List[InvoiceItem]] = Field(default_factory=list)
    summary: Optional[InvoiceSummary] = Field(default_factory=InvoiceSummary)
    payment: Optional[PaymentDetails] = Field(default_factory=PaymentDetails)
    overall_confidence: Optional[float] = 0.95

class ExtractInvoiceRequest(BaseModel):
    gemini_json: GeminiInvoiceData
    processing_time: Optional[float] = 0.0
    ai_model: Optional[str] = "gemini-3.6-flash"

class ExtractInvoiceResponse(BaseModel):
    success: bool
    invoice_id: str
    status: InvoiceStatus
    validation: ValidationResult
    warnings: List[str]
    confidence: float
    data: GeminiInvoiceData
    created_at: str

class InvoiceSearchQuery(BaseModel):
    invoice_number: Optional[str] = None
    gstin: Optional[str] = None
    company_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    status: Optional[InvoiceStatus] = None

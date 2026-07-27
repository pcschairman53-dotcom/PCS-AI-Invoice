import re
from typing import List, Tuple, Optional
from schemas import GeminiInvoiceData, ValidationResult, InvoiceStatus

INDIAN_STATE_CODES = {
    '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
    '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
    '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
    '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
    '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
    '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra',
    '28': 'Andhra Pradesh (Old)', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
    '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana', '37': 'Andhra Pradesh (New)', '38': 'Ladakh'
}

def validate_gstin(gstin: Optional[str]) -> bool:
    if not gstin:
        return False
    clean = gstin.strip().upper()
    regex = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
    if not re.match(regex, clean):
        return False
    state_code = clean[:2]
    return state_code in INDIAN_STATE_CODES

def validate_pan(pan: Optional[str]) -> bool:
    if not pan:
        return False
    clean = pan.strip().upper()
    regex = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
    return bool(re.match(regex, clean))

def validate_invoice_date(date_str: Optional[str]) -> bool:
    if not date_str:
        return False
    clean = date_str.strip()
    regex = r"^(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4})$"
    return bool(re.match(regex, clean))

def validate_and_audit_invoice(
    invoice_data: GeminiInvoiceData,
    existing_invoice_numbers: List[str] = None
) -> Tuple[ValidationResult, List[str], InvoiceStatus]:
    warnings: List[str] = []
    missing_fields: List[str] = []
    existing_invoice_numbers = existing_invoice_numbers or []

    # 1. GSTIN Validations
    seller_gstin_valid = validate_gstin(invoice_data.seller.gstin)
    buyer_gstin_valid = validate_gstin(invoice_data.buyer.gstin) if invoice_data.buyer.gstin else True

    if invoice_data.seller.gstin and not seller_gstin_valid:
        warnings.append(f"Invalid Seller GSTIN format: '{invoice_data.seller.gstin}'. Standard GSTIN is 15 chars.")
    if invoice_data.buyer.gstin and not buyer_gstin_valid:
        warnings.append(f"Invalid Buyer GSTIN format: '{invoice_data.buyer.gstin}'.")

    # Derive PAN from GSTIN if missing
    if not invoice_data.seller.pan and seller_gstin_valid and invoice_data.seller.gstin:
        invoice_data.seller.pan = invoice_data.seller.gstin[2:12]
    if not invoice_data.buyer.pan and buyer_gstin_valid and invoice_data.buyer.gstin:
        invoice_data.buyer.pan = invoice_data.buyer.gstin[2:12]

    # PAN Validations
    seller_pan_valid = validate_pan(invoice_data.seller.pan)
    buyer_pan_valid = validate_pan(invoice_data.buyer.pan) if invoice_data.buyer.pan else True

    if invoice_data.seller.pan and not seller_pan_valid:
        warnings.append(f"Invalid Seller PAN format: '{invoice_data.seller.pan}'.")

    # Date Validation
    date_valid = validate_invoice_date(invoice_data.invoice.invoice_date)
    if not invoice_data.invoice.invoice_date:
        missing_fields.append("invoice.invoice_date")
        warnings.append("Invoice Date is missing.")
    elif not date_valid:
        warnings.append(f"Unrecognized Invoice Date format: '{invoice_data.invoice.invoice_date}'.")

    # Tax Calculation Validation
    items_math_valid = True
    items_taxable_sum = 0.0
    items_cgst_sum = 0.0
    items_sgst_sum = 0.0
    items_igst_sum = 0.0

    if invoice_data.items:
        for idx, item in enumerate(invoice_data.items):
            items_taxable_sum += float(item.taxable_value or 0.0)
            items_cgst_sum += float(item.cgst_amount or 0.0)
            items_sgst_sum += float(item.sgst_amount or 0.0)
            items_igst_sum += float(item.igst_amount or 0.0)

            expected_taxable = round(float(item.quantity or 0.0) * float(item.rate or 0.0) - float(item.discount or 0.0), 2)
            if item.quantity > 0 and item.rate > 0 and abs(expected_taxable - (item.taxable_value or 0.0)) > 1.5:
                items_math_valid = False
                warnings.append(f"Line item #{idx+1} ({item.description}): Taxable value ({item.taxable_value}) differs from qty * rate - discount ({expected_taxable}).")
    else:
        missing_fields.append("items")
        warnings.append("No line items found in invoice.")

    # Tax Breakup Check
    seller_state_code = (
    invoice_data.seller.state_code
    or (invoice_data.seller.gstin[:2] if seller_gstin_valid and invoice_data.seller.gstin else None)
)

    pos_state_code = (
    invoice_data.buyer.state_code
    or (invoice_data.buyer.gstin[:2] if buyer_gstin_valid and invoice_data.buyer.gstin else None)
)

    gst_breakup_valid =True
    cgst_total = float(invoice_data.summary.cgst_total or 0.0)
    sgst_total = float(invoice_data.summary.sgst_total or 0.0)
    igst_total = float(invoice_data.summary.igst_total or 0.0)

    if seller_state_code and pos_state_code:
        if seller_state_code == pos_state_code: # Intrastate
            if igst_total > 0.01:
                gst_breakup_valid = False
                warnings.append(f"Intrastate transaction (State {seller_state_code}), but IGST ({igst_total}) was charged instead of CGST+SGST.")
            if abs(cgst_total - sgst_total) > 0.5:
                gst_breakup_valid = False
                warnings.append(f"Intrastate CGST ({cgst_total}) and SGST ({sgst_total}) amounts must be equal.")
        else: # Interstate
            if cgst_total > 0.01 or sgst_total > 0.01:
                gst_breakup_valid = False
                warnings.append(f"Interstate transaction (Seller {seller_state_code} -> POS {pos_state_code}), but CGST/SGST was charged instead of IGST.")

    # Grand Total Check
    total_tax = cgst_total + sgst_total + igst_total + float(invoice_data.summary.cess_total or 0.0)
    calculated_grand_total = round(
        float(invoice_data.summary.total_taxable_value or 0.0) +
        total_tax +
        float(invoice_data.summary.freight_charges or 0.0) -
        float(invoice_data.summary.discount_total or 0.0) +
        float(invoice_data.summary.round_off or 0.0),
        2
    )
    actual_grand_total = float(invoice_data.summary.grand_total or 0.0)
    grand_total_valid = abs(calculated_grand_total - actual_grand_total) <= 1.5

    if not grand_total_valid:
        warnings.append(f"Grand Total mismatch: Calculated ({calculated_grand_total}) differs from printed Grand Total ({actual_grand_total}).")

    # Mandatory Fields Check
    if not invoice_data.invoice.invoice_number:
        missing_fields.append("invoice.invoice_number")
    if not invoice_data.seller.name:
        missing_fields.append("seller.name")
    if not invoice_data.seller.gstin:
        missing_fields.append("seller.gstin")
    if not invoice_data.buyer.name:
        missing_fields.append("buyer.name")
    if invoice_data.summary.grand_total is None or invoice_data.summary.grand_total == 0.0:
        missing_fields.append("summary.grand_total")

    if missing_fields:
        warnings.append(f"Missing mandatory fields: {', '.join(missing_fields)}.")

    # Duplicate Invoice Detection
    inv_num = invoice_data.invoice.invoice_number.strip() if invoice_data.invoice.invoice_number else None
    is_duplicate = bool(inv_num and inv_num in existing_invoice_numbers)
    if is_duplicate:
        warnings.append(f"DUPLICATE INVOICE DETECTED: Invoice #{inv_num} already exists in database.")

    # Compile Validation Result
    validation = ValidationResult(
        is_gstin_seller_valid=seller_gstin_valid,
        is_gstin_buyer_valid=buyer_gstin_valid,
        is_pan_seller_valid=seller_pan_valid,
        is_pan_buyer_valid=buyer_pan_valid,
        is_tax_calculation_valid=items_math_valid,
        is_grand_total_valid=grand_total_valid,
        is_gst_breakup_valid=gst_breakup_valid,
        is_duplicate_invoice=is_duplicate,
        missing_mandatory_fields=missing_fields
    )

    # Determine Status
    if is_duplicate or len(missing_fields) > 0 or not grand_total_valid or not gst_breakup_valid:
        status = InvoiceStatus.REVIEW_REQUIRED
    elif len(warnings) > 0:
        status = InvoiceStatus.REVIEW_REQUIRED
    else:
        status = InvoiceStatus.VERIFIED

    return validation, warnings, status

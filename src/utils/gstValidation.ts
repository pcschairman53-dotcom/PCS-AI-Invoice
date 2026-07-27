/**
 * GST and Tax Invoice Validation Engine
 * Implements Indian GSTIN regex checks, PAN validation, State Code mapping,
 * Intrastate vs Interstate GST verification, Math audits, and Mandatory fields detector.
 */

import { ExtractionResult, ValidationResult } from '../types';

export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Center Jurisdiction'
};

/**
 * Validates 15-character Indian GSTIN
 */
export function validateGSTIN(gstin: string | null | undefined): boolean {
  if (!gstin) return false;
  const cleanGstin = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(cleanGstin)) return false;

  // Verify first 2 digits match valid state code
  const stateCode = cleanGstin.substring(0, 2);
  return Boolean(INDIAN_STATE_CODES[stateCode]);
}

/**
 * Validates 10-character Indian PAN
 */
export function validatePAN(pan: string | null | undefined): boolean {
  if (!pan) return false;
  const cleanPan = pan.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(cleanPan);
}

/**
 * Extracts state code from GSTIN or state name
 */
export function extractStateCode(gstin?: string | null, stateName?: string | null): string | null {
  if (gstin && validateGSTIN(gstin)) {
    return gstin.trim().substring(0, 2);
  }
  if (stateName) {
    const nameLower = stateName.trim().toLowerCase();
    for (const [code, name] of Object.entries(INDIAN_STATE_CODES)) {
      if (name.toLowerCase() === nameLower) return code;
    }
  }
  return null;
}

/**
 * Validates date string in common Indian / ISO formats
 */
export function validateInvoiceDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return true;

  // Check DD/MM/YYYY or DD-MM-YYYY
  const indianDateRegex = /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/;
  return indianDateRegex.test(dateStr.trim());
}

/**
 * Performs complete validation audit on extracted invoice JSON
 */
export function runValidationAudit(
  data: ExtractionResult,
  existingInvoiceNumbers: string[] = []
): ExtractionResult {
  const warnings: string[] = [];
  const missingMandatoryFields: string[] = [];

  // 1. GSTIN & PAN Validations
  const sellerGstinValid = validateGSTIN(data.seller?.gstin);
  const buyerGstinValid = data.buyer?.gstin ? validateGSTIN(data.buyer.gstin) : true; // Buyer GSTIN optional for B2C

  if (data.seller?.gstin && !sellerGstinValid) {
    warnings.push(`Invalid Seller GSTIN format: '${data.seller.gstin}'. Standard GSTIN is 15 chars.`);
  }
  if (data.buyer?.gstin && !buyerGstinValid) {
    warnings.push(`Invalid Buyer GSTIN format: '${data.buyer.gstin}'.`);
  }

  // Derive PAN from GSTIN if missing
  if (!data.seller?.pan && sellerGstinValid && data.seller?.gstin) {
    data.seller.pan = data.seller.gstin.substring(2, 12);
  }
  if (!data.buyer?.pan && data.buyer?.gstin && buyerGstinValid) {
    data.buyer.pan = data.buyer.gstin.substring(2, 12);
  }

  const sellerPanValid = validatePAN(data.seller?.pan);
  const buyerPanValid = data.buyer?.pan ? validatePAN(data.buyer.pan) : true;

  if (data.seller?.pan && !sellerPanValid) {
    warnings.push(`Invalid Seller PAN format: '${data.seller.pan}'.`);
  }

  // Derive State Code from GSTIN if missing
  if (!data.seller?.state_code && data.seller?.gstin) {
    const code = extractStateCode(data.seller.gstin, data.seller.state);
    if (code) {
      data.seller.state_code = code;
      data.seller.state = data.seller.state || INDIAN_STATE_CODES[code];
    }
  }
  if (!data.buyer?.state_code && data.buyer?.gstin) {
    const code = extractStateCode(data.buyer.gstin, data.buyer.state);
    if (code) {
      data.buyer.state_code = code;
      data.buyer.state = data.buyer.state || INDIAN_STATE_CODES[code];
    }
  }

  // 2. Date Validation
  const isDateValid = validateInvoiceDate(data.invoice?.invoice_date);
  if (!data.invoice?.invoice_date) {
    missingMandatoryFields.push('invoice.invoice_date');
    warnings.push('Invoice Date is missing.');
  } else if (!isDateValid) {
    warnings.push(`Unrecognized Invoice Date format: '${data.invoice.invoice_date}'.`);
  }

  // 3. Tax Calculation Validation
  let itemsMathValid = true;
  let itemsTaxableSum = 0;
  let itemsCgstSum = 0;
  let itemsSgstSum = 0;
  let itemsIgstSum = 0;

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      itemsTaxableSum += Number(item.taxable_value || 0);
      itemsCgstSum += Number(item.cgst_amount || 0);
      itemsSgstSum += Number(item.sgst_amount || 0);
      itemsIgstSum += Number(item.igst_amount || 0);

      const expectedTaxable = Math.round((Number(item.quantity || 0) * Number(item.rate || 0) - Number(item.discount || 0)) * 100) / 100;
      if (item.quantity > 0 && item.rate > 0 && Math.abs(expectedTaxable - item.taxable_value) > 1.5) {
        itemsMathValid = false;
        warnings.push(`Line item #${index + 1} (${item.description}): Taxable value (${item.taxable_value}) does not match qty * rate - discount (${expectedTaxable}).`);
      }
    });
  } else {
    missingMandatoryFields.push('items');
    warnings.push('No line items found in invoice.');
  }

  // Compare sum of items taxable value vs summary total taxable value
  const summaryTaxable = Number(data.summary?.total_taxable_value || 0);
  if (data.items?.length > 0 && Math.abs(itemsTaxableSum - summaryTaxable) > 1.5) {
    itemsMathValid = false;
    warnings.push(`Sum of line item taxable values (${itemsTaxableSum.toFixed(2)}) does not match summary Total Taxable Value (${summaryTaxable.toFixed(2)}).`);
  }

  // 4. GST Breakup Validation (Intrastate vs Interstate)
  let gstBreakupValid = true;
  const sellerStateCode = data.seller?.state_code || extractStateCode(data.seller?.gstin, data.seller?.state);
  
  // Extract place of supply state code
  let posStateCode = data.buyer?.state_code || extractStateCode(data.buyer?.gstin, data.buyer?.state);
  if (data.invoice?.place_of_supply) {
    const posMatch = data.invoice.place_of_supply.match(/\b\d{2}\b/);
    if (posMatch) posStateCode = posMatch[0];
  }

  const isIntrastate = Boolean(sellerStateCode && posStateCode && sellerStateCode === posStateCode);
  const isInterstate = Boolean(sellerStateCode && posStateCode && sellerStateCode !== posStateCode);

  const cgstTotal = Number(data.summary?.cgst_total || 0);
  const sgstTotal = Number(data.summary?.sgst_total || 0);
  const igstTotal = Number(data.summary?.igst_total || 0);

  if (isIntrastate) {
    if (igstTotal > 0.01) {
      gstBreakupValid = false;
      warnings.push(`Intrastate transaction detected (State code ${sellerStateCode}), but IGST (${igstTotal}) was charged instead of CGST+SGST.`);
    }
    if (Math.abs(cgstTotal - sgstTotal) > 0.5) {
      gstBreakupValid = false;
      warnings.push(`Intrastate CGST (${cgstTotal}) and SGST (${sgstTotal}) amounts must be equal.`);
    }
  } else if (isInterstate) {
    if (cgstTotal > 0.01 || sgstTotal > 0.01) {
      gstBreakupValid = false;
      warnings.push(`Interstate transaction detected (Seller ${sellerStateCode} -> POS ${posStateCode}), but CGST/SGST was charged instead of IGST.`);
    }
  }

  // 5. Grand Total Validation
  const totalTax = cgstTotal + sgstTotal + igstTotal + Number(data.summary?.cess_total || 0);
  const calculatedGrandTotal = Math.round(
    (summaryTaxable + totalTax + Number(data.summary?.freight_charges || 0) - Number(data.summary?.discount_total || 0) + Number(data.summary?.round_off || 0)) * 100
  ) / 100;

  const actualGrandTotal = Number(data.summary?.grand_total || 0);
  const grandTotalValid = Math.abs(calculatedGrandTotal - actualGrandTotal) <= 1.5;

  if (!grandTotalValid) {
    warnings.push(`Grand Total mismatch: Calculated (${calculatedGrandTotal.toFixed(2)}) differs from printed Grand Total (${actualGrandTotal.toFixed(2)}).`);
  }

  // 6. Mandatory Fields Detection
  if (!data.invoice?.invoice_number) missingMandatoryFields.push('invoice.invoice_number');
  if (!data.seller?.name) missingMandatoryFields.push('seller.name');
  if (!data.seller?.gstin) missingMandatoryFields.push('seller.gstin');
  if (!data.buyer?.name) missingMandatoryFields.push('buyer.name');
  if (!data.summary?.grand_total && data.summary?.grand_total !== 0) missingMandatoryFields.push('summary.grand_total');

  if (missingMandatoryFields.length > 0) {
    warnings.push(`Missing mandatory invoice fields: ${missingMandatoryFields.join(', ')}.`);
  }

  // 7. Duplicate Invoice Detection
  const invNum = data.invoice?.invoice_number?.trim();
  const isDuplicate = Boolean(invNum && existingInvoiceNumbers.includes(invNum));
  if (isDuplicate) {
    warnings.push(`DUPLICATE INVOICE DETECTED: Invoice #${invNum} has already been processed previously.`);
  }

  // Update validation results inside the response object
  const validation: ValidationResult = {
    is_gstin_seller_valid: sellerGstinValid,
    is_gstin_buyer_valid: buyerGstinValid,
    is_pan_seller_valid: sellerPanValid,
    is_pan_buyer_valid: buyerPanValid,
    is_tax_calculation_valid: itemsMathValid,
    is_grand_total_valid: grandTotalValid,
    is_gst_breakup_valid: gstBreakupValid,
    is_duplicate_invoice: isDuplicate,
    missing_mandatory_fields: missingMandatoryFields
  };

  return {
    ...data,
    validation,
    warnings: Array.from(new Set([...(data.warnings || []), ...warnings])),
    overall_confidence: data.overall_confidence || (warnings.length === 0 ? 0.98 : 0.85)
  };
}

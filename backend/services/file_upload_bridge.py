import base64
import json
import logging
import os
from typing import Optional, Dict, Any
from fastapi import UploadFile, HTTPException
import httpx

from config import settings
from schemas import (
    GeminiInvoiceData,
    InvoiceMetadata,
    PartyDetails,
    InvoiceItem,
    InvoiceSummary,
    PaymentDetails
)

logger = logging.getLogger("uvicorn")

SUPPORTED_MIME_TYPES = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "text/xml": "xml",
    "application/xml": "xml"
}

EXTENSION_TO_MIME = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".xml": "text/xml"
}

def detect_mime_type(filename: str, content_type: Optional[str]) -> str:
    """Detect MIME type safely without assuming text format."""
    if content_type and content_type in SUPPORTED_MIME_TYPES:
        return content_type
    
    ext = os.path.splitext(filename or "")[1].lower()
    if ext in EXTENSION_TO_MIME:
        return EXTENSION_TO_MIME[ext]
        
    return "application/pdf"

def map_dict_to_gemini_invoice_data(data: Dict[str, Any]) -> GeminiInvoiceData:
    """Map raw dictionary safely to GeminiInvoiceData model."""
    return GeminiInvoiceData(
        document_type=data.get("document_type", "Tax Invoice"),
        invoice=InvoiceMetadata(**(data.get("invoice") or {})),
        seller=PartyDetails(**(data.get("seller") or {})),
        buyer=PartyDetails(**(data.get("buyer") or {})),
        items=[
            InvoiceItem(**item) for item in data.get("items", []) 
            if isinstance(item, dict)
        ],
        summary=InvoiceSummary(**(data.get("summary") or {})),
        payment=PaymentDetails(**(data.get("payment") or {})),
        overall_confidence=data.get("overall_confidence", 0.95)
    )

async def extract_invoice_from_file_bytes(
    file_bytes: bytes,
    filename: str,
    content_type: Optional[str] = None
) -> GeminiInvoiceData:
    """
    Safely process binary bytes from uploaded PDF, Image, or XML file.
    CRITICAL: Never call file_bytes.decode('utf-8') directly on binary PDF or image files.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    mime_type = detect_mime_type(filename, content_type)
    
    # Safely convert raw binary bytes to base64 string
    base64_data = base64.b64encode(file_bytes).decode("ascii")

    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    
    if not gemini_key:
        logger.warning("GEMINI_API_KEY not configured. Returning default structured invoice record.")
        return GeminiInvoiceData()

    prompt_text = """You are PCS Enterprise Invoice Intelligence AI.
Extract all fields from this Indian invoice/document with high precision.
Return ONLY valid JSON matching this schema:
{
  "document_type": "GST Tax Invoice",
  "invoice": {
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-03-15",
    "due_date": null,
    "place_of_supply": "27-Maharashtra",
    "po_number": null,
    "irn": null,
    "qr_code_data": null,
    "reverse_charge": false
  },
  "seller": {
    "name": "Supplier Company Name",
    "trade_name": null,
    "address": "Supplier Address",
    "gstin": "27AAACR1234A1Z5",
    "pan": "AAACR1234A",
    "state": "Maharashtra",
    "state_code": "27",
    "phone": null,
    "email": null
  },
  "buyer": {
    "name": "Buyer Company Name",
    "trade_name": null,
    "address": "Buyer Address",
    "gstin": "29AAACI1681G1ZD",
    "pan": "AAACI1681G",
    "state": "Karnataka",
    "state_code": "29",
    "phone": null,
    "email": null,
    "shipping_address": null
  },
  "items": [
    {
      "sl_no": 1,
      "description": "Item description",
      "hsn_sac": "84713010",
      "quantity": 1.0,
      "unit": "Pcs",
      "rate": 1000.0,
      "discount": 0.0,
      "taxable_value": 1000.0,
      "cgst_rate": 9.0,
      "cgst_amount": 90.0,
      "sgst_rate": 9.0,
      "sgst_amount": 90.0,
      "igst_rate": 0.0,
      "igst_amount": 0.0,
      "cess_rate": 0.0,
      "cess_amount": 0.0,
      "total_amount": 1180.0
    }
  ],
  "summary": {
    "total_taxable_value": 1000.0,
    "cgst_total": 90.0,
    "sgst_total": 90.0,
    "igst_total": 0.0,
    "cess_total": 0.0,
    "total_tax": 180.0,
    "discount_total": 0.0,
    "freight_charges": 0.0,
    "round_off": 0.0,
    "grand_total": 1180.0,
    "amount_in_words": "One Thousand One Hundred Eighty Rupees Only"
  },
  "payment": {
    "bank_name": null,
    "account_number": null,
    "ifsc_code": null,
    "branch": null,
    "upi_id": null,
    "payment_mode": null,
    "payment_terms": null
  },
  "overall_confidence": 0.95
}"""

    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-3.6-flash"
    ]

    raw_json = None
    async with httpx.AsyncClient(timeout=60.0) as client:
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": base64_data
                                }
                            },
                            {
                                "text": prompt_text
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.1
                }
            }

            try:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    resp_data = response.json()
                    candidates = resp_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            raw_json = parts[0]["text"]
                            break
            except Exception as e:
                logger.error(f"Error calling Gemini model {model_name}: {e}")
                continue

    if not raw_json:
        logger.warning("Gemini model returned empty response or call failed. Using empty default structure.")
        return GeminiInvoiceData()

    cleaned_json = raw_json.strip()
    if cleaned_json.startswith("```json"):
        cleaned_json = cleaned_json.split("```json")[1].split("```")[0].strip()
    elif cleaned_json.startswith("```"):
        cleaned_json = cleaned_json.split("```")[1].split("```")[0].strip()

    try:
        dict_data = json.loads(cleaned_json)
        return map_dict_to_gemini_invoice_data(dict_data)
    except Exception as parse_err:
        logger.error(f"Failed to parse Gemini JSON output: {parse_err}")
        return GeminiInvoiceData()

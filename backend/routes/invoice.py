from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import uuid
from datetime import datetime
from schemas import (
    ExtractInvoiceRequest,
    ExtractInvoiceResponse,
    InvoiceStatus,
    GeminiInvoiceData
)
from services.validation import validate_and_audit_invoice
from database import get_database

router = APIRouter(prefix="/api/v1/invoice", tags=["Invoice Intelligence"])

@router.post("/extract", response_model=ExtractInvoiceResponse)
async def extract_and_store_invoice(request: ExtractInvoiceRequest):
    db = get_database()
    invoice_data = request.gemini_json

    existing_invoice_numbers = []
    if db is not None:
        try:
            inv_number = invoice_data.invoice.invoice_number
            if inv_number:
                existing_doc = await db["invoice_documents"].find_one({"invoice.invoice_number": inv_number})
                if existing_doc:
                    existing_invoice_numbers.append(inv_number)
        except Exception as e:
            pass

    # Run tax & GST audit
    validation, warnings, status = validate_and_audit_invoice(invoice_data, existing_invoice_numbers)

    invoice_id = f"INV-{uuid.uuid4().hex[:12].upper()}"
    created_at = datetime.utcnow().isoformat()

    document_record = {
        "_id": invoice_id,
        "invoice_id": invoice_id,
        "gemini_json": invoice_data.dict(),
        "invoice": invoice_data.invoice.dict(),
        "seller": invoice_data.seller.dict(),
        "buyer": invoice_data.buyer.dict(),
        "items": [item.dict() for item in (invoice_data.items or [])],
        "summary": invoice_data.summary.dict(),
        "payment": invoice_data.payment.dict(),
        "validation": validation.dict(),
        "warnings": warnings,
        "overall_confidence": invoice_data.overall_confidence or 0.95,
        "status": status.value,
        "processing_time": request.processing_time,
        "ai_model": request.ai_model,
        "created_at": created_at,
        "updated_at": created_at
    }

    if db is not None:
        try:
            await db["invoice_documents"].insert_one(document_record)
        except Exception as e:
            pass

    return ExtractInvoiceResponse(
        success=True,
        invoice_id=invoice_id,
        status=status,
        validation=validation,
        warnings=warnings,
        confidence=invoice_data.overall_confidence or 0.95,
        data=invoice_data,
        created_at=created_at
    )

@router.get("/search")
async def search_invoices(
    invoice_number: Optional[str] = Query(None, description="Search by Invoice Number"),
    gstin: Optional[str] = Query(None, description="Search by Seller or Buyer GSTIN"),
    company_name: Optional[str] = Query(None, description="Search by Company Name"),
    start_date: Optional[str] = Query(None, description="Start Date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End Date (YYYY-MM-DD)"),
    min_amount: Optional[float] = Query(None, description="Minimum Grand Total"),
    max_amount: Optional[float] = Query(None, description="Maximum Grand Total"),
    status: Optional[InvoiceStatus] = Query(None, description="Invoice Status")
):
    db = get_database()
    if db is None:
        return {"results": [], "total": 0, "message": "MongoDB Atlas not configured or connected."}

    query_filter = {}

    if invoice_number:
        query_filter["invoice.invoice_number"] = {"$regex": invoice_number, "$options": "i"}

    if gstin:
        query_filter["$or"] = [
            {"seller.gstin": {"$regex": gstin, "$options": "i"}},
            {"buyer.gstin": {"$regex": gstin, "$options": "i"}}
        ]

    if company_name:
        query_filter["$or"] = [
            {"seller.name": {"$regex": company_name, "$options": "i"}},
            {"buyer.name": {"$regex": company_name, "$options": "i"}}
        ]

    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query_filter["invoice.invoice_date"] = date_filter

    if min_amount is not None or max_amount is not None:
        amount_filter = {}
        if min_amount is not None:
            amount_filter["$gte"] = min_amount
        if max_amount is not None:
            amount_filter["$lte"] = max_amount
        query_filter["summary.grand_total"] = amount_filter

    if status:
        query_filter["status"] = status.value

    cursor = db["invoice_documents"].find(query_filter).sort("created_at", -1).limit(100)
    results = await cursor.to_list(length=100)

    for doc in results:
        doc["_id"] = str(doc["_id"])

    return {
        "results": results,
        "total": len(results),
        "filter": query_filter
    }

@router.get("/{invoice_id}")
async def get_invoice_by_id(invoice_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB not connected.")

    doc = await db["invoice_documents"].find_one({"invoice_id": invoice_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Invoice document '{invoice_id}' not found.")

    doc["_id"] = str(doc["_id"])
    return doc

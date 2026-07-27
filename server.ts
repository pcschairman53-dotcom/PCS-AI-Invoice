import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { runValidationAudit } from './src/utils/gstValidation.js';
import { ExtractionResult } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for PDF / High-res document uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize Gemini Client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // API Route: Extract & Validate Invoice
  app.post('/api/extract-invoice', async (req, res) => {
    try {
      const { fileBase64, mimeType, fileName, existingInvoiceNumbers = [] } = req.body;

      if (!fileBase64 || !mimeType) {
        return res.status(400).json({ error: 'fileBase64 and mimeType are required.' });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are PCS Enterprise Invoice Intelligence AI, an expert in Indian GST, Accounting, Tax Invoices, OCR-free Invoice Understanding and Enterprise Document Intelligence.

OBJECTIVE:
Extract every possible field from the uploaded invoice (PDF or Image) and return valid structured JSON adhering strictly to the JSON schema.

SUPPORTED DOCUMENTS:
GST Invoice, Tax Invoice, Purchase Invoice, Sales Invoice, Retail Bill, Credit Note, Debit Note, Proforma Invoice, Quotation, Multi-page PDF, Scanned Invoice, Mobile Camera Image.

RULES:
1. Read every page thoroughly. Merge multi-page invoices accurately.
2. Preserve original values, invoice numbers, GSTIN, PAN, and HSN codes exactly as printed on the document.
3. If a field is missing or not present, return null for strings or 0 for numbers.
4. Keep invoice numbers, GSTIN, PAN and HSN exactly as printed without adding dashes or spaces unless printed.
5. Identify document_type ("GST Invoice", "Tax Invoice", "Purchase Invoice", "Sales Invoice", "Credit Note", "Debit Note", "Proforma Invoice", "Quotation", etc.).
6. Extract all line items into the "items" array with sl_no, description, hsn_sac, quantity, unit, rate, discount, taxable_value, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, cess_rate, cess_amount, total_amount.
7. Extract IRN (64-char e-invoice hash), QR code data, place_of_supply, reverse_charge boolean (true/false/null).
8. Compute overall_confidence score from 0.0 to 1.0 based on document legibility and completeness.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          document_type: { type: Type.STRING, description: "Type of invoice document" },
          invoice: {
            type: Type.OBJECT,
            properties: {
              invoice_number: { type: Type.STRING },
              invoice_date: { type: Type.STRING },
              due_date: { type: Type.STRING },
              place_of_supply: { type: Type.STRING },
              po_number: { type: Type.STRING },
              irn: { type: Type.STRING },
              qr_code_data: { type: Type.STRING },
              reverse_charge: { type: Type.BOOLEAN }
            }
          },
          seller: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              trade_name: { type: Type.STRING },
              address: { type: Type.STRING },
              gstin: { type: Type.STRING },
              pan: { type: Type.STRING },
              state: { type: Type.STRING },
              state_code: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING }
            }
          },
          buyer: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              trade_name: { type: Type.STRING },
              address: { type: Type.STRING },
              gstin: { type: Type.STRING },
              pan: { type: Type.STRING },
              state: { type: Type.STRING },
              state_code: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              shipping_address: { type: Type.STRING }
            }
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sl_no: { type: Type.INTEGER },
                description: { type: Type.STRING },
                hsn_sac: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                rate: { type: Type.NUMBER },
                discount: { type: Type.NUMBER },
                taxable_value: { type: Type.NUMBER },
                cgst_rate: { type: Type.NUMBER },
                cgst_amount: { type: Type.NUMBER },
                sgst_rate: { type: Type.NUMBER },
                sgst_amount: { type: Type.NUMBER },
                igst_rate: { type: Type.NUMBER },
                igst_amount: { type: Type.NUMBER },
                cess_rate: { type: Type.NUMBER },
                cess_amount: { type: Type.NUMBER },
                total_amount: { type: Type.NUMBER }
              }
            }
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              total_taxable_value: { type: Type.NUMBER },
              cgst_total: { type: Type.NUMBER },
              sgst_total: { type: Type.NUMBER },
              igst_total: { type: Type.NUMBER },
              cess_total: { type: Type.NUMBER },
              total_tax: { type: Type.NUMBER },
              discount_total: { type: Type.NUMBER },
              freight_charges: { type: Type.NUMBER },
              round_off: { type: Type.NUMBER },
              grand_total: { type: Type.NUMBER },
              amount_in_words: { type: Type.STRING }
            }
          },
          payment: {
            type: Type.OBJECT,
            properties: {
              bank_name: { type: Type.STRING },
              account_number: { type: Type.STRING },
              ifsc_code: { type: Type.STRING },
              branch: { type: Type.STRING },
              upi_id: { type: Type.STRING },
              payment_mode: { type: Type.STRING },
              payment_terms: { type: Type.STRING }
            }
          },
          overall_confidence: { type: Type.NUMBER }
        }
      };

      const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            },
            {
              text: 'Extract all fields from this Indian invoice/document with high precision according to the JSON schema.'
            }
          ]
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const responseText = response.text || '{}';
      let rawData: Partial<ExtractionResult>;
      try {
        rawData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini output:', responseText);
        return res.status(500).json({ error: 'Failed to parse JSON response from document extractor.' });
      }

      // Initialize default structures if null
      const extraction: ExtractionResult = {
        document_type: rawData.document_type || 'Tax Invoice',
        invoice: {
          invoice_number: rawData.invoice?.invoice_number || null,
          invoice_date: rawData.invoice?.invoice_date || null,
          due_date: rawData.invoice?.due_date || null,
          place_of_supply: rawData.invoice?.place_of_supply || null,
          po_number: rawData.invoice?.po_number || null,
          irn: rawData.invoice?.irn || null,
          qr_code_data: rawData.invoice?.qr_code_data || null,
          reverse_charge: rawData.invoice?.reverse_charge ?? null
        },
        seller: {
          name: rawData.seller?.name || null,
          trade_name: rawData.seller?.trade_name || null,
          address: rawData.seller?.address || null,
          gstin: rawData.seller?.gstin || null,
          pan: rawData.seller?.pan || null,
          state: rawData.seller?.state || null,
          state_code: rawData.seller?.state_code || null,
          phone: rawData.seller?.phone || null,
          email: rawData.seller?.email || null
        },
        buyer: {
          name: rawData.buyer?.name || null,
          trade_name: rawData.buyer?.trade_name || null,
          address: rawData.buyer?.address || null,
          gstin: rawData.buyer?.gstin || null,
          pan: rawData.buyer?.pan || null,
          state: rawData.buyer?.state || null,
          state_code: rawData.buyer?.state_code || null,
          phone: rawData.buyer?.phone || null,
          email: rawData.buyer?.email || null,
          shipping_address: rawData.buyer?.shipping_address || null
        },
        items: rawData.items || [],
        summary: {
          total_taxable_value: rawData.summary?.total_taxable_value || 0,
          cgst_total: rawData.summary?.cgst_total || 0,
          sgst_total: rawData.summary?.sgst_total || 0,
          igst_total: rawData.summary?.igst_total || 0,
          cess_total: rawData.summary?.cess_total || 0,
          total_tax: rawData.summary?.total_tax || 0,
          discount_total: rawData.summary?.discount_total || 0,
          freight_charges: rawData.summary?.freight_charges || 0,
          round_off: rawData.summary?.round_off || 0,
          grand_total: rawData.summary?.grand_total || 0,
          amount_in_words: rawData.summary?.amount_in_words || ''
        },
        payment: {
          bank_name: rawData.payment?.bank_name || null,
          account_number: rawData.payment?.account_number || null,
          ifsc_code: rawData.payment?.ifsc_code || null,
          branch: rawData.payment?.branch || null,
          upi_id: rawData.payment?.upi_id || null,
          payment_mode: rawData.payment?.payment_mode || null,
          payment_terms: rawData.payment?.payment_terms || null
        },
        validation: {
          is_gstin_seller_valid: true,
          is_gstin_buyer_valid: true,
          is_pan_seller_valid: true,
          is_pan_buyer_valid: true,
          is_tax_calculation_valid: true,
          is_grand_total_valid: true,
          is_gst_breakup_valid: true,
          is_duplicate_invoice: false,
          missing_mandatory_fields: []
        },
        warnings: [],
        overall_confidence: rawData.overall_confidence || 0.95
      };

      // Run rigorous GST & Tax Validation Audit
      const validatedExtraction = runValidationAudit(extraction, existingInvoiceNumbers);

      res.json({
        success: true,
        data: validatedExtraction
      });
    } catch (err: any) {
      console.error('Invoice Extraction Server Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'An unexpected error occurred during invoice extraction.'
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PCS Enterprise Invoice Intelligence AI Server running at http://localhost:${PORT}`);
  });
}

startServer();

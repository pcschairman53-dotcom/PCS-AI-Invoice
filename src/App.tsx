import React, { useState } from 'react';
import { Header } from './components/Header';
import { InvoiceUploader } from './components/InvoiceUploader';
import { InvoiceViewer } from './components/InvoiceViewer';
import { ValidationReport } from './components/ValidationReport';
import { JsonViewer } from './components/JsonViewer';
import { ItemizedTable } from './components/ItemizedTable';
import { InvoiceSummaryCard } from './components/InvoiceSummaryCard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SAMPLE_INVOICES } from './data/sampleInvoices';
import { ExtractionResult, ProcessedDocument, SampleDocument } from './types';
import { FileCode, Layers, ShieldCheck, CheckCircle2, AlertTriangle, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function App() {
  const [currentDoc, setCurrentDoc] = useState<{
    fileName: string;
    fileType: string;
    previewUrl?: string;
    extraction: ExtractionResult;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [history, setHistory] = useState<ProcessedDocument[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'summary' | 'items' | 'json'>('audit');

  // Handle uploading custom file (PDF / Image)
  const handleFileUpload = async (fileBase64: string, mimeType: string, fileName: string) => {
    setIsLoading(true);

    try {
      // Gather existing invoice numbers for duplicate detection
      const existingInvoiceNumbers = history
        .map((item) => item.extraction.invoice?.invoice_number)
        .filter((num): num is string => Boolean(num));

      const response = await fetch('/api/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          mimeType,
          fileName,
          existingInvoiceNumbers
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to process document with Gemini AI.');
      }

      const extracted: ExtractionResult = resData.data;

      const newDocState = {
        fileName,
        fileType: mimeType,
        previewUrl: fileBase64,
        extraction: extracted
      };

      setCurrentDoc(newDocState);

      const historyRecord: ProcessedDocument = {
        id: `doc-${Date.now()}`,
        fileName,
        fileType: mimeType,
        previewUrl: fileBase64,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extraction: extracted,
        status: 'completed'
      };

      setHistory((prev) => [historyRecord, ...prev]);
    } catch (err: any) {
      alert(`Invoice Intelligence Error: ${err.message || 'Server extraction error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting sample document
  const handleSelectSample = (sample: SampleDocument) => {
    // Check duplicate
    const existingNumbers = history.map((item) => item.extraction.invoice?.invoice_number);
    const sampleInvNum = sample.data.invoice?.invoice_number;
    
    let sampleData = { ...sample.data };
    if (sampleInvNum && existingNumbers.includes(sampleInvNum)) {
      sampleData.validation = {
        ...sampleData.validation,
        is_duplicate_invoice: true
      };
      if (!sampleData.warnings.some(w => w.includes('DUPLICATE INVOICE'))) {
        sampleData.warnings = [
          `DUPLICATE INVOICE DETECTED: Invoice #${sampleInvNum} has already been processed in your history.`,
          ...sampleData.warnings
        ];
      }
    }

    setCurrentDoc({
      fileName: sample.fileName,
      fileType: 'application/pdf',
      previewUrl: undefined,
      extraction: sampleData
    });

    const historyRecord: ProcessedDocument = {
      id: `sample-${Date.now()}`,
      fileName: sample.fileName,
      fileType: 'application/pdf',
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      extraction: sampleData,
      status: 'completed'
    };

    setHistory((prev) => [historyRecord, ...prev]);
  };

  // CSV Exporter
  const handleExportCsv = () => {
    if (history.length === 0) return;

    const headers = [
      'Document Type',
      'Invoice Number',
      'Invoice Date',
      'Seller Name',
      'Seller GSTIN',
      'Buyer Name',
      'Buyer GSTIN',
      'Total Taxable Value',
      'CGST Total',
      'SGST Total',
      'IGST Total',
      'Grand Total',
      'Audit Warnings Count',
      'Confidence Score'
    ];

    const rows = history.map((doc) => {
      const e = doc.extraction;
      return [
        `"${e.document_type || ''}"`,
        `"${e.invoice?.invoice_number || ''}"`,
        `"${e.invoice?.invoice_date || ''}"`,
        `"${(e.seller?.name || '').replace(/"/g, '""')}"`,
        `"${e.seller?.gstin || ''}"`,
        `"${(e.buyer?.name || '').replace(/"/g, '""')}"`,
        `"${e.buyer?.gstin || ''}"`,
        e.summary?.total_taxable_value || 0,
        e.summary?.cgst_total || 0,
        e.summary?.sgst_total || 0,
        e.summary?.igst_total || 0,
        e.summary?.grand_total || 0,
        (e.warnings || []).length,
        Math.round((e.overall_confidence || 0) * 100) + '%'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PCS_Invoice_Intelligence_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentExt = currentDoc?.extraction;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <Header
        rawJsonMode={rawJsonMode}
        setRawJsonMode={setRawJsonMode}
        processedCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onExportBatchCsv={handleExportCsv}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Upload Area */}
        <InvoiceUploader
          onFileUpload={handleFileUpload}
          onSelectSample={handleSelectSample}
          isLoading={isLoading}
        />

        {/* Empty State or Interactive Workspace */}
        {!currentDoc ? (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-12 text-center shadow-2xl flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-slate-100">No Invoice Records Loaded</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Upload a PDF or image invoice above. Gemini 3.6 Flash will extract structured tax fields, vendor/buyer details, line items, and perform automated GST compliance auditing.
              </p>
            </div>
          </div>
        ) : rawJsonMode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span><strong>Strict JSON Output Mode Active:</strong> Returning pure unformatted structured JSON without conversational wrapping.</span>
              </div>
              <button
                onClick={() => setRawJsonMode(false)}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Switch to Dashboard
              </button>
            </div>
            {currentExt && <JsonViewer data={currentExt} onExportCsv={handleExportCsv} />}
          </div>
        ) : (
          /* Normal Interactive Audit Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Document Previewer */}
            <div className="lg:col-span-5 h-full">
              <div className="sticky top-28">
                <InvoiceViewer
                  previewUrl={currentDoc.previewUrl}
                  fileType={currentDoc.fileType}
                  fileName={currentDoc.fileName}
                />
              </div>
            </div>

            {/* Right Column: Structured Audit Workspace */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Workspace Navigation Tabs */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'audit'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>GST Audit Scorecard</span>
                </button>

                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'summary'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Invoice Summary</span>
                </button>

                <button
                  onClick={() => setActiveTab('items')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'items'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Itemized Lines ({currentExt?.items?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('json')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'json'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-indigo-300" />
                  <span>JSON Tree</span>
                </button>
              </div>

              {/* Tab Content Views */}
              {activeTab === 'audit' && currentExt && (
                <div className="space-y-6">
                  <ValidationReport
                    validation={currentExt.validation}
                    warnings={currentExt.warnings}
                    confidence={currentExt.overall_confidence}
                  />
                  <InvoiceSummaryCard data={currentExt} />
                </div>
              )}

              {activeTab === 'summary' && currentExt && (
                <InvoiceSummaryCard data={currentExt} />
              )}

              {activeTab === 'items' && currentExt && (
                <ItemizedTable items={currentExt.items || []} />
              )}

              {activeTab === 'json' && currentExt && (
                <JsonViewer data={currentExt} onExportCsv={handleExportCsv} />
              )}

            </div>

          </div>
        )}

      </main>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectDocument={(doc) => {
          setCurrentDoc({
            fileName: doc.fileName,
            fileType: doc.fileType,
            previewUrl: doc.previewUrl,
            extraction: doc.extraction
          });
        }}
        onClearHistory={() => setHistory([])}
        onExportCsv={handleExportCsv}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>PCS Enterprise Invoice Intelligence AI • Indian GST & Tax Document Intelligence</p>
          <p className="font-mono text-[11px] text-slate-600">Powered by Gemini 3.6 Flash & Server-side Tax Engine</p>
        </div>
      </footer>

    </div>
  );
}

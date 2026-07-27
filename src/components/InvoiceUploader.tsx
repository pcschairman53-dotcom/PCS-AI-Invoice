import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, FileCheck2, Image as ImageIcon, Layers, ArrowRight } from 'lucide-react';
import { SAMPLE_INVOICES } from '../data/sampleInvoices';
import { SampleDocument } from '../types';

interface InvoiceUploaderProps {
  onFileUpload: (fileBase64: string, mimeType: string, fileName: string) => void;
  onSelectSample: (sample: SampleDocument) => void;
  isLoading: boolean;
}

export const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({
  onFileUpload,
  onSelectSample,
  isLoading
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setUploadError(null);

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      onFileUpload(result, mimeType, file.name);
    };
    reader.onerror = () => {
      setUploadError('Failed to read document file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <span>Upload Invoice or Select Test Document</span>
          </h2>
          <p className="text-xs text-slate-400">
            Supports Multi-page PDFs, Scanned Invoices, Receipts, Quotations, and Mobile Camera Images.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            PDF • JPG • PNG • WEBP
          </span>
        </div>
      </div>

      {/* Main Drag-and-Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700 hover:border-slate-500 bg-slate-950/60 hover:bg-slate-950/80'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-200">
              {isLoading ? (
                <span className="text-indigo-300">Extracting Fields & Auditing Tax with Gemini AI...</span>
              ) : (
                <>
                  <span className="text-indigo-400 underline decoration-indigo-400/50 underline-offset-4">
                    Click to upload
                  </span>{' '}
                  or drag and drop invoice here
                </>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              OCR-Free Multimodal Extraction • Automatic GSTIN, PAN, and Tax Auditing
            </p>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Quick Load Test Samples (Only if available) */}
      {SAMPLE_INVOICES.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Load Sample Documents
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SAMPLE_INVOICES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => !isLoading && onSelectSample(sample)}
                disabled={isLoading}
                className="group text-left p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {sample.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      sample.badge.includes('Discrepancy')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {sample.badge}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {sample.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-indigo-300 font-medium">
                  <span>Load Sample</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

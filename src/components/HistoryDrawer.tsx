import React, { useState } from 'react';
import { X, Search, FileText, CheckCircle2, AlertTriangle, FileSpreadsheet, Trash2, ArrowRight } from 'lucide-react';
import { ProcessedDocument } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ProcessedDocument[];
  onSelectDocument: (doc: ProcessedDocument) => void;
  onClearHistory: () => void;
  onExportCsv: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectDocument,
  onClearHistory,
  onExportCsv
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = history.filter((doc) => {
    const inv = doc.extraction.invoice?.invoice_number || '';
    const seller = doc.extraction.seller?.name || '';
    const buyer = doc.extraction.buyer?.name || '';
    const q = searchTerm.toLowerCase();
    return inv.toLowerCase().includes(q) || seller.toLowerCase().includes(q) || buyer.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">Invoice History ({history.length})</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice number, seller, buyer..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* List of Documents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length > 0 ? (
            filtered.map((doc) => {
              const hasWarnings = (doc.extraction.warnings || []).length > 0;
              const invNum = doc.extraction.invoice?.invoice_number || 'N/A';
              const sellerName = doc.extraction.seller?.name || 'Unknown Seller';
              const grandTotal = doc.extraction.summary?.grand_total || 0;

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDocument(doc);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-300">#{invNum}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        hasWarnings
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {hasWarnings ? 'Warnings' : 'Compliant'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium truncate max-w-[220px]">
                      {sellerName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {doc.uploadedAt} • ₹{grandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No invoice records found.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={onExportCsv}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV Report</span>
              </button>

              <button
                onClick={onClearHistory}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

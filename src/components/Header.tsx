import React from 'react';
import { FileText, ShieldCheck, Cpu, Code2, History, Sparkles, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  rawJsonMode: boolean;
  setRawJsonMode: (val: boolean) => void;
  processedCount: number;
  onOpenHistory: () => void;
  onExportBatchCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rawJsonMode,
  setRawJsonMode,
  processedCount,
  onOpenHistory,
  onExportBatchCsv
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  PCS Enterprise Invoice Intelligence AI
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> GST 2026 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Indian Tax Invoices • OCR-Free Extraction • GST Audit • Multimodal Multi-Page AI
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* AI Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Gemini 3.6 Flash Active</span>
            </div>

            {/* Raw JSON Toggle */}
            <button
              onClick={() => setRawJsonMode(!rawJsonMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                rawJsonMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80'
              }`}
              title="Toggle Strict Raw JSON Output Mode"
            >
              <Code2 className="w-4 h-4" />
              <span>{rawJsonMode ? 'Strict Raw JSON' : 'Interactive UI'}</span>
            </button>

            {/* History Drawer Trigger */}
            <button
              onClick={onOpenHistory}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>History</span>
              {processedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  {processedCount}
                </span>
              )}
            </button>

            {/* Export CSV Button */}
            {processedCount > 0 && (
              <button
                onClick={onExportBatchCsv}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
                title="Export all processed invoices as CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

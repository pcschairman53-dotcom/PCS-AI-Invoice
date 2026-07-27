import React, { useState } from 'react';
import { Copy, Check, Download, Code2, FileJson, Sparkles, FileSpreadsheet } from 'lucide-react';
import { ExtractionResult } from '../types';

interface JsonViewerProps {
  data: ExtractionResult;
  onExportCsv?: () => void;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, onExportCsv }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const filename = `${data.invoice?.invoice_number || 'invoice'}_extracted.json`.replace(/[\/\\?%*:|"<>]/g, '_');
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileJson className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">
            Structured Output JSON
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            valid json
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all"
              title="Download CSV report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="relative p-4 bg-slate-950 overflow-auto font-mono text-xs text-cyan-200/90 leading-relaxed max-h-[600px] min-h-[300px]">
        <pre className="whitespace-pre-wrap break-all font-mono">
          {jsonString}
        </pre>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { Eye, FileText, ZoomIn, ZoomOut, RotateCw, Layers, ChevronLeft, ChevronRight, FileSearch } from 'lucide-react';

interface InvoiceViewerProps {
  previewUrl?: string;
  fileType?: string;
  fileName?: string;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  previewUrl,
  fileType = 'image',
  fileName = 'Document'
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const isPdf = fileType?.includes('pdf') || fileName?.endsWith('.pdf');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wider uppercase truncate max-w-[200px]">
            {fileName}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {isPdf ? 'PDF Document' : 'Image'}
          </span>
        </div>

        {/* View Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 w-10 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Rotate Document"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Document Frame */}
      <div className="flex-1 p-4 bg-slate-950 overflow-auto flex items-center justify-center min-h-[400px] max-h-[700px]">
        {previewUrl ? (
          isPdf ? (
            <object
              data={previewUrl}
              type="application/pdf"
              className="w-full h-full min-h-[500px] rounded-lg border border-slate-800"
            >
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs p-6">
                <FileSearch className="w-12 h-12 text-indigo-400 mb-3" />
                <p>PDF Preview loaded for extraction.</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 text-indigo-400 hover:underline"
                >
                  Open PDF in New Tab
                </a>
              </div>
            </object>
          ) : (
            <div
              className="transition-all duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <img
                src={previewUrl}
                alt="Uploaded Invoice"
                className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl border border-slate-800"
              />
            </div>
          )
        ) : (
          <div className="text-center text-slate-500 text-xs py-12">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p>No document loaded yet.</p>
          </div>
        )}
      </div>

    </div>
  );
};

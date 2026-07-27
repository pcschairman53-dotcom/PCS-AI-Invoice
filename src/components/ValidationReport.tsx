import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileWarning, Layers, AlertOctagon, HelpCircle } from 'lucide-react';
import { ValidationResult } from '../types';

interface ValidationReportProps {
  validation: ValidationResult;
  warnings: string[];
  confidence: number;
}

export const ValidationReport: React.FC<ValidationReportProps> = ({
  validation,
  warnings,
  confidence
}) => {
  const confidencePercent = Math.round((confidence || 0) * 100);

  const getStatusBadge = (isValid: boolean, label: string) => {
    return (
      <div className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
        isValid
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
      }`}>
        <span className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{label}</span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900">
          {isValid ? 'PASSED' : 'FLAGGED'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-md">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>GST & Accounting Audit Scorecard</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time validation of GSTIN formats, PAN numbers, tax math, CGST/SGST/IGST breakups, and duplicate entries.
          </p>
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confidence Score</div>
            <div className="text-lg font-extrabold text-cyan-400">{confidencePercent}%</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-cyan-400 border-r-cyan-400 flex items-center justify-center text-xs font-bold text-white">
            {confidencePercent}%
          </div>
        </div>
      </div>

      {/* Duplicate Invoice Banner */}
      {validation.is_duplicate_invoice && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-300">DUPLICATE INVOICE DETECTED</h4>
            <p className="mt-0.5 text-amber-200/90">
              An invoice with this exact Invoice Number has already been processed in your session history. Please verify to prevent double accounting entry.
            </p>
          </div>
        </div>
      )}

      {/* Grid of Audit Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {getStatusBadge(validation.is_gstin_seller_valid, 'Seller GSTIN Format')}
        {getStatusBadge(validation.is_gstin_buyer_valid, 'Buyer GSTIN Format')}
        {getStatusBadge(validation.is_pan_seller_valid, 'Seller PAN Check')}
        {getStatusBadge(validation.is_pan_buyer_valid, 'Buyer PAN Check')}
        {getStatusBadge(validation.is_tax_calculation_valid, 'Line Item Tax Math')}
        {getStatusBadge(validation.is_grand_total_valid, 'Grand Total Check')}
        {getStatusBadge(validation.is_gst_breakup_valid, 'GST Breakup (CGST/SGST/IGST)')}
        {getStatusBadge(!validation.is_duplicate_invoice, 'Duplicate Check')}
      </div>

      {/* Missing Mandatory Fields */}
      {validation.missing_mandatory_fields && validation.missing_mandatory_fields.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <FileWarning className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Missing Mandatory Invoice Fields ({validation.missing_mandatory_fields.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {validation.missing_mandatory_fields.map((field, idx) => (
              <span key={idx} className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings List */}
      {warnings && warnings.length > 0 ? (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Audit Warnings & Compliance Exceptions ({warnings.length})
            </h4>
          </div>
          <ul className="space-y-2">
            {warnings.map((warn, i) => (
              <li key={i} className="text-xs text-amber-200/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span className="leading-relaxed">{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Zero Audit Exceptions! Document complies with standard GST & tax accounting guidelines.</span>
        </div>
      )}

    </div>
  );
};

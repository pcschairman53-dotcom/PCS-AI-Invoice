import React from 'react';
import { ExtractionResult } from '../types';
import { Building2, UserCheck, Calendar, MapPin, Receipt, CreditCard, QrCode, Hash, Landmark, PhoneCall, Mail } from 'lucide-react';

interface InvoiceSummaryCardProps {
  data: ExtractionResult;
}

export const InvoiceSummaryCard: React.FC<InvoiceSummaryCardProps> = ({ data }) => {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(val);
  };

  const seller = data.seller || {};
  const buyer = data.buyer || {};
  const invoice = data.invoice || {};
  const summary = data.summary || {};
  const payment = data.payment || {};

  return (
    <div className="space-y-6">
      
      {/* Top Invoice Metadata Header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {data.document_type || 'GST Tax Invoice'}
              </span>
              {invoice.reverse_charge !== null && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                  invoice.reverse_charge
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  RCM: {invoice.reverse_charge ? 'YES' : 'NO'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-2 font-mono">
              #{invoice.invoice_number || 'N/A'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Date</span>
              <span className="text-slate-200 font-semibold font-mono">{invoice.invoice_date || 'N/A'}</span>
            </div>
            {invoice.due_date && (
              <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Due Date</span>
                <span className="text-slate-200 font-semibold font-mono">{invoice.due_date}</span>
              </div>
            )}
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Place of Supply</span>
              <span className="text-indigo-300 font-semibold">{invoice.place_of_supply || 'N/A'}</span>
            </div>
            {invoice.po_number && (
              <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">PO Number</span>
                <span className="text-slate-200 font-semibold font-mono">{invoice.po_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* IRN e-Invoice Bar */}
        {invoice.irn && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 break-all flex items-start gap-2">
            <QrCode className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-400 mr-2">IRN (E-Invoice Hash):</span>
              <span>{invoice.irn}</span>
            </div>
          </div>
        )}
      </div>

      {/* Seller & Buyer 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Seller Info */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Supplier / Seller Details
              </h3>
            </div>

            <h4 className="text-base font-extrabold text-white">{seller.name || 'N/A'}</h4>
            {seller.trade_name && seller.trade_name !== seller.name && (
              <p className="text-xs text-indigo-300 font-medium">Trade Name: {seller.trade_name}</p>
            )}

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {seller.address || 'Address not specified'}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">GSTIN:</span>
              <span className="text-cyan-300 font-bold">{seller.gstin || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">PAN:</span>
              <span className="text-slate-200">{seller.pan || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">State Code:</span>
              <span className="text-slate-200">{seller.state_code ? `${seller.state_code} (${seller.state || ''})` : 'N/A'}</span>
            </div>
            {seller.phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-300">{seller.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Buyer Info */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Recipient / Buyer Details
              </h3>
            </div>

            <h4 className="text-base font-extrabold text-white">{buyer.name || 'N/A'}</h4>
            {buyer.trade_name && buyer.trade_name !== buyer.name && (
              <p className="text-xs text-cyan-300 font-medium">Trade Name: {buyer.trade_name}</p>
            )}

            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {buyer.address || 'Address not specified'}
            </p>

            {buyer.shipping_address && buyer.shipping_address !== buyer.address && (
              <div className="mt-2 text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-300 block">Shipping Address:</span>
                {buyer.shipping_address}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">GSTIN:</span>
              <span className="text-cyan-300 font-bold">{buyer.gstin || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">PAN:</span>
              <span className="text-slate-200">{buyer.pan || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">State Code:</span>
              <span className="text-slate-200">{buyer.state_code ? `${buyer.state_code} (${buyer.state || ''})` : 'N/A'}</span>
            </div>
            {buyer.phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-300">{buyer.phone}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Tax & Financial Summary + Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Payment & Bank Details */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl md:col-span-1">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <Landmark className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Payment & Bank Info
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Bank Name</span>
              <span className="text-slate-200 font-semibold">{payment.bank_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Account Number</span>
              <span className="text-cyan-300 font-mono font-bold">{payment.account_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">IFSC Code</span>
              <span className="text-indigo-300 font-mono font-semibold">{payment.ifsc_code || 'N/A'}</span>
            </div>
            {payment.branch && (
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Branch</span>
                <span className="text-slate-300">{payment.branch}</span>
              </div>
            )}
            {payment.upi_id && (
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">UPI ID</span>
                <span className="text-emerald-300 font-mono">{payment.upi_id}</span>
              </div>
            )}
            {payment.payment_mode && (
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Payment Mode / Terms</span>
                <span className="text-slate-300">{payment.payment_mode} ({payment.payment_terms || 'Standard'})</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Tax & Grand Total Summary
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Taxable Value</span>
                <span className="text-slate-200 font-semibold">{formatCurrency(summary.total_taxable_value)}</span>
              </div>

              {summary.cgst_total > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Central Tax (CGST)</span>
                  <span className="text-slate-200">{formatCurrency(summary.cgst_total)}</span>
                </div>
              )}

              {summary.sgst_total > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">State Tax (SGST)</span>
                  <span className="text-slate-200">{formatCurrency(summary.sgst_total)}</span>
                </div>
              )}

              {summary.igst_total > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Integrated Tax (IGST)</span>
                  <span className="text-slate-200">{formatCurrency(summary.igst_total)}</span>
                </div>
              )}

              {summary.cess_total > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">GST Cess</span>
                  <span className="text-slate-200">{formatCurrency(summary.cess_total)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-800/60 text-cyan-300 font-semibold">
                <span>Total Tax Collected / Claimable</span>
                <span>{formatCurrency(summary.total_tax || (summary.cgst_total + summary.sgst_total + summary.igst_total + summary.cess_total))}</span>
              </div>

              {summary.freight_charges > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Freight & Handling Charges</span>
                  <span className="text-slate-200">{formatCurrency(summary.freight_charges)}</span>
                </div>
              )}

              {summary.discount_total > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-800/60 text-amber-400">
                  <span>Overall Discount</span>
                  <span>-{formatCurrency(summary.discount_total)}</span>
                </div>
              )}

              {summary.round_off !== 0 && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Round Off</span>
                  <span className="text-slate-200">{formatCurrency(summary.round_off)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-slate-700 bg-slate-950 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block">Grand Total Amount</span>
                {summary.amount_in_words && (
                  <span className="text-[11px] text-indigo-300 font-medium block mt-0.5">
                    "{summary.amount_in_words}"
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrency(summary.grand_total)}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

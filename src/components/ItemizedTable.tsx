import React from 'react';
import { InvoiceItem } from '../types';
import { Table, Hash, Package, Tag, Calculator } from 'lucide-react';

interface ItemizedTableProps {
  items: InvoiceItem[];
}

export const ItemizedTable: React.FC<ItemizedTableProps> = ({ items }) => {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Title */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Itemized Goods & Services Breakdown ({items?.length || 0})
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          HSN / SAC Code Level Itemization
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[220px]">Item Description</th>
              <th className="py-3 px-4">HSN/SAC</th>
              <th className="py-3 px-4 text-center">Qty / Unit</th>
              <th className="py-3 px-4 text-right">Rate</th>
              <th className="py-3 px-4 text-right">Taxable Val</th>
              <th className="py-3 px-4 text-right">CGST</th>
              <th className="py-3 px-4 text-right">SGST</th>
              <th className="py-3 px-4 text-right">IGST</th>
              <th className="py-3 px-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200 font-medium">
            {items && items.length > 0 ? (
              items.map((item, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-400">{item.sl_no || i + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-100">
                    <div>{item.description}</div>
                    {item.discount > 0 && (
                      <span className="text-[10px] text-amber-400">
                        Discount applied: -{formatCurrency(item.discount)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-300">{item.hsn_sac || '—'}</td>
                  <td className="py-3 px-4 text-center font-mono">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.rate)}</td>
                  <td className="py-3 px-4 text-right font-mono text-cyan-300 font-bold">
                    {formatCurrency(item.taxable_value)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {item.cgst_amount > 0 ? (
                      <div>
                        <div>{formatCurrency(item.cgst_amount)}</div>
                        <div className="text-[10px] text-slate-500">({item.cgst_rate}%)</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {item.sgst_amount > 0 ? (
                      <div>
                        <div>{formatCurrency(item.sgst_amount)}</div>
                        <div className="text-[10px] text-slate-500">({item.sgst_rate}%)</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {item.igst_amount > 0 ? (
                      <div>
                        <div>{formatCurrency(item.igst_amount)}</div>
                        <div className="text-[10px] text-slate-500">({item.igst_rate}%)</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-white">
                    {formatCurrency(item.total_amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                  No line items extracted.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

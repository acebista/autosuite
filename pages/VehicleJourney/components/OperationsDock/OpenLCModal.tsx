import React from 'react';
import { X, Landmark } from 'lucide-react';
import { Button } from '../../../../UI';

interface OpenLCModalProps {
  open: boolean; onClose: () => void;
  pis: any[];
  lcNumberVal: string; setLcNumberVal: (v: string) => void;
  lcPIIdVal: string; setLcPIIdVal: (v: string) => void;
  lcBankVal: string; setLcBankVal: (v: string) => void;
  lcBranchVal: string; setLcBranchVal: (v: string) => void;
  lcOpeningDateVal: string; setLcOpeningDateVal: (v: string) => void;
  lcAmountVal: string; setLcAmountVal: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const OpenLCModal: React.FC<OpenLCModalProps> = ({
  open, onClose, pis,
  lcNumberVal, setLcNumberVal, lcPIIdVal, setLcPIIdVal,
  lcBankVal, setLcBankVal, lcBranchVal, setLcBranchVal,
  lcOpeningDateVal, setLcOpeningDateVal, lcAmountVal, setLcAmountVal,
  onSubmit, isLoading
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm animate-fade-in" onClick={e => (e.target as HTMLElement).dataset.backdrop && onClose()}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Landmark size={16} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900">Open Letter of Credit</h3>
              <p className="text-xs text-surface-400">Link an LC to an existing PI</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-surface-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Link to PI <span className="text-red-500">*</span></label>
              <select value={lcPIIdVal} onChange={e => setLcPIIdVal(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deepal-300" required>
                <option value="">— Select PI —</option>
                {pis.filter((p: any) => !p.lc).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.piNumber} — {p.supplier}</option>
                ))}
              </select>
              {pis.length > 0 && pis.every((p: any) => !!p.lc) && (
                <p className="text-xs text-amber-600 mt-1.5 font-semibold">
                  ⚠ All existing PIs already have an LC linked. Each PI can only have 1 LC.
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1.5">LC Number <span className="text-red-500">*</span></label>
              <input type="text" value={lcNumberVal} onChange={e => setLcNumberVal(e.target.value)} placeholder="LC-XXXXX"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Bank <span className="text-red-500">*</span></label>
              <input type="text" value={lcBankVal} onChange={e => setLcBankVal(e.target.value)} placeholder="e.g. NMB"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Branch</label>
              <input type="text" value={lcBranchVal} onChange={e => setLcBranchVal(e.target.value)} placeholder="Branch"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Opening Date <span className="text-red-500">*</span></label>
              <input type="date" value={lcOpeningDateVal} onChange={e => setLcOpeningDateVal(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Amount (NPR) <span className="text-red-500">*</span></label>
              <input type="number" value={lcAmountVal} onChange={e => setLcAmountVal(e.target.value)} placeholder="0"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" required />
            </div>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            {isLoading ? 'Opening LC…' : 'Open LC'}
          </Button>
        </form>
      </div>
    </div>
  );
};

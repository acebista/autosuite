import React from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from '../../../../UI';

interface LogPIModalProps {
  open: boolean;
  onClose: () => void;
  piNumberVal: string; setPiNumberVal: (v: string) => void;
  piDateVal: string; setPiDateVal: (v: string) => void;
  piAmountVal: string; setPiAmountVal: (v: string) => void;
  piSupplierVal: string; setPiSupplierVal: (v: string) => void;
  piUnitsVal: string; setPiUnitsVal: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const LogPIModal: React.FC<LogPIModalProps> = ({
  open, onClose,
  piNumberVal, setPiNumberVal, piDateVal, setPiDateVal,
  piAmountVal, setPiAmountVal, piSupplierVal, setPiSupplierVal,
  piUnitsVal, setPiUnitsVal,
  onSubmit, isLoading
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm animate-fade-in" onClick={e => (e.target as HTMLElement).dataset.backdrop && onClose()}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-deepal-50 flex items-center justify-center">
              <FileText size={16} className="text-deepal-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900">Log Proforma Invoice</h3>
              <p className="text-xs text-surface-400">Register a new PI from supplier</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-surface-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-surface-700 mb-1.5">PI Number <span className="text-red-500">*</span></label>
              <input type="text" value={piNumberVal} onChange={e => setPiNumberVal(e.target.value)} placeholder="PI-2025-001"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Issue Date <span className="text-red-500">*</span></label>
              <input type="date" value={piDateVal} onChange={e => setPiDateVal(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Units</label>
              <input type="number" min="1" value={piUnitsVal} onChange={e => setPiUnitsVal(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Total Amount (NPR) <span className="text-red-500">*</span></label>
              <input type="number" value={piAmountVal} onChange={e => setPiAmountVal(e.target.value)} placeholder="0"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Supplier</label>
              <input type="text" value={piSupplierVal} onChange={e => setPiSupplierVal(e.target.value)} placeholder="MAW"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" />
            </div>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            {isLoading ? 'Logging…' : 'Log PI'}
          </Button>
        </form>
      </div>
    </div>
  );
};

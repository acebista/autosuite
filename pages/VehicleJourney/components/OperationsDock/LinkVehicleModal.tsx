import React from 'react';
import { X, Car } from 'lucide-react';
import { Button } from '../../../../UI';

interface LinkVehicleModalProps {
  open: boolean; onClose: () => void;
  pis: any[];
  activeCatalog: any[];
  vModelVal: string; setVModelVal: (v: string) => void;
  vVariantVal: string; setVVariantVal: (v: string) => void;
  vColorVal: string; setVColorVal: (v: string) => void;
  vPriceVal: string; setVPriceVal: (v: string) => void;
  vCostVal: string; setVCostVal: (v: string) => void;
  vVinVal: string; setVVinVal: (v: string) => void;
  vEngineNoVal: string; setVEngineNoVal: (v: string) => void;
  vRegistrationNoVal: string; setVRegistrationNoVal: (v: string) => void;
  vPIIdVal: string; setVPIIdVal: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const LinkVehicleModal: React.FC<LinkVehicleModalProps> = ({
  open, onClose, pis, activeCatalog,
  vModelVal, setVModelVal, vVariantVal, setVVariantVal,
  vColorVal, setVColorVal, vPriceVal, setVPriceVal,
  vCostVal, setVCostVal, vVinVal, setVVinVal,
  vEngineNoVal, setVEngineNoVal, vRegistrationNoVal, setVRegistrationNoVal,
  vPIIdVal, setVPIIdVal,
  onSubmit, isLoading
}) => {
  if (!open) return null;

  const selectedCatalogItem = activeCatalog.find((c: any) => c.model === vModelVal && c.variant === vVariantVal);
  const availableVariants = activeCatalog.filter((c: any) => c.model === vModelVal).map((c: any) => c.variant);
  const availableColors = selectedCatalogItem?.availableColors?.map((c: any) => c.color) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-lg mx-4 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Car size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900">Link Vehicle to PI</h3>
              <p className="text-xs text-surface-400">Add a physical unit to a Proforma Invoice</p>
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
              <select value={vPIIdVal} onChange={e => setVPIIdVal(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deepal-300" required>
                <option value="">— Select PI —</option>
                {pis.map((p: any) => <option key={p.id} value={p.id}>{p.piNumber} — {p.linkedVehicleCount ?? '?'}/{p.units ?? '?'} units</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Model <span className="text-red-500">*</span></label>
              <select value={vModelVal} onChange={e => { setVModelVal(e.target.value); setVVariantVal(''); setVColorVal(''); }}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deepal-300" required>
                <option value="">— Model —</option>
                {[...new Set(activeCatalog.map((c: any) => c.model))].map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Variant <span className="text-red-500">*</span></label>
              <select value={vVariantVal} onChange={e => { setVVariantVal(e.target.value); setVColorVal(''); }}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deepal-300" required>
                <option value="">— Variant —</option>
                {availableVariants.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Color</label>
              <select value={vColorVal} onChange={e => setVColorVal(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deepal-300">
                <option value="">— Color —</option>
                {availableColors.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">VIN / Chassis No. <span className="text-red-500">*</span></label>
              <input type="text" value={vVinVal} onChange={e => setVVinVal(e.target.value)} placeholder="MA3XXXXX"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Engine / Motor No.</label>
              <input type="text" value={vEngineNoVal} onChange={e => setVEngineNoVal(e.target.value)} placeholder="ENG-XXXXX"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Registration / Plate No.</label>
              <input type="text" value={vRegistrationNoVal} onChange={e => setVRegistrationNoVal(e.target.value)} placeholder="BA 1 JA 1234 (Optional)"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Retail Price (NPR)</label>
              <input type="number" value={vPriceVal} onChange={e => setVPriceVal(e.target.value)} placeholder={selectedCatalogItem?.price || '0'}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Cost Price (NPR)</label>
              <input type="number" value={vCostVal} onChange={e => setVCostVal(e.target.value)} placeholder="0"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" />
            </div>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            {isLoading ? 'Linking…' : 'Link Vehicle to PI'}
          </Button>
        </form>
      </div>
    </div>
  );
};

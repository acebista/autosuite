import React from 'react';
import { X, BookMarked } from 'lucide-react';
import { Button } from '../../../../UI';

interface CreateBookingModalProps {
  open: boolean; onClose: () => void;
  customers: any[];
  leads: any[];
  activeCatalog: any[];
  existCustId: string; setExistCustId: (v: string) => void;
  bookModel: string; setBookModel: (v: string) => void;
  bookColor: string; setBookColor: (v: string) => void;
  bookAmount: string; setBookAmount: (v: string) => void;
  bookPrice: string; setBookPrice: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  open, onClose, customers, leads, activeCatalog,
  existCustId, setExistCustId, bookModel, setBookModel,
  bookColor, setBookColor, bookAmount, setBookAmount, bookPrice, setBookPrice,
  onSubmit, isLoading
}) => {
  if (!open) return null;

  const selectedCatalogItem = activeCatalog.find((c: any) => c.model === bookModel);
  const availableColors = selectedCatalogItem?.availableColors?.map((c: any) => c.color) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <BookMarked size={16} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900">Create New Booking</h3>
              <p className="text-xs text-surface-400">Log a customer vehicle booking</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-surface-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1.5">Customer / Lead <span className="text-red-500">*</span></label>
            <select value={existCustId} onChange={e => setExistCustId(e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deepal-300" required>
              <option value="">— Select Customer or Lead —</option>
              {customers.length > 0 && (
                <optgroup label="Existing Customers">
                  {customers.map((c: any) => <option key={c.id} value={`CUST-${c.id}`}>{c.name} — {c.phone}</option>)}
                </optgroup>
              )}
              {leads.length > 0 && (
                <optgroup label="Leads (will be converted)">
                  {leads.filter((l: any) => l.status !== 'Booked' && l.status !== 'Lost').map((l: any) => (
                    <option key={l.id} value={`LEAD-${l.id}`}>{l.name} — {l.phone} ({l.status})</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Preferred Model</label>
              <select value={bookModel} onChange={e => { setBookModel(e.target.value); setBookColor(''); }}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deepal-300">
                <option value="">— Any —</option>
                {[...new Set(activeCatalog.map((c: any) => c.model))].map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Preferred Color</label>
              <select value={bookColor} onChange={e => setBookColor(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deepal-300">
                <option value="">— Any —</option>
                {availableColors.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Booking Deposit (NPR)</label>
              <input type="number" value={bookAmount} onChange={e => setBookAmount(e.target.value)} placeholder="0"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-700 mb-1.5">Agreed Sale Price (NPR)</label>
              <input type="number" value={bookPrice} onChange={e => setBookPrice(e.target.value)} placeholder="0"
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300" />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
            {isLoading ? 'Creating…' : 'Create Booking'}
          </Button>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { Package } from 'lucide-react';
import { TrackerCard } from './TrackerCard';

interface TrackerViewProps {
  cards: any[];
  onInspect: (card: any) => void;
  onQuickApproveToStock: (card: any) => void;
  onQuickReadyForDelivery: (card: any) => void;
  isActionLoading?: boolean;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  cards, onInspect, onQuickApproveToStock, onQuickReadyForDelivery, isActionLoading
}) => {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center">
          <Package size={32} className="text-surface-300" />
        </div>
        <p className="text-surface-500 font-semibold text-lg">No vehicles found</p>
        <p className="text-surface-400 text-sm">Try adjusting your search or filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map(card => (
        <TrackerCard
          key={card.id}
          card={card}
          onInspect={onInspect}
          onQuickApproveToStock={onQuickApproveToStock}
          onQuickReadyForDelivery={onQuickReadyForDelivery}
          isActionLoading={isActionLoading}
        />
      ))}
    </div>
  );
};

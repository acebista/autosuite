import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  title: string;
  states: string[];
  cards: any[];
  module: 'PROCUREMENT' | 'SALES' | 'FNI' | 'STOCK';
  onInspect: (card: any) => void;
  onQuickApproveToStock: (card: any) => void;
  onQuickReadyForDelivery: (card: any) => void;
  isActionLoading?: boolean;
}

const HEADER_STYLES: Record<string, string> = {
  PROCUREMENT: 'bg-gradient-to-r from-deepal-500 to-deepal-700 text-white',
  SALES: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
  FNI: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  STOCK: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
};

const COUNT_BUBBLE: Record<string, string> = {
  PROCUREMENT: 'bg-white/25 text-white',
  SALES: 'bg-white/25 text-white',
  FNI: 'bg-white/25 text-white',
  STOCK: 'bg-white/25 text-white',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title, states, cards, module,
  onInspect, onQuickApproveToStock, onQuickReadyForDelivery, isActionLoading
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Group cards by their specific sub-state within this column
  const grouped = states.map(state => ({
    state,
    cards: cards.filter(c => c.state === state)
  })).filter(g => g.cards.length > 0);

  const totalCards = cards.length;

  return (
    <div className="flex flex-col rounded-2xl bg-surface-50 border border-surface-200 overflow-hidden min-w-[260px]">
      {/* Sticky header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className={`flex items-center justify-between px-4 py-3 ${HEADER_STYLES[module]} text-left sticky top-0 z-10 transition-all`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{title}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${COUNT_BUBBLE[module]}`}>
            {totalCards}
          </span>
        </div>
        {collapsed ? <ChevronDown size={14} className="opacity-70" /> : <ChevronUp size={14} className="opacity-70" />}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-3 max-h-[70vh]">
          {totalCards === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-surface-400">
              <div className="w-10 h-10 rounded-xl bg-surface-200 flex items-center justify-center">
                <span className="text-lg">—</span>
              </div>
              <p className="text-xs font-semibold">No vehicles here</p>
            </div>
          ) : (
            grouped.map(({ state, cards: groupCards }) => (
              <div key={state}>
                {grouped.length > 1 && (
                  <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider px-1 mb-1">
                    {state.replace(/_/g, ' ')} ({groupCards.length})
                  </p>
                )}
                <div className="space-y-2">
                  {groupCards.map(card => (
                    <KanbanCard
                      key={card.id}
                      card={card}
                      onInspect={onInspect}
                      onQuickApproveToStock={onQuickApproveToStock}
                      onQuickReadyForDelivery={onQuickReadyForDelivery}
                      isActionLoading={isActionLoading}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { KanbanColumn } from './KanbanColumn';

const COLUMNS = [
  {
    title: 'Procurement',
    module: 'PROCUREMENT' as const,
    states: ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'],
  },
  {
    title: 'In Stock',
    module: 'STOCK' as const,
    states: ['IN_STOCK'],
  },
  {
    title: 'Sales Desk',
    module: 'SALES' as const,
    states: ['BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED'],
  },
  {
    title: 'F&I / Compliance',
    module: 'FNI' as const,
    states: ['INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'],
  },
];

interface KanbanViewProps {
  cards: any[];
  onInspect: (card: any) => void;
  onQuickApproveToStock: (card: any) => void;
  onQuickReadyForDelivery: (card: any) => void;
  isActionLoading?: boolean;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  cards, onInspect, onQuickApproveToStock, onQuickReadyForDelivery, isActionLoading
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
      {COLUMNS.map(col => (
        <div key={col.title} className="flex-1 min-w-[270px]">
          <KanbanColumn
            title={col.title}
            module={col.module}
            states={col.states}
            cards={cards.filter(c => col.states.includes(c.state))}
            onInspect={onInspect}
            onQuickApproveToStock={onQuickApproveToStock}
            onQuickReadyForDelivery={onQuickReadyForDelivery}
            isActionLoading={isActionLoading}
          />
        </div>
      ))}
    </div>
  );
};

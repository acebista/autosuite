import React from 'react';
import { Search, LayoutList, Columns3, ChevronDown, Briefcase, ShoppingCart, ShieldCheck } from 'lucide-react';
import { Button } from '../../../../UI';

export type ViewMode = 'tracker' | 'kanban';
export type RolePreset = 'ALL' | 'PROCUREMENT' | 'SALES' | 'COMPLIANCE';

const FILTER_STATES = [
  { value: 'ALL', label: 'All States' },
  { value: 'PO_ISSUED', label: 'PO Issued' },
  { value: 'LC_OPENED', label: 'LC Opened' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'ALLOCATED', label: 'Allocated' },
  { value: 'PAYMENT_STRUCTURED', label: 'Payment Structured' },
  { value: 'READY_FOR_DELIVERY', label: 'Ready for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'INSURANCE_ACTIVATION', label: 'Insurance Activation' },
  { value: 'BANK_ALLOTMENT', label: 'Bank Allotment' },
  { value: 'DOTM_REGISTRATION', label: 'DoTM Registration' },
  { value: 'INSURANCE_ENDORSEMENT', label: 'Insurance Endorsement' },
  { value: 'BANK_DISBURSEMENT', label: 'Bank Disbursement' },
];

const ROLE_PRESETS = [
  { value: 'ALL', label: 'All Roles', icon: Briefcase },
  { value: 'PROCUREMENT', label: 'Procurement', icon: Briefcase },
  { value: 'SALES', label: 'Sales Desk', icon: ShoppingCart },
  { value: 'COMPLIANCE', label: 'Compliance', icon: ShieldCheck },
];

interface JourneyControlsProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterState: string;
  setFilterState: (v: string) => void;
  rolePreset: RolePreset;
  setRolePreset: (v: RolePreset) => void;
  totalCount: number;
  filteredCount: number;
}

export const JourneyControls: React.FC<JourneyControlsProps> = ({
  viewMode, setViewMode,
  searchQuery, setSearchQuery,
  filterState, setFilterState,
  rolePreset, setRolePreset,
  totalCount, filteredCount
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* View Mode Toggle */}
      <div className="flex items-center bg-surface-100 rounded-xl p-1 border border-surface-200">
        <button
          onClick={() => setViewMode('tracker')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            viewMode === 'tracker'
              ? 'bg-white text-deepal-600 shadow-sm border border-surface-200'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <LayoutList size={15} />
          <span>Tracker</span>
        </button>
        <button
          onClick={() => setViewMode('kanban')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            viewMode === 'kanban'
              ? 'bg-white text-deepal-600 shadow-sm border border-surface-200'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <Columns3 size={15} />
          <span>Kanban</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex-1 min-w-[220px] relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search model, VIN, customer, PI No…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-deepal-300 focus:border-deepal-400 transition"
        />
      </div>

      {/* State Filter */}
      <div className="relative">
        <select
          value={filterState}
          onChange={e => setFilterState(e.target.value)}
          className="appearance-none pl-3.5 pr-9 py-2.5 text-sm bg-white border border-surface-200 rounded-xl text-surface-700 font-semibold focus:outline-none focus:ring-2 focus:ring-deepal-300 cursor-pointer"
        >
          {FILTER_STATES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
      </div>

      {/* Role Preset */}
      <div className="flex items-center bg-surface-50 rounded-xl p-1 border border-surface-200 gap-1">
        {ROLE_PRESETS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setRolePreset(value as RolePreset)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              rolePreset === value
                ? 'bg-deepal-500 text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Count badge */}
      <div className="text-xs text-surface-500 font-semibold ml-auto whitespace-nowrap">
        {filteredCount < totalCount
          ? <span><span className="text-deepal-600">{filteredCount}</span> of {totalCount} vehicles</span>
          : <span className="text-surface-600">{totalCount} vehicles</span>
        }
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { BottleneckInfo } from '../../hooks/useBottleneck';
import { ActionFormFactory } from './ActionFormFactory';

interface LeftActionPanelProps {
  selectedItem: any;
  bottleneck: BottleneckInfo;
  forms: any;
  deals: any[];
  vehicles: any[];
  pis: any[];
}

// ─── Zone B: Blocker Card ───────────────────────────────────────────────────
const BlockerCard: React.FC<{
  blocker: BottleneckInfo['blockers'][0];
  forms: any;
}> = ({ blocker, forms }) => {
  const isCritical = blocker.urgency === 'critical';

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
      isCritical
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className={`mt-0.5 flex-shrink-0 p-1 rounded-lg ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
        {isCritical
          ? <AlertCircle size={14} className="text-red-500" />
          : <AlertTriangle size={14} className="text-amber-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>
          {isCritical ? '🚨 Blocker' : '⚠️ Warning'}
        </p>
        <p className={`text-xs mt-0.5 ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
          {blocker.label}
        </p>
        {blocker.fixField === 'registrationNo' && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Enter plate no. e.g. BA 1 JA 1234"
              value={forms.registrationNo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => forms.setRegistrationNo(e.target.value)}
              className="flex-1 text-xs border border-amber-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono"
            />
            <span className="text-[10px] text-surface-400 font-semibold whitespace-nowrap">Auto-saved</span>
          </div>
        )}
        {blocker.fixField === 'insuranceNo' && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Enter policy no. e.g. INS-2025-XXXX"
              value={forms.insuranceNo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => forms.setInsuranceNo(e.target.value)}
              className="flex-1 text-xs border border-amber-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono"
            />
            <span className="text-[10px] text-surface-400 font-semibold whitespace-nowrap">Auto-saved</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Zone A: Golden Path Action Tile ────────────────────────────────────────
const URGENCY_HEADER_STYLE: Record<'normal' | 'warning' | 'critical', string> = {
  normal: 'from-deepal-900 via-deepal-800 to-deepal-900',
  warning: 'from-amber-900 via-amber-800 to-surface-900',
  critical: 'from-red-900 via-red-800 to-surface-900',
};

const URGENCY_STEP_PILL: Record<'normal' | 'warning' | 'critical', string> = {
  normal: 'bg-white/10 text-white/70 border-white/10',
  warning: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
  critical: 'bg-red-400/20 text-red-300 border-red-400/30',
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const LeftActionPanel: React.FC<LeftActionPanelProps> = ({
  selectedItem, bottleneck, forms, deals, vehicles, pis
}) => {
  const isTerminal = selectedItem.state === 'BANK_DISBURSEMENT';

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">

      {/* ─── Zone A: Golden Path Action Tile ─────────────────────────── */}
      <div
        key={selectedItem.state}
        className="rounded-2xl overflow-hidden border border-surface-900/20 shadow-2xl animate-fade-in-up"
      >
        {/* Dark gradient header */}
        <div className={`bg-gradient-to-r ${URGENCY_HEADER_STYLE[bottleneck.urgency]} px-5 py-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{bottleneck.emoji}</span>
              <div>
                <p className="text-white font-bold text-[15px] leading-snug">{bottleneck.title}</p>
                <p className="text-white/50 text-[11px] mt-1 leading-relaxed max-w-[280px]">
                  {bottleneck.description}
                </p>
              </div>
            </div>
            {bottleneck.stepNumber > 0 && (
              <div className={`flex-shrink-0 border rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${URGENCY_STEP_PILL[bottleneck.urgency]}`}>
                {bottleneck.stepNumber}/{bottleneck.totalSteps}
              </div>
            )}
          </div>

          {/* Urgency pill */}
          {bottleneck.urgency !== 'normal' && (
            <div className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
              bottleneck.urgency === 'critical' ? 'text-red-300' : 'text-amber-300'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {bottleneck.urgency === 'critical' ? 'Action required immediately' : 'SLA approaching — action needed'}
            </div>
          )}
        </div>

        {/* White form content area — morphs with state via key */}
        <div className="bg-white px-5 py-5 transition-all duration-500">
          {isTerminal ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-base font-bold text-surface-800">Deal Fully Closed</p>
              <p className="text-sm text-surface-500 max-w-[240px] leading-relaxed">
                All milestones achieved. Bank disbursement confirmed. Congratulations!
              </p>
            </div>
          ) : (
            <ActionFormFactory
              selectedItem={selectedItem}
              deals={deals}
              vehicles={vehicles}
              forms={forms}
            />
          )}
        </div>
      </div>

      {/* ─── Zone B: Single Most Urgent Blocker ──────────────────────── */}
      {bottleneck.blockers.length > 0 && (
        <div className="animate-fade-in">
          {bottleneck.blockers.map(blocker => (
            <BlockerCard key={blocker.id} blocker={blocker} forms={forms} />
          ))}
        </div>
      )}
    </div>
  );
};

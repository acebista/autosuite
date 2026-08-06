import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { BottleneckInfo } from '../../hooks/useBottleneck';
import { ActionFormFactory } from './ActionFormFactory';
import { StageEvidenceLog } from './StageEvidenceLog';

interface LeftActionPanelProps {
  selectedItem: any;
  bottleneck: BottleneckInfo;
  forms: any;
  deals: any[];
  vehicles: any[];
  pis: any[];
}

// ─── Zone B: Blocker Card ────────────────────────────────────────────────────
const BlockerCard: React.FC<{
  blocker: BottleneckInfo['blockers'][0];
  forms: any;
}> = ({ blocker, forms }) => {
  const isCritical = blocker.urgency === 'critical';

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
      isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-xl ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
        {isCritical
          ? <AlertCircle size={16} className="text-red-500" />
          : <AlertTriangle size={16} className="text-amber-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>
          {isCritical ? '🚨 Blocker' : '⚠️ Warning'}
        </p>
        <p className={`text-sm mt-0.5 leading-snug ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
          {blocker.label}
        </p>

        {/* Fix input — large touch target */}
        {blocker.fixField === 'registrationNo' && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Plate no. e.g. BA 1 JA 1234"
              value={forms.registrationNo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => forms.setRegistrationNo(e.target.value)}
              className={`w-full text-sm border rounded-xl px-3 py-3 bg-white focus:outline-none focus:ring-2 font-mono ${
                isCritical
                  ? 'border-red-300 focus:ring-red-300'
                  : 'border-amber-300 focus:ring-amber-300'
              }`}
            />
            <p className="text-[10px] text-surface-400 font-semibold mt-1">Auto-saved on blur</p>
          </div>
        )}
        {blocker.fixField === 'insuranceNo' && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Policy no. e.g. INS-2025-XXXX"
              value={forms.insuranceNo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => forms.setInsuranceNo(e.target.value)}
              className={`w-full text-sm border rounded-xl px-3 py-3 bg-white focus:outline-none focus:ring-2 font-mono ${
                isCritical
                  ? 'border-red-300 focus:ring-red-300'
                  : 'border-amber-300 focus:ring-amber-300'
              }`}
            />
            <p className="text-[10px] text-surface-400 font-semibold mt-1">Auto-saved on blur</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Urgency styles for the action tile header ────────────────────────────────
const URGENCY_HEADER_STYLE: Record<'normal' | 'warning' | 'critical', string> = {
  normal:   'from-deepal-900 via-deepal-800 to-deepal-900',
  warning:  'from-amber-900 via-amber-800 to-surface-900',
  critical: 'from-red-900 via-red-800 to-surface-900',
};

const URGENCY_STEP_PILL: Record<'normal' | 'warning' | 'critical', string> = {
  normal:   'bg-white/10 text-white/70 border-white/10',
  warning:  'bg-amber-400/20 text-amber-300 border-amber-400/30',
  critical: 'bg-red-400/20 text-red-300 border-red-400/30',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const LeftActionPanel: React.FC<LeftActionPanelProps> = ({
  selectedItem, bottleneck, forms, deals, vehicles, pis
}) => {
  const isTerminal = selectedItem.state === 'BANK_DISBURSEMENT';

  return (
    // No h-full / overflow-y-auto here — parent scroll container handles it
    <div className="flex flex-col gap-4 pb-6">

      {/* ─── Zone A: Golden Path Action Tile ─────────────────────────── */}
      <div
        key={selectedItem.state}
        className="rounded-2xl overflow-hidden border border-surface-900/20 shadow-xl animate-fade-in-up"
      >
        {/* Dark gradient header */}
        <div className={`bg-gradient-to-r ${URGENCY_HEADER_STYLE[bottleneck.urgency]} px-4 py-4 lg:px-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5 flex-shrink-0">{bottleneck.emoji}</span>
              <div>
                <p className="text-white font-bold text-base leading-snug">{bottleneck.title}</p>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">
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

          {bottleneck.urgency !== 'normal' && (
            <div className={`mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
              bottleneck.urgency === 'critical' ? 'text-red-300' : 'text-amber-300'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {bottleneck.urgency === 'critical'
                ? 'Action required immediately'
                : 'SLA approaching — action needed'}
            </div>
          )}
        </div>

        {/* White form area */}
        <div className="bg-white px-4 py-5 lg:px-5">
          {isTerminal ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
              <p className="text-base font-bold text-surface-800">Deal Fully Closed</p>
              <p className="text-sm text-surface-500 max-w-[260px] leading-relaxed">
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

      {/* ─── Zone B: Blockers ──────────────────────────────────────────── */}
      {bottleneck.blockers.length > 0 && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {bottleneck.blockers.map(blocker => (
            <BlockerCard key={blocker.id} blocker={blocker} forms={forms} />
          ))}
        </div>
      )}

      {/* ─── Zone C: Completed Stages Proof Vault ───────────────────────── */}
      <StageEvidenceLog selectedItem={selectedItem} pis={pis} />
    </div>
  );
};

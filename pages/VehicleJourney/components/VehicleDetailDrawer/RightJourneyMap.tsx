import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Clock, User } from 'lucide-react';
import { useDealSteps } from '../../../../api';
import { STATE_METADATA } from '../../../../lib/stateMachine';
import { BottleneckInfo } from '../../hooks/useBottleneck';

interface RightJourneyMapProps {
  selectedItem: any;
  pis: any[];
  bottleneck: BottleneckInfo;
}

// ─── Subway Map ──────────────────────────────────────────────────────────────
const SUBWAY_ROW_1 = [
  { id: 'PO_ISSUED', abbr: 'PO' },
  { id: 'LC_OPENED', abbr: 'LC' },
  { id: 'IN_TRANSIT', abbr: 'TR' },
  { id: 'RECEIVED', abbr: 'RC' },
  { id: 'IN_STOCK', abbr: 'ST' },
  { id: 'BOOKED', abbr: 'BK' },
  { id: 'ALLOCATED', abbr: 'AL' },
  { id: 'PAYMENT_STRUCTURED', abbr: 'PS' },
];
const SUBWAY_ROW_2 = [
  { id: 'BANK_ALLOTMENT', abbr: 'BA' },
  { id: 'READY_FOR_DELIVERY', abbr: 'RD' },
  { id: 'DELIVERED', abbr: 'DL' },
  { id: 'INSURANCE_ACTIVATION', abbr: 'IA' },
  { id: 'DOTM_REGISTRATION', abbr: 'DT' },
  { id: 'INSURANCE_ENDORSEMENT', abbr: 'IE' },
  { id: 'BANK_DISBURSEMENT', abbr: 'BD' },
];

const STATE_ORDER = [
  'PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK',
  'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED',
  'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION',
  'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT',
];

function nodeStatus(nodeId: string, activeId: string): 'complete' | 'active' | 'pending' {
  const ai = STATE_ORDER.indexOf(activeId);
  const ni = STATE_ORDER.indexOf(nodeId);
  if (ni < ai) return 'complete';
  if (ni === ai) return 'active';
  return 'pending';
}

const SubwayRow: React.FC<{ nodes: typeof SUBWAY_ROW_1; activeState: string }> = ({ nodes, activeState }) => (
  <div className="flex items-start">
    {nodes.map((node, i) => {
      const status = nodeStatus(node.id, activeState);
      return (
        <div key={node.id} className="flex items-start">
          {/* Node */}
          <div className="flex flex-col items-center gap-1">
            {status === 'active' ? (
              <span className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-deepal-400 opacity-50" />
                <span className="relative w-4 h-4 rounded-full bg-deepal-500 border-2 border-deepal-300 shadow-lg" />
              </span>
            ) : status === 'complete' ? (
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400 shadow-sm" />
            ) : (
              <span className="w-3 h-3 rounded-full border-2 border-surface-300 bg-surface-50" />
            )}
            <span className={`text-[8px] font-bold uppercase ${
              status === 'active' ? 'text-deepal-600' :
              status === 'complete' ? 'text-emerald-600' : 'text-surface-300'
            }`}>
              {node.abbr}
            </span>
          </div>
          {/* Connector */}
          {i < nodes.length - 1 && (
            <div className={`h-0.5 w-5 mt-[5.5px] mx-0.5 rounded-full transition-colors ${
              nodeStatus(nodes[i + 1].id, activeState) === 'pending' && status !== 'active'
                ? 'bg-surface-200'
                : status === 'complete'
                ? 'bg-emerald-400'
                : 'bg-gradient-to-r from-deepal-400 to-surface-200'
            }`} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Evidence Summary ────────────────────────────────────────────────────────
interface EvidenceField { label: string; value: string | null; isPending?: boolean; }

function buildEvidence(selectedItem: any, pis: any[]): EvidenceField[] {
  const deal = selectedItem.rawDeal || {};
  const vehicle = selectedItem.rawVehicle || {};
  const pi = pis.find((p: any) => p.id === vehicle.piId);
  const fields: EvidenceField[] = [];

  // Always show key reference numbers available
  if (pi?.piNumber) fields.push({ label: 'PI No.', value: pi.piNumber });
  if (pi?.lc?.lcNumber) fields.push({ label: 'LC No.', value: pi.lc.lcNumber });
  if (vehicle.grnNumber) fields.push({ label: 'GRN', value: vehicle.grnNumber });
  if (vehicle.motorNo) fields.push({ label: 'Engine No.', value: vehicle.motorNo });
  if (deal.salePrice) fields.push({ label: 'Sale Price', value: `NPR ${Number(deal.salePrice).toLocaleString()}` });
  if (deal.paymentType) fields.push({ label: 'Payment Mode', value: deal.paymentType === 'FINANCED' ? '🏦 Bank Finance' : '💵 Full Cash' });
  if (deal.bankName) fields.push({ label: 'Bank', value: deal.bankName });
  if (deal.approvedLoan) fields.push({ label: 'Loan Amount', value: `NPR ${Number(deal.approvedLoan).toLocaleString()}` });
  if (deal.insurancePolicyNo) {
    fields.push({
      label: 'Insurance Policy',
      value: deal.insurancePolicyNo === 'PENDING_EMAIL_SENT' ? 'Pending' : deal.insurancePolicyNo,
      isPending: deal.insurancePolicyNo === 'PENDING_EMAIL_SENT',
    });
  }
  const regNo = selectedItem.registrationNo || deal.registrationNo || vehicle.registrationNo || vehicle.registration_no;
  if (regNo) {
    fields.push({ label: 'Plate No.', value: regNo });
  } else {
    fields.push({ label: 'Plate No.', value: '⚠️ Missing', isPending: true });
  }

  if (deal.disbursementAmount) fields.push({ label: 'Disbursement', value: `NPR ${Number(deal.disbursementAmount).toLocaleString()}` });

  return fields;
}

// ─── Audit Trail ─────────────────────────────────────────────────────────────
const DOT_COLOR: Record<string, string> = {
  PO_ISSUED: 'bg-deepal-500', LC_OPENED: 'bg-indigo-500', IN_TRANSIT: 'bg-orange-500',
  RECEIVED: 'bg-teal-500', IN_STOCK: 'bg-emerald-500', BOOKED: 'bg-pink-500',
  ALLOCATED: 'bg-purple-500', PAYMENT_STRUCTURED: 'bg-cyan-500', BANK_ALLOTMENT: 'bg-sky-500',
  READY_FOR_DELIVERY: 'bg-green-500', DELIVERED: 'bg-emerald-600', INSURANCE_ACTIVATION: 'bg-violet-500',
  DOTM_REGISTRATION: 'bg-amber-500', INSURANCE_ENDORSEMENT: 'bg-indigo-600', BANK_DISBURSEMENT: 'bg-rose-500',
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const RightJourneyMap: React.FC<RightJourneyMapProps> = ({ selectedItem, pis, bottleneck }) => {
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const { data: steps = [], isLoading: stepsLoading } = useDealSteps(selectedItem.id);
  const evidenceFields = buildEvidence(selectedItem, pis);
  const visibleFields = showAllEvidence ? evidenceFields : evidenceFields.slice(0, 4);
  const lastSteps = [...steps].reverse().slice(0, 3);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">

      {/* Section 1: Subway Map */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-4">
        <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-3">Journey Map</p>
        <div className="space-y-3">
          <SubwayRow nodes={SUBWAY_ROW_1} activeState={selectedItem.state} />
          {/* Row 1 → Row 2 connector */}
          <div className="flex items-center gap-1.5 pl-[30px]">
            <div className="h-4 w-0.5 bg-surface-200 rounded-full ml-[1px]" />
            <div className="h-0.5 flex-1 bg-surface-100 rounded-full" />
          </div>
          <SubwayRow nodes={SUBWAY_ROW_2} activeState={selectedItem.state} />
        </div>

        {/* Progress label */}
        <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between">
          <span className="text-[10px] text-surface-400 font-semibold">
            {STATE_METADATA[selectedItem.state as keyof typeof STATE_METADATA]?.label ?? selectedItem.state.replace(/_/g, ' ')}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-deepal-500 rounded-full transition-all duration-700"
                style={{ width: `${bottleneck.healthScore}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-deepal-600">{bottleneck.healthScore}%</span>
          </div>
        </div>
      </div>

      {/* Section 2: Evidence Summary */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-4 flex-1">
        <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider mb-3">Evidence Summary</p>
        {evidenceFields.length === 0 ? (
          <p className="text-xs text-surface-400 italic">No evidence recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {visibleFields.map(f => (
              <div key={f.label} className="flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-semibold text-surface-400 flex-shrink-0 uppercase tracking-wider">
                  {f.label}
                </span>
                <span className={`text-[11px] font-mono text-right truncate max-w-[140px] ${
                  f.isPending ? 'text-amber-600 font-bold' : 'text-surface-700 font-semibold'
                }`}>
                  {f.value}
                </span>
              </div>
            ))}
            {evidenceFields.length > 4 && (
              <button
                onClick={() => setShowAllEvidence(v => !v)}
                className="flex items-center gap-1 text-[10px] font-bold text-deepal-500 hover:text-deepal-700 transition-colors mt-1"
              >
                {showAllEvidence ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {showAllEvidence ? 'Collapse' : `Show ${evidenceFields.length - 4} more fields`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Compact Audit Trail */}
      <div className="bg-surface-950 rounded-2xl border border-surface-800 p-4">
        <p className="text-[9px] font-bold text-surface-500 uppercase tracking-wider mb-3">⏱ Audit Trail</p>
        {stepsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-2">
                <div className="w-2 h-2 mt-1 bg-surface-700 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-surface-800 rounded w-4/5" />
                  <div className="h-1.5 bg-surface-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : lastSteps.length === 0 ? (
          <p className="text-[10px] text-surface-600 italic font-mono">No transitions recorded.</p>
        ) : (
          <div className="space-y-3">
            {lastSteps.map((step: any, i: number) => {
              const dot = DOT_COLOR[step.toState] || 'bg-surface-600';
              return (
                <div key={step.id || i} className="flex gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${dot} flex-shrink-0 mt-1 shadow-sm`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-mono text-surface-500">
                        {step.fromState?.slice(0, 4)}
                      </span>
                      <ArrowRight size={8} className="text-surface-600 flex-shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-surface-300">
                        {step.toState?.replace(/_/g, '_').slice(0, 12)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {step.performedBy && (
                        <span className="flex items-center gap-0.5 text-[9px] text-surface-600">
                          <User size={7} />{step.performedBy}
                        </span>
                      )}
                      {step.createdAt && (
                        <span className="flex items-center gap-0.5 text-[9px] text-surface-600">
                          <Clock size={7} />
                          {new Date(step.createdAt).toLocaleString('en-GB', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    {step.notes && (
                      <p className="text-[9px] text-surface-600 mt-0.5 font-mono leading-tight line-clamp-1">
                        "{step.notes}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

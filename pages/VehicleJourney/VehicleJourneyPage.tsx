import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, AlertCircle, Circle,
  FileText, User, Clock, ChevronRight, Zap, Shield,
  ChevronDown, ChevronUp, Upload, Loader2, Printer, X,
} from 'lucide-react';
import { DocumentsVault } from '../../components/DocumentsVault';
import { ToastProvider, useToast } from '../../UI';
import { useVehicleJourneyData } from './hooks/useVehicleJourneyData';
import { useActionForms } from './hooks/useActionForms';
import { useBottleneck } from './hooks/useBottleneck';
import { LeftActionPanel } from './components/VehicleDetailDrawer/LeftActionPanel';
import { ComplianceAuditTrail } from './components/VehicleDetailDrawer/ComplianceAuditTrail';
import { STATE_EVIDENCE_MAP, getMissingEvidenceLabels, EvidenceConfig } from './components/VehicleDetailDrawer/EvidenceUploadZone';
import { uploadToR2, buildR2Path, resolveR2Url } from '../../services/r2Upload';
import { STATE_METADATA } from '../../lib/stateMachine';

// ─── All stages in order ────────────────────────────────────────────────────
const ALL_STAGES = [
  { id: 'PO_ISSUED',            label: 'PO Issued',            group: 'Procurement' },
  { id: 'LC_OPENED',            label: 'LC Opened',            group: 'Procurement' },
  { id: 'IN_TRANSIT',           label: 'In Transit',           group: 'Procurement' },
  { id: 'RECEIVED',             label: 'Received (GRN)',       group: 'Procurement' },
  { id: 'IN_STOCK',             label: 'In Stock',             group: 'Stock'        },
  { id: 'BOOKED',               label: 'Booked',               group: 'Sales'        },
  { id: 'ALLOCATED',            label: 'Allocated',            group: 'Sales'        },
  { id: 'PAYMENT_STRUCTURED',   label: 'Payment Structured',   group: 'Finance'      },
  { id: 'BANK_ALLOTMENT',       label: 'Bank Allotment',       group: 'Finance'      },
  { id: 'READY_FOR_DELIVERY',   label: 'Ready for Delivery',   group: 'Delivery'     },
  { id: 'DELIVERED',            label: 'Delivered',            group: 'Delivery'     },
  { id: 'INSURANCE_ACTIVATION', label: 'Insurance Active',     group: 'Compliance'   },
  { id: 'DOTM_REGISTRATION',    label: 'DoTM Registration',    group: 'Compliance'   },
  { id: 'INSURANCE_ENDORSEMENT',label: 'Endorsement',          group: 'Compliance'   },
  { id: 'BANK_DISBURSEMENT',    label: 'Bank Disbursement',    group: 'Compliance'   },
];

const GROUP_COLORS: Record<string, string> = {
  Procurement: 'text-blue-400',
  Stock:       'text-teal-400',
  Sales:       'text-purple-400',
  Finance:     'text-amber-400',
  Delivery:    'text-green-400',
  Compliance:  'text-rose-400',
};

const STAGE_DOT: Record<string, string> = {
  PO_ISSUED: 'bg-deepal-500', LC_OPENED: 'bg-indigo-500', IN_TRANSIT: 'bg-orange-500',
  RECEIVED: 'bg-teal-500', IN_STOCK: 'bg-emerald-500', BOOKED: 'bg-pink-500',
  ALLOCATED: 'bg-purple-500', PAYMENT_STRUCTURED: 'bg-cyan-500', BANK_ALLOTMENT: 'bg-sky-500',
  READY_FOR_DELIVERY: 'bg-green-500', DELIVERED: 'bg-emerald-600', INSURANCE_ACTIVATION: 'bg-violet-500',
  DOTM_REGISTRATION: 'bg-amber-500', INSURANCE_ENDORSEMENT: 'bg-indigo-600', BANK_DISBURSEMENT: 'bg-rose-500',
};

function getStageStatus(stageId: string, currentState: string): 'complete' | 'active' | 'pending' {
  const order = ALL_STAGES.map(s => s.id);
  const ci = order.indexOf(currentState);
  const si = order.indexOf(stageId);
  if (si < ci) return 'complete';
  if (si === ci) return 'active';
  return 'pending';
}

// ─── Stage Sidebar ───────────────────────────────────────────────────────────
const JourneyStageSidebar: React.FC<{
  currentState: string;
  dealId: string;
  onStageClick?: (id: string) => void;
}> = ({ currentState, dealId, onStageClick }) => {
  let lastGroup = '';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 border-b border-white/10">
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Vehicle Journey</p>
        <p className="text-xs font-bold text-white/60 mt-1">15 Stages</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {ALL_STAGES.map((stage, idx) => {
          const status = getStageStatus(stage.id, currentState);
          const missing = getMissingEvidenceLabels(stage.id, dealId);
          const hasDocs = (STATE_EVIDENCE_MAP[stage.id] || []).filter(c => c.required).length > 0;
          const isDocMissing = status !== 'pending' && hasDocs && missing.length > 0;
          const showGroupLabel = stage.group !== lastGroup;
          lastGroup = stage.group;

          return (
            <div key={stage.id}>
              {showGroupLabel && (
                <p className={`text-[8px] font-extrabold uppercase tracking-[0.15em] px-4 pt-3 pb-1 ${GROUP_COLORS[stage.group]}`}>
                  {stage.group}
                </p>
              )}
              <button
                onClick={() => onStageClick?.(stage.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all group relative ${
                  status === 'active'
                    ? 'bg-white/10 border-l-2 border-white'
                    : 'border-l-2 border-transparent hover:bg-white/5'
                }`}
              >
                {/* Step indicator */}
                <div className="relative flex-shrink-0">
                  {status === 'active' ? (
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30" />
                      <span className={`relative w-4 h-4 rounded-full ${STAGE_DOT[stage.id] || 'bg-surface-400'} shadow-lg`} />
                    </span>
                  ) : status === 'complete' ? (
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${STAGE_DOT[stage.id] || 'bg-emerald-500'}`}>
                      <CheckCircle2 size={10} className="text-white" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-white/20" />
                  )}
                </div>

                {/* Label */}
                <span className={`text-[11px] font-semibold flex-1 truncate ${
                  status === 'active' ? 'text-white' :
                  status === 'complete' ? 'text-white/70' : 'text-white/25'
                }`}>
                  {stage.label}
                </span>

                {/* Document health indicator */}
                {isDocMissing && (
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0" title={`${missing.length} missing`}>
                    <AlertCircle size={9} className="text-white" />
                  </span>
                )}
                {status !== 'pending' && hasDocs && !isDocMissing && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={9} className="text-emerald-400" />
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-white/10 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={7} className="text-emerald-400" /></span>
          <span className="text-[9px] text-white/30">Docs complete</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center"><AlertCircle size={7} className="text-white" /></span>
          <span className="text-[9px] text-white/30">Docs missing</span>
        </div>
      </div>
    </div>
  );
};

// ─── Inline Upload Row (used inside AllStagesDocHealth) ──────────────────────
const InlineDocUploadRow: React.FC<{
  cfg: EvidenceConfig;
  dealId: string;
  stageId: string;
  onUploaded: () => void;
}> = ({ cfg, dealId, stageId, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const existing = localStorage.getItem(`evidence_${dealId}_${cfg.key}`);
  const [uploaded, setUploaded] = useState(!!existing);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const path = buildR2Path('org-default', dealId, stageId, cfg.key, file);
      const r2Url = await uploadToR2(file, path);
      localStorage.setItem(`evidence_${dealId}_${cfg.key}`, r2Url);
      setUploaded(true);
      onUploaded();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 pl-6 pr-2 py-1.5 rounded-lg border ${
      uploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        uploaded ? 'bg-emerald-500' : 'bg-red-500'
      }`} />
      <span className={`text-[11px] flex-1 font-semibold ${
        uploaded ? 'text-emerald-900' : 'text-red-900'
      }`}>{cfg.label}</span>
      {uploading ? (
        <div className="flex items-center gap-1 text-[10px] text-deepal-700 font-bold">
          <Loader2 size={11} className="animate-spin" />
          Uploading…
        </div>
      ) : uploaded ? (
        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
          <CheckCircle2 size={11} /> Uploaded
        </span>
      ) : (
        <label className="flex items-center gap-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg cursor-pointer shadow-sm transition active:scale-95">
          <Upload size={10} />
          Upload
          <input
            type="file"
            accept={cfg.allowedTypes}
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </label>
      )}
    </div>
  );
};

// ─── Document Health Panel ───────────────────────────────────────────────────
const AllStagesDocHealth: React.FC<{ currentState: string; dealId: string }> = ({ currentState, dealId }) => {
  const order = ALL_STAGES.map(s => s.id);
  const currentIdx = order.indexOf(currentState);
  const completedAndActive = ALL_STAGES.slice(0, currentIdx + 1);
  const future = ALL_STAGES.slice(currentIdx + 1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [refreshTick, setRefreshTick] = useState(0);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const refresh = useCallback(() => setRefreshTick(t => t + 1), []);

  const totalMissingCount = completedAndActive.reduce((acc, stage) => {
    const configs = (STATE_EVIDENCE_MAP[stage.id] || []).filter(c => c.required);
    return acc + configs.filter(cfg => !localStorage.getItem(`evidence_${dealId}_${cfg.key}`)).length;
  }, 0);

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-100">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-deepal-600" />
          <p className="text-[10px] font-bold text-surface-700 uppercase tracking-wider">All Stages — Document Health</p>
        </div>
        {totalMissingCount > 0 ? (
          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
            {totalMissingCount} missing
          </span>
        ) : (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
            ✓ All docs complete
          </span>
        )}
      </div>

      <div className="space-y-1">
        {completedAndActive.map(stage => {
          const requiredConfigs = (STATE_EVIDENCE_MAP[stage.id] || []).filter(c => c.required);
          const missingConfigs = requiredConfigs.filter(cfg => !localStorage.getItem(`evidence_${dealId}_${cfg.key}`));
          const hasDocs = requiredConfigs.length > 0;
          const isActive = stage.id === currentState;
          const isExpanded = expanded[stage.id] ?? (missingConfigs.length > 0 && !isActive);
          const allUploaded = hasDocs && missingConfigs.length === 0;

          return (
            <div key={stage.id + refreshTick}>
              <button
                onClick={() => hasDocs ? toggle(stage.id) : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-left ${
                  isActive
                    ? 'bg-deepal-50 border border-deepal-200'
                    : missingConfigs.length > 0
                    ? 'bg-red-50/40 hover:bg-red-50/80 border border-red-100'
                    : 'hover:bg-surface-50 border border-transparent'
                } ${hasDocs ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {!hasDocs ? (
                    <Circle size={13} className="text-surface-400" />
                  ) : missingConfigs.length > 0 ? (
                    <AlertCircle size={14} className="text-red-500" />
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  )}
                </div>

                {/* Stage label */}
                <span className={`text-[12px] flex-1 ${
                  isActive ? 'font-bold text-deepal-900' :
                  missingConfigs.length > 0 ? 'font-bold text-red-800' :
                  allUploaded ? 'font-bold text-emerald-800' : 'font-semibold text-surface-700'
                }`}>
                  {stage.label}
                </span>

                {/* Badge */}
                {isActive && (
                  <span className="text-[9px] font-bold text-deepal-700 bg-deepal-100 border border-deepal-200 px-1.5 py-0.5 rounded-full">current</span>
                )}
                {missingConfigs.length > 0 && (
                  <span className="text-[9px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full">
                    {missingConfigs.length} missing
                  </span>
                )}
                {allUploaded && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">✓ done</span>
                )}

                {/* Expand chevron */}
                {hasDocs && (
                  <div className="text-surface-500 flex-shrink-0">
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </div>
                )}
              </button>

              {/* Expanded: show each document with status + upload button */}
              {hasDocs && isExpanded && (
                <div className="mt-1 mb-1.5 space-y-1">
                  {requiredConfigs.map(cfg => (
                    <InlineDocUploadRow
                      key={cfg.key}
                      cfg={cfg}
                      dealId={dealId}
                      stageId={stage.id}
                      onUploaded={refresh}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Future stages — high contrast dark text */}
        {future.length > 0 && (
          <>
            <div className="border-t border-surface-200 my-2.5" />
            <p className="text-[9px] font-bold text-surface-500 uppercase tracking-wider px-2 mb-1">Upcoming Stages</p>
            {future.map(stage => (
              <div key={stage.id} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-50">
                <Circle size={13} className="text-surface-400 flex-shrink-0" />
                <span className="text-[12px] font-semibold text-surface-700 flex-1">{stage.label}</span>
                <span className="text-[9px] font-semibold text-surface-500 bg-surface-100 border border-surface-200 px-2 py-0.5 rounded-full">upcoming</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Top HUD Bar ─────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  'arctic white': '#EFF4F8', 'pearl white': '#F5F5F0', 'white': '#F9FAFB',
  'midnight black': '#0F172A', 'black': '#111827',
  'sterling silver': '#C0C8D2', 'silver': '#D1D5DB', 'titanium': '#8B9199',
  'starlight blue': '#4A90D9', 'blue': '#2563EB', 'navy blue': '#1E3A8A',
  'racing red': '#DC2626', 'red': '#EF4444', 'burgundy': '#881337',
  'forest green': '#166534', 'green': '#22C55E',
  'orange': '#F97316', 'deep space black': '#1a1a2e', 'orange interior': '#F97316',
  'yellow': '#EAB308', 'gray': '#9CA3AF', 'charcoal': '#374151',
};
function resolveColor(name: string): string {
  const key = name?.toLowerCase() || '';
  return COLOR_MAP[key] || Object.entries(COLOR_MAP).find(([k]) => key.includes(k))?.[1] || '#6B7280';
}

const TopHUDBar: React.FC<{
  item: any;
  onBack: () => void;
  onOpenPrintVault: () => void;
  healthScore: number;
  healthColor: 'green' | 'yellow' | 'red';
  awaitingText: string;
}> = ({ item, onBack, onOpenPrintVault, healthScore, healthColor, awaitingText }) => {
  const vehicleColor = resolveColor(item.color || '');
  const BADGE = {
    green:  { bg: 'bg-emerald-500', label: 'On Track' },
    yellow: { bg: 'bg-amber-400',   label: 'SLA Risk'  },
    red:    { bg: 'bg-red-500',     label: 'Breached'  },
  }[healthColor];
  const r = 20, circ = 2 * Math.PI * r;
  const stroke = healthColor === 'green' ? '#34d399' : healthColor === 'yellow' ? '#fbbf24' : '#f87171';

  return (
    <div className="bg-gradient-to-r from-surface-950 via-deepal-950 to-surface-950 border-b border-white/5 flex items-center gap-4 px-6 py-3 flex-shrink-0">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-xs font-semibold flex-shrink-0"
      >
        <ArrowLeft size={14} />
        <span className="hidden sm:inline">Journey List</span>
      </button>

      <div className="w-px h-6 bg-white/10 flex-shrink-0" />

      {/* Vehicle identity */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {item.image ? (
          <img src={item.image} alt={item.model} className="w-14 h-9 object-cover rounded-xl border border-white/10 flex-shrink-0" />
        ) : (
          <div className="w-14 h-9 rounded-xl border border-white/10 flex-shrink-0 relative">
            <div className="w-full h-full rounded-xl" style={{ backgroundColor: vehicleColor }} />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-white font-display text-sm leading-tight truncate">
            {item.model}
            {item.variant && <span className="font-normal text-white/40 ml-1.5">{item.variant}</span>}
          </p>
          <p className="text-[10px] text-white/30 font-mono">
            {item.vin ? `VIN: ${item.vin}` : 'No VIN'}{item.color ? ` · ${item.color}` : ''}
          </p>
        </div>
      </div>

      {/* Progress ring */}
      <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="3" stroke="rgba(255,255,255,0.08)" />
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="3" stroke={stroke}
          strokeDasharray={`${circ}`} strokeDashoffset={`${circ - (healthScore / 100) * circ}`}
          strokeLinecap="round" transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
        <text x="26" y="30" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">{healthScore}%</text>
      </svg>

      {/* Status chip */}
      <div className="flex-shrink-0 text-right">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${BADGE.bg}`}>
          {BADGE.label}
        </div>
        <p className="text-[10px] text-white/40 mt-1 max-w-[160px] leading-tight truncate">{awaitingText}</p>
      </div>

      {/* Customer + price */}
      {(item.customerName || item.price) && (
        <div className="flex-shrink-0 text-right border-l border-white/10 pl-4">
          {item.customerName && (
            <div className="flex items-center gap-1.5 justify-end">
              <User size={10} className="text-purple-300" />
              <span className="text-xs font-semibold text-white/70">{item.customerName}</span>
            </div>
          )}
          {item.price && (
            <p className="text-sm font-bold text-white font-display">
              NPR {(item.price / 1e5).toFixed(1)}L
            </p>
          )}
        </div>
      )}

      {/* Live pulse */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </div>
        <span className="text-[8px] font-bold text-emerald-400/70 uppercase">Live</span>
      </div>

      {/* Print Documents Button */}
      <button
        onClick={onOpenPrintVault}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-deepal-500 hover:bg-deepal-600 active:scale-95 text-white text-xs font-bold shadow transition-all flex-shrink-0"
      >
        <Printer size={13} />
        <span className="hidden sm:inline">Print Docs</span>
      </button>
    </div>
  );
};

// ─── Inner Page ──────────────────────────────────────────────────────────────
function VehicleJourneyPageInner() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showPrintVaultModal, setShowPrintVaultModal] = useState(false);

  const journeyData = useVehicleJourneyData('', 'ALL');

  // Find the specific item by deal ID
  const selectedItem = journeyData.journeyCards.find((c: any) => c.id === dealId) || null;

  const forms = useActionForms({
    selectedItem,
    refetchAll: journeyData.refetchAll,
    deals: journeyData.deals,
    vehicles: journeyData.vehicles,
    mutations: journeyData.mutations,
    setDrawerOpen: () => {},
    onError: (msg: string) => addToast(msg, 'error'),
  });

  useEffect(() => {
    if (selectedItem) forms.populateFromCard(selectedItem);
  }, [selectedItem?.id]);

  const bottleneck = useBottleneck(selectedItem);

  if (journeyData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-deepal-100 flex items-center justify-center animate-pulse">
            <div className="w-5 h-5 bg-deepal-400 rounded-full" />
          </div>
          <p className="text-sm text-surface-400 font-semibold">Loading journey…</p>
        </div>
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="text-center">
          <p className="text-base font-bold text-surface-700">Journey not found</p>
          <p className="text-sm text-surface-400 mt-1">Deal ID: {dealId}</p>
          <button
            onClick={() => navigate('/vehicle-journey')}
            className="mt-4 px-4 py-2 bg-deepal-500 text-white rounded-xl text-sm font-bold"
          >
            Back to Journey List
          </button>
        </div>
      </div>
    );
  }

  const linkedPI = journeyData.pis.find((p: any) => p.id === selectedItem.rawVehicle?.piId);

  return (
    <div className="flex flex-col h-screen bg-surface-100 overflow-hidden">

      {/* ── Top HUD Bar ──────────────────────────────────────────────── */}
      <TopHUDBar
        item={selectedItem}
        onBack={() => navigate('/vehicle-journey')}
        onOpenPrintVault={() => setShowPrintVaultModal(true)}
        healthScore={bottleneck.healthScore}
        healthColor={bottleneck.healthColor}
        awaitingText={bottleneck.awaitingText}
      />

      {/* ── 3-Column Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: Stage Sidebar ─────────────────────────────────────── */}
        <aside className="w-56 xl:w-64 flex-shrink-0 bg-gradient-to-b from-surface-950 to-deepal-950 overflow-hidden border-r border-white/5">
          <JourneyStageSidebar
            currentState={selectedItem.state}
            dealId={selectedItem.id}
          />
        </aside>

        {/* CENTER: Action Form + Documents ─────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-surface-50 px-6 py-6">
          {/* Stage title banner */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">Current Stage</span>
                <ChevronRight size={10} className="text-surface-300" />
                <span className="text-[9px] font-bold text-deepal-500 uppercase tracking-widest">
                  {STATE_METADATA[selectedItem.state as keyof typeof STATE_METADATA]?.label ?? selectedItem.state.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-surface-900 font-display mt-1">
                {bottleneck.title}
              </h2>
              <p className="text-sm text-surface-500 mt-0.5 max-w-xl">{bottleneck.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-surface-500 bg-white border border-surface-200 px-3 py-1.5 rounded-xl">
                <Zap size={12} className="text-amber-400" />
                Step {bottleneck.stepNumber}/{bottleneck.totalSteps}
              </div>
            </div>
          </div>

          {/* Main action panel — reuses existing component */}
          <LeftActionPanel
            selectedItem={selectedItem}
            bottleneck={bottleneck}
            forms={forms}
            deals={journeyData.deals}
            vehicles={journeyData.vehicles}
            pis={journeyData.pis}
          />
        </main>

        {/* RIGHT: Document Health + Audit Trail ───────────────────── */}
        <aside className="w-80 xl:w-96 flex-shrink-0 bg-white border-l border-surface-200 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4">

            {/* All-stages document health */}
            <AllStagesDocHealth
              currentState={selectedItem.state}
              dealId={selectedItem.id}
            />

            {/* Print Document Vault Card */}
            <div className="bg-gradient-to-br from-deepal-950 via-surface-900 to-deepal-900 rounded-2xl p-4 text-white shadow-md border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Printer size={15} className="text-deepal-400" />
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white">Print Document Vault</h4>
                </div>
                <span className="text-[9px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-mono">Official Letterhead</span>
              </div>
              <p className="text-[11px] text-white/60 mb-3 leading-relaxed">
                Generate printable official PDFs: Booking Receipt, Allotment Letter, DoTM Form, Insurance Request & Gate Pass.
              </p>
              <button
                onClick={() => setShowPrintVaultModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-deepal-500 hover:bg-deepal-600 text-white text-xs font-bold shadow transition active:scale-95"
              >
                <Printer size={13} />
                Open Print Vault
              </button>
            </div>

            {/* Audit Trail — full expanded version */}
            <div className="bg-surface-950 rounded-2xl border border-surface-800 overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-[9px] font-bold text-surface-500 uppercase tracking-wider">⏱ Full Audit Trail</p>
              </div>
              <ComplianceAuditTrail entityId={selectedItem.id} />
            </div>

          </div>
        </aside>
      </div>

      {/* ── Print Document Vault Modal ───────────────────────────────── */}
      {showPrintVaultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 animate-fade-in p-4"
          onClick={() => setShowPrintVaultModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-elevated w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in border border-surface-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-deepal-50 flex items-center justify-center border border-deepal-100">
                  <Printer size={20} className="text-deepal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-900 font-display">Print Document Vault</h3>
                  <p className="text-xs text-surface-500">Official letterhead templates for {selectedItem.model}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintVaultModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-200 flex items-center justify-center transition-colors text-surface-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              <DocumentsVault
                selectedItem={selectedItem}
                pi={linkedPI}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────
const VehicleJourneyPage: React.FC = () => (
  <ToastProvider>
    <VehicleJourneyPageInner />
  </ToastProvider>
);

export default VehicleJourneyPage;

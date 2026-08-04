import React from 'react';
import { X, User } from 'lucide-react';
import { BottleneckInfo } from '../../hooks/useBottleneck';
import { STATE_METADATA } from '../../../../lib/stateMachine';

interface HealthHUDBarProps {
  selectedItem: any;
  bottleneck: BottleneckInfo;
  onClose: () => void;
}

const COLOR_MAP: Record<string, string> = {
  'arctic white': '#EFF4F8', 'pearl white': '#F5F5F0', 'white': '#F9FAFB',
  'midnight black': '#0F172A', 'black': '#111827',
  'sterling silver': '#C0C8D2', 'silver': '#D1D5DB', 'titanium': '#8B9199',
  'starlight blue': '#4A90D9', 'blue': '#2563EB', 'navy blue': '#1E3A8A',
  'racing red': '#DC2626', 'red': '#EF4444', 'burgundy': '#881337',
  'forest green': '#166534', 'green': '#22C55E',
  'orange': '#F97316', 'yellow': '#EAB308',
  'gray': '#9CA3AF', 'charcoal': '#374151',
};

function resolveColor(colorName: string): string {
  const key = colorName?.toLowerCase() || '';
  return COLOR_MAP[key] || Object.entries(COLOR_MAP).find(([k]) => key.includes(k))?.[1] || '#6B7280';
}

const HEALTH_BADGE: Record<'green' | 'yellow' | 'red', { bg: string; label: string }> = {
  green:  { bg: 'bg-emerald-500', label: 'On Track' },
  yellow: { bg: 'bg-amber-400',   label: 'SLA Risk'  },
  red:    { bg: 'bg-red-500',     label: 'Breached'  },
};

// Desktop-only SVG ring
const HealthRing: React.FC<{ score: number; color: 'green' | 'yellow' | 'red' }> = ({ score, color }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const stroke = color === 'green' ? '#34d399' : color === 'yellow' ? '#fbbf24' : '#f87171';
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" className="flex-shrink-0 hidden lg:block">
      <circle cx="23" cy="23" r={r} fill="none" strokeWidth="3" stroke="rgba(255,255,255,0.08)" />
      <circle cx="23" cy="23" r={r} fill="none" strokeWidth="3" stroke={stroke}
        strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`}
        strokeLinecap="round" transform="rotate(-90 23 23)"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text x="23" y="27" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">{score}%</text>
    </svg>
  );
};

export const HealthHUDBar: React.FC<HealthHUDBarProps> = ({ selectedItem, bottleneck, onClose }) => {
  const vehicleColor = resolveColor(selectedItem.color || '');
  const badge = HEALTH_BADGE[bottleneck.healthColor];

  return (
    <div className="flex-shrink-0 bg-gradient-to-r from-surface-950 via-deepal-950 to-surface-950 border-b border-white/5">

      {/* ── MOBILE layout ─────────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Row 1: close left, model center, badge right */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 active:bg-white/20 flex-shrink-0"
          >
            <X size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-base leading-tight truncate font-display">
              {selectedItem.model}
              {selectedItem.variant && (
                <span className="font-normal text-white/40 ml-1.5 text-sm">{selectedItem.variant}</span>
              )}
            </p>
            <p className="text-[11px] text-white/40 truncate mt-0.5">
              {selectedItem.color}{selectedItem.color && selectedItem.vin ? ' · ' : ''}
              {selectedItem.vin ? `VIN …${selectedItem.vin.slice(-8)}` : ''}
            </p>
          </div>

          {/* Color swatch */}
          <div
            className="w-8 h-8 rounded-xl border-2 border-white/20 flex-shrink-0 shadow-inner"
            style={{ backgroundColor: vehicleColor }}
          />
        </div>

        {/* Row 2: progress bar + status */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${badge.bg}`} />
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">{badge.label}</span>
            </div>
            {selectedItem.customerName && (
              <span className="text-[11px] text-white/50 flex items-center gap-1 truncate max-w-[160px]">
                <User size={10} className="text-white/30 flex-shrink-0" />
                {selectedItem.customerName}
                {selectedItem.price && (
                  <span className="font-bold text-white/70 ml-1">
                    NPR {(selectedItem.price / 1e5).toFixed(1)}L
                  </span>
                )}
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${bottleneck.healthScore}%`,
                backgroundColor: badge.bg.replace('bg-', '') === 'emerald-500' ? '#10b981'
                  : badge.bg.includes('amber') ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <p className="text-[10px] text-white/35 mt-1 truncate">{bottleneck.awaitingText}</p>
        </div>
      </div>

      {/* ── DESKTOP layout (unchanged) ────────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-4 px-5 py-3.5">
        {/* LEFT: Vehicle identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 relative">
            {selectedItem.image ? (
              <img src={selectedItem.image} alt={selectedItem.model}
                className="w-14 h-10 object-cover rounded-xl border border-white/10" />
            ) : (
              <div className="w-14 h-10 rounded-xl border border-white/10 shadow-inner"
                style={{ backgroundColor: vehicleColor }} />
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-950 shadow"
              style={{ backgroundColor: vehicleColor }} title={selectedItem.color} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white font-display text-base leading-tight truncate">
              {selectedItem.model}
              {selectedItem.variant && (
                <span className="font-normal text-white/50 ml-1.5 text-sm">{selectedItem.variant}</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-white/35 tracking-wide">
                {selectedItem.vin ? `VIN: ${selectedItem.vin.slice(-10)}` : 'No VIN'}
              </span>
              {selectedItem.color && (
                <span className="text-[10px] text-white/35 font-medium">{selectedItem.color}</span>
              )}
            </div>
          </div>
        </div>

        {/* CENTER: Health ring + status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <HealthRing score={bottleneck.healthScore} color={bottleneck.healthColor} />
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${badge.bg}`}>
              {badge.label}
            </div>
            <p className="text-[11px] text-white/50 mt-1 max-w-[180px] leading-tight">{bottleneck.awaitingText}</p>
          </div>
        </div>

        {/* RIGHT: Customer + price + close */}
        <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
          <div className="text-right">
            {selectedItem.customerName && (
              <div className="flex items-center gap-1.5 justify-end">
                <div className="w-4 h-4 rounded-full bg-purple-500/30 flex items-center justify-center">
                  <User size={8} className="text-purple-300" />
                </div>
                <span className="text-xs font-semibold text-white/70">{selectedItem.customerName}</span>
              </div>
            )}
            {selectedItem.price && (
              <p className="text-sm font-bold text-white mt-0.5 font-display">
                NPR {(selectedItem.price / 1e5).toFixed(1)}L
              </p>
            )}
          </div>
          {/* Live pulse */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[8px] font-bold text-emerald-400/70 uppercase tracking-wider">Live</span>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 flex items-center justify-center text-white/40 hover:text-white/80 transition-all duration-200"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

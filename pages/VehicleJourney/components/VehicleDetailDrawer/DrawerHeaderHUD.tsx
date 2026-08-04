import React from 'react';
import { X, User } from 'lucide-react';
import { BottleneckInfo } from '../../hooks/useBottleneck';
import { STATE_METADATA } from '../../../../lib/stateMachine';

interface HealthHUDBarProps {
  selectedItem: any;
  bottleneck: BottleneckInfo;
  onClose: () => void;
}

// Compact SVG progress ring
const HealthRing: React.FC<{ score: number; color: 'green' | 'yellow' | 'red' }> = ({ score, color }) => {
  const r = 20;
  const circ = 2 * Math.PI * r; // ≈ 125.7
  const offset = circ - (score / 100) * circ;
  const stroke = color === 'green' ? '#34d399' : color === 'yellow' ? '#fbbf24' : '#f87171';

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
      {/* Track */}
      <circle cx="26" cy="26" r={r} fill="none" strokeWidth="3.5" stroke="rgba(255,255,255,0.08)" />
      {/* Progress */}
      <circle
        cx="26" cy="26" r={r}
        fill="none" strokeWidth="3.5" stroke={stroke}
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text x="26" y="31" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
        {score}%
      </text>
    </svg>
  );
};

// Derives a CSS-compatible background for the vehicle's color name
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

const HEALTH_BADGE: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
  yellow: 'bg-amber-400/20 text-amber-300 border-amber-400/30 animate-pulse',
  red: 'bg-red-400/20 text-red-300 border-red-400/30 animate-pulse',
};

const HEALTH_LABEL: Record<'green' | 'yellow' | 'red', string> = {
  green: '✦ On Track',
  yellow: '⚡ SLA Risk',
  red: '🔥 Breached',
};

export const HealthHUDBar: React.FC<HealthHUDBarProps> = ({ selectedItem, bottleneck, onClose }) => {
  const vehicleColor = resolveColor(selectedItem.color || '');
  const meta = STATE_METADATA[selectedItem.state as keyof typeof STATE_METADATA];

  return (
    <div className="flex-shrink-0 bg-gradient-to-r from-surface-950 via-deepal-950 to-surface-950 border-b border-white/5">
      <div className="flex items-center gap-4 px-5 py-3.5">

        {/* LEFT: Vehicle identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Color swatch + model thumbnail */}
          <div className="flex-shrink-0 relative">
            {selectedItem.image ? (
              <img
                src={selectedItem.image}
                alt={selectedItem.model}
                className="w-14 h-10 object-cover rounded-xl border border-white/10"
              />
            ) : (
              <div
                className="w-14 h-10 rounded-xl border border-white/10 shadow-inner"
                style={{ backgroundColor: vehicleColor }}
              />
            )}
            {/* Color dot */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-950 shadow"
              style={{ backgroundColor: vehicleColor }}
              title={selectedItem.color}
            />
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
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${HEALTH_BADGE[bottleneck.healthColor]}`}>
              {HEALTH_LABEL[bottleneck.healthColor]}
            </div>
            <p className="text-[11px] text-white/50 mt-1 max-w-[180px] leading-tight">
              {bottleneck.awaitingText}
            </p>
          </div>
        </div>

        {/* RIGHT: Customer + price + live + close */}
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
                NPR {((selectedItem.price) / 1e5).toFixed(1)}L
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

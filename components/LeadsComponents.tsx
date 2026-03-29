
import React, { useState } from 'react';
import {
  Search, Filter, Plus, Phone, MessageCircle, MoreHorizontal,
  User, Calendar, X, Send, Sparkles, LayoutList, Kanban as KanbanIcon,
  ChevronDown, ArrowRight, Clock, CheckCircle2, AlertCircle, FileText, Smartphone
} from 'lucide-react';
import { LeadStatus, LeadFilters, LeadExtended, Activity, LeadViewMode } from '../types';
import { Button, Modal, Badge } from './Common';

// --- 2.1 LeadFiltersBar ---
interface LeadFiltersBarProps {
  value: LeadFilters;
  owners: { id: string; name: string }[];
  sources: string[];
  onChange: (next: LeadFilters) => void;
  onClear: () => void;
}

export const LeadFiltersBar: React.FC<LeadFiltersBarProps> = ({ value, owners, sources, onChange, onClear }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Search Name, Phone..."
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Status */}
      <div className="relative min-w-[140px]">
        <select
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value as any })}
          className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 text-slate-600 bg-white appearance-none"
        >
          <option value="All">All Statuses</option>
          {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
      </div>

      {/* Source */}
      <div className="relative min-w-[140px]">
        <select
          value={value.source}
          onChange={(e) => onChange({ ...value, source: e.target.value })}
          className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 text-slate-600 bg-white appearance-none"
        >
          <option value="All">All Sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
      </div>

      {/* Owner */}
      <div className="relative min-w-[140px]">
        <select
          value={value.ownerId}
          onChange={(e) => onChange({ ...value, ownerId: e.target.value })}
          className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 text-slate-600 bg-white appearance-none"
        >
          <option value="All">All Owners</option>
          {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
      </div>

      {/* Score */}
      <div className="relative min-w-[140px]">
        <select
          value={value.scoreBucket}
          onChange={(e) => onChange({ ...value, scoreBucket: e.target.value as any })}
          className="w-full border border-slate-300 rounded-lg text-sm px-3 py-2 text-slate-600 bg-white appearance-none"
        >
          <option value="All">All Scores</option>
          <option value="HOT">HOT (&gt;80%)</option>
          <option value="WARM">WARM (40-79%)</option>
          <option value="COLD">COLD (&lt;40%)</option>
        </select>
        <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
      </div>

      <button onClick={onClear} className="text-sm text-slate-500 hover:text-red-600 px-2">
        Clear
      </button>
    </div>
  );
};

// --- 2.2 LeadAssignDropdown ---
interface LeadAssignDropdownProps {
  leadId: string;
  currentOwnerId: string | null;
  owners: { id: string; name: string; avatarColor?: string }[];
  disabled?: boolean;
  onChangeOwner: (leadId: string, newOwnerId: string | null) => void;
}

export const LeadAssignDropdown: React.FC<LeadAssignDropdownProps> = ({ leadId, currentOwnerId, owners, disabled, onChangeOwner }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentOwner = owners.find(o => o.id === currentOwnerId);

  const handleSelect = (ownerId: string) => {
    onChangeOwner(leadId, ownerId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 rounded-full pl-1 pr-3 py-1 transition-colors"
      >
        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white ${currentOwner ? 'bg-blue-600' : 'bg-slate-300'}`}>
          {currentOwner ? currentOwner.name.charAt(0) : <User size={12} />}
        </div>
        <span className="text-slate-700 max-w-[80px] truncate">{currentOwner ? currentOwner.name.split(' ')[0] : 'Unassigned'}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full mt-1 left-0 w-48 bg-white border border-slate-200 shadow-xl rounded-lg z-20 overflow-hidden py-1 animate-fade-in">
            <div
              onClick={() => handleSelect('UNASSIGNED')}
              className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-sm text-slate-500 border-b border-slate-50"
            >
              <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center"><X size={12} /></div>
              Unassigned
            </div>
            {owners.map(owner => (
              <div key={owner.id} onClick={() => handleSelect(owner.id)} className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-sm text-slate-700">
                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{owner.name.charAt(0)}</div>
                {owner.name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- 2.3 LeadNextActionChip ---
interface LeadNextActionChipProps {
  nextActionDate: string | null;
  label?: string | null;
  showIcon?: boolean;
}

export const LeadNextActionChip: React.FC<LeadNextActionChipProps> = ({ nextActionDate, label, showIcon = true }) => {
  if (!nextActionDate) {
    return <span className="text-xs text-slate-400 italic">No follow-up set</span>;
  }

  const date = new Date(nextActionDate);
  const now = new Date();
  const isPast = date < now;
  const isSoon = date.getTime() - now.getTime() < 48 * 60 * 60 * 1000; // 48h

  // Simple formatter: "25 Oct"
  const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  let styleClass = "bg-slate-100 text-slate-600 border-slate-200";
  if (isPast) styleClass = "bg-red-50 text-red-600 border-red-200";
  else if (isSoon) styleClass = "bg-amber-50 text-amber-600 border-amber-200";

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${styleClass}`}>
      {showIcon && <Clock size={12} />}
      <span>{formattedDate}</span>
      {label && <span className="opacity-75 hidden sm:inline">• {label}</span>}
    </div>
  );
};

// --- 2.4 LeadQuickActions ---
type LeadQuickActionType = 'CALL' | 'WHATSAPP' | 'NOTE';

interface LeadQuickActionsProps {
  leadId: string;
  onAction: (leadId: string, action: LeadQuickActionType) => void;
  compact?: boolean;
}

export const LeadQuickActions: React.FC<LeadQuickActionsProps> = ({ leadId, onAction, compact }) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onAction(leadId, 'CALL'); }}
        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
        title="Log Call"
      >
        <Phone size={16} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onAction(leadId, 'WHATSAPP'); }}
        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
        title="WhatsApp"
      >
        <MessageCircle size={16} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onAction(leadId, 'NOTE'); }}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        title="Add Note"
      >
        <FileText size={16} />
      </button>
    </div>
  );
};

// --- 2.5 LeadTimeline ---
interface LeadTimelineProps {
  activities: Activity[];
}

export const LeadTimeline: React.FC<LeadTimelineProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return <div className="text-center py-8 text-slate-400 text-sm">No activity recorded yet.</div>;
  }

  // Sort by date desc
  const sorted = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getIcon = (kind: Activity['kind']) => {
    switch (kind) {
      case 'CALL': return <Phone size={14} />;
      case 'WHATSAPP': return <MessageCircle size={14} />;
      case 'NOTE': return <FileText size={14} />;
      case 'STATUS_CHANGE': return <ArrowRight size={14} />;
      case 'SYSTEM': return <AlertCircle size={14} />;
      default: return <CheckCircle2 size={14} />;
    }
  };

  const getColor = (kind: Activity['kind']) => {
    switch (kind) {
      case 'CALL': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'WHATSAPP': return 'bg-green-100 text-green-600 border-green-200';
      case 'NOTE': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'STATUS_CHANGE': return 'bg-orange-100 text-orange-600 border-orange-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:h-full before:w-0.5 before:bg-slate-100">
      {sorted.map((activity) => (
        <div key={activity.id} className="relative pl-10">
          <div className={`absolute left-0 top-0 h-8 w-8 rounded-full border-2 border-white flex items-center justify-center z-10 shadow-sm ${getColor(activity.kind)}`}>
            {getIcon(activity.kind)}
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-bold text-slate-700">{activity.title}</span>
              <span className="text-[10px] text-slate-400">
                {new Date(activity.createdAt).toLocaleDateString()} • {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {activity.description && <p className="text-sm text-slate-600">{activity.description}</p>}
            {activity.createdBy && <p className="text-[10px] text-slate-400 mt-2">by {activity.createdBy}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 2.6 LeadAIReplyModal ---
interface LeadAIReplyModalProps {
  isOpen: boolean;
  lead: LeadExtended | null;
  isGenerating: boolean;
  generatedText: string;
  onGenerate: (leadId: string) => void;
  onClose: () => void;
  onAccept: (leadId: string, message: string) => void;
}

export const LeadAIReplyModal: React.FC<LeadAIReplyModalProps> = ({ isOpen, lead, isGenerating, generatedText, onGenerate, onClose, onAccept }) => {
  if (!isOpen || !lead) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Response Generator">
      <div className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
          <p className="text-slate-500 mb-1">Context:</p>
          <p className="font-medium text-slate-800">{lead.name} interested in <span className="text-blue-600">{lead.modelInterest}</span>.</p>
          <p className="text-slate-600">Status: {lead.status} • Budget: {lead.budget}</p>
        </div>

        <div className="relative">
          <textarea
            className="w-full h-32 p-3 border border-slate-300 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="AI generated draft will appear here..."
            value={generatedText}
            readOnly={isGenerating}
          ></textarea>
          {isGenerating && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-sm rounded-xl">
              <div className="flex items-center gap-2 text-blue-600 font-medium animate-pulse">
                <Sparkles size={18} /> Generating...
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          {!generatedText ? (
            <Button onClick={() => onGenerate(lead.id)} disabled={isGenerating} icon={Sparkles}>
              Generate Draft
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onGenerate(lead.id)} disabled={isGenerating}>Regenerate</Button>
              <Button onClick={() => onAccept(lead.id, generatedText)} icon={MessageCircle}>Copy & Open WhatsApp</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

// --- 2.7 LeadViewToggle ---
interface LeadViewToggleProps {
  value: LeadViewMode;
  onChange: (mode: LeadViewMode) => void;
}

export const LeadViewToggle: React.FC<LeadViewToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex bg-white rounded-lg border border-slate-200 p-1">
      <button
        onClick={() => onChange('LIST')}
        className={`p-1.5 rounded transition-colors ${value === 'LIST' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        title="List View"
      >
        <LayoutList size={18} />
      </button>
      <button
        onClick={() => onChange('KANBAN')}
        className={`p-1.5 rounded transition-colors ${value === 'KANBAN' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        title="Kanban Board"
      >
        <KanbanIcon size={18} />
      </button>
    </div>
  );
};

// --- 2.8 LeadStatusBadge ---
interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const colors: Record<LeadStatus, string> = {
    [LeadStatus.NEW]: 'bg-blue-100 text-blue-700 border-blue-200',
    [LeadStatus.CONTACTED]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [LeadStatus.TEST_DRIVE]: 'bg-orange-100 text-orange-700 border-orange-200',
    [LeadStatus.PROPOSAL]: 'bg-purple-100 text-purple-700 border-purple-200',
    [LeadStatus.WON]: 'bg-green-100 text-green-700 border-green-200',
    [LeadStatus.LOST]: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${colors[status]} ${sizeClasses} ${className}`}>
      {status}
    </span>
  );
};

// --- 2.9 AddLeadModal ---
interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<LeadExtended>) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', source: 'Walk-in', interest: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onSave(formData);
      setLoading(false);
      setFormData({ name: '', phone: '', source: 'Walk-in', interest: '' });
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Lead">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
            <input required type="tel" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Interested Model</label>
          <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={formData.interest} onChange={e => setFormData({ ...formData, interest: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
          <select className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
            <option>Walk-in</option>
            <option>WhatsApp</option>
            <option>Facebook Ads</option>
            <option>Website</option>
            <option>Referral</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving...' : 'Create Lead'}</Button>
        </div>
      </form>
    </Modal>
  )
}

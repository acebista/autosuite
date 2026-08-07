import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Eye, Trash2, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { uploadToR2, buildR2Path, resolveR2Url } from '../../../../services/r2Upload';

export interface EvidenceConfig {
  key: string;
  label: string;
  description: string;
  required: boolean;
  allowedTypes: string; // e.g. '.pdf,.jpg,.jpeg,.png'
}

// ─── STATE EVIDENCE MAP ──────────────────────────────────────────────────────
export const STATE_EVIDENCE_MAP: Record<string, EvidenceConfig[]> = {
  PO_ISSUED: [
    { key: 'proforma_invoice', label: 'Proforma Invoice (PI)', description: 'Upload official PI PDF from manufacturer / importer', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  LC_OPENED: [
    { key: 'lc_copy', label: 'Letter of Credit (LC) Copy', description: 'Upload bank issued LC copy', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  RECEIVED: [
    { key: 'grn_document', label: 'Goods Received Note (GRN)', description: 'Upload signed GRN & yard intake report', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  IN_STOCK: [
    { key: 'grn_document', label: 'Goods Received Note (GRN)', description: 'Yard inspection & GRN proof', required: false, allowedTypes: '.pdf,.jpg,.png' }
  ],
  BOOKED: [
    { key: 'booking_slip', label: 'Booking Slip / Token Receipt', description: 'Upload signed booking slip & deposit proof', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'customer_kyc', label: 'Customer Citizenship / PAN Copy', description: 'Individual Citizenship card OR Company PAN Certificate', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'customer_photo_signature', label: 'Customer Photo & Signature Card', description: 'Passport-size photo & signature — required for Bluebook application & Bank Allotment file', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  ALLOCATED: [
    // No documents required — allocation is purely linking a vehicle to a booking
  ],
  PAYMENT_STRUCTURED: [
    { key: 'bank_do', label: 'Bank Delivery Order (DO)', description: 'Upload official DO from financing bank', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'down_payment_receipt', label: 'Down Payment Bank Deposit Slip', description: 'Upload customer margin money payment proof', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'bank_voucher_cheque', label: 'Bank Voucher / Cheque Copy', description: 'Audit proof that customer deposited minimum 20%/50% margin money before bank DO activation', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  BANK_ALLOTMENT: [
    { key: 'allotment_letter', label: 'Bank Allotment Letter', description: 'Upload signed allotment advice issued to bank', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  READY_FOR_DELIVERY: [
    { key: 'pdi_report', label: 'PDI Inspection Checklist Report', description: 'Upload signed 50-point PDI checklist', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'vat_invoice', label: 'VAT Sales Invoice (Abhibhuti / Kar Bijak)', description: 'Upload VAT invoice — required for DoTM registration & tax compliance', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'ev_charger_certificate', label: 'EV Charger Handover Certificate (EV Only)', description: 'Handover checklist for 7kW AC Home Wallbox & Portable Charger — EV models only', required: false, allowedTypes: '.pdf,.jpg,.png' }
  ],
  DELIVERED: [
    { key: 'delivery_challan', label: 'Signed Delivery Challan', description: 'Upload customer signed physical delivery receipt', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'vat_invoice', label: 'VAT Sales Invoice (Abhibhuti / Kar Bijak)', description: 'Upload VAT invoice — required for DoTM registration & tax compliance', required: false, allowedTypes: '.pdf,.jpg,.png' }
  ],
  INSURANCE_ACTIVATION: [
    { key: 'insurance_policy', label: 'Insurance Policy / Cover Note', description: 'Upload comprehensive 1st-party insurance policy', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  DOTM_REGISTRATION: [
    { key: 'bluebook_photo', label: 'DoTM Bluebook Photo / Scan', description: 'Upload photo of physical registration bluebook', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'pragyapan_patra', label: 'Customs Declaration / Pragyapan Patra', description: 'DoTM requires Customs Import Clearance copy for 1st-time vehicle registration in Nepal', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'dafa_form', label: 'Dafa / Excise Tax Form', description: 'Upload DoTM Dafa tax clearance receipt', required: false, allowedTypes: '.pdf,.jpg,.png' }
  ],
  INSURANCE_ENDORSEMENT: [
    { key: 'endorsed_insurance', label: 'Endorsed Insurance Policy', description: 'Upload policy with Bank Hire Purchase Endorsement', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  BANK_DISBURSEMENT: [
    { key: 'disbursement_advice', label: 'Bank Disbursement Advice / Payment Proof', description: 'Upload released bank loan disbursement slip', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ]
};

export function isStateEvidenceComplete(state: string, dealId: string, uploadedDocs: Record<string, string> = {}): boolean {
  const configs = STATE_EVIDENCE_MAP[state] || [];
  const requiredConfigs = configs.filter(c => c.required);
  if (requiredConfigs.length === 0) return true;

  return requiredConfigs.every(cfg => {
    const hasProp = !!uploadedDocs[cfg.key];
    const hasStorage = !!localStorage.getItem(`evidence_${dealId}_${cfg.key}`);
    return hasProp || hasStorage;
  });
}

/** Returns list of missing required evidence labels for a given state */
export function getMissingEvidenceLabels(state: string, dealId: string, uploadedDocs: Record<string, string> = {}): string[] {
  const configs = STATE_EVIDENCE_MAP[state] || [];
  return configs
    .filter(cfg => cfg.required)
    .filter(cfg => {
      const hasProp = !!uploadedDocs[cfg.key];
      const hasStorage = !!localStorage.getItem(`evidence_${dealId}_${cfg.key}`);
      return !hasProp && !hasStorage;
    })
    .map(cfg => cfg.label);
}

const STAGE_ORDER_ALL = [
  'PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK',
  'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT',
  'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION',
  'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'
];

/** Check if ALL required evidence across ALL completed journey stages is uploaded */
export function isAllJourneyEvidenceComplete(currentState: string, dealId: string): { complete: boolean; missing: Array<{ stage: string; labels: string[] }> } {
  const currentIdx = STAGE_ORDER_ALL.indexOf(currentState);
  // Include current stage in the check
  const stagesToCheck = STAGE_ORDER_ALL.slice(0, currentIdx + 1);

  const missing: Array<{ stage: string; labels: string[] }> = [];
  for (const stage of stagesToCheck) {
    const labels = getMissingEvidenceLabels(stage, dealId);
    if (labels.length > 0) {
      missing.push({ stage, labels });
    }
  }

  return { complete: missing.length === 0, missing };
}

interface EvidenceUploadZoneProps {
  state: string;
  dealId?: string;
  orgId?: string;
  uploadedDocs?: Record<string, string>; // key -> R2 URL
  onUploadSuccess?: (key: string, url: string) => void;
  readOnly?: boolean;
}

export const EvidenceUploadZone: React.FC<EvidenceUploadZoneProps> = ({
  state,
  dealId = 'deal-temp',
  orgId = 'org-default',
  uploadedDocs = {},
  onUploadSuccess,
  readOnly = false,
}) => {
  const configs = STATE_EVIDENCE_MAP[state] || [];
  const [docMap, setDocMap] = useState<Record<string, string>>(uploadedDocs);
  const [presignedMap, setPresignedMap] = useState<Record<string, string>>({});
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});

  // Sync uploadedDocs prop
  useEffect(() => {
    setDocMap(uploadedDocs);
  }, [uploadedDocs]);

  // Generate presigned view URLs for stored R2 URLs
  useEffect(() => {
    let isMounted = true;
    const loadUrls = async () => {
      const resolved: Record<string, string> = {};
      for (const [key, rawUrl] of Object.entries(docMap)) {
        const urlStr = (rawUrl as string) || '';
        if (urlStr) {
          try {
            resolved[key] = await resolveR2Url(urlStr);
          } catch {
            resolved[key] = urlStr;
          }
        }
      }
      if (isMounted) setPresignedMap(resolved);
    };
    loadUrls();
    return () => { isMounted = false; };
  }, [docMap]);

  if (configs.length === 0) return null;

  const handleFileChange = async (cfg: EvidenceConfig, file: File) => {
    setUploadingKeys(prev => ({ ...prev, [cfg.key]: true }));
    try {
      const path = buildR2Path(orgId, dealId, state, cfg.key, file);
      const r2Url = await uploadToR2(file, path);
      const viewUrl = await resolveR2Url(r2Url);

      const updated = { ...docMap, [cfg.key]: r2Url };
      setDocMap(updated);
      setPresignedMap(prev => ({ ...prev, [cfg.key]: viewUrl }));

      // Save to localStorage backup
      localStorage.setItem(`evidence_${dealId}_${cfg.key}`, r2Url);

      if (onUploadSuccess) {
        onUploadSuccess(cfg.key, r2Url);
      }
    } catch (err: any) {
      console.error('Failed to upload evidence to Cloudflare R2:', err);
      alert(`Upload failed: ${err.message || 'Error uploading file'}`);
    } finally {
      setUploadingKeys(prev => ({ ...prev, [cfg.key]: false }));
    }
  };

  const totalRequired = configs.filter(c => c.required).length;
  const uploadedRequired = configs.filter(c => c.required).filter(c => {
    return !!(docMap[c.key] || localStorage.getItem(`evidence_${dealId}_${c.key}`));
  }).length;
  const totalOptional = configs.filter(c => !c.required).length;
  const uploadedOptional = configs.filter(c => !c.required).filter(c => {
    return !!(docMap[c.key] || localStorage.getItem(`evidence_${dealId}_${c.key}`));
  }).length;
  const allRequiredDone = uploadedRequired === totalRequired;

  return (
    <div className="mt-4 pt-4 border-t border-surface-200">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-deepal-600" />
          <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider font-display">
            Step Documents
          </h4>
        </div>
        {/* Summary pill */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
          allRequiredDone
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {allRequiredDone ? (
            <><CheckCircle2 size={11} /> All required uploaded</>
          ) : (
            <><AlertCircle size={11} /> {uploadedRequired}/{totalRequired} required &bull; {totalRequired - uploadedRequired} missing</>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {configs.map(cfg => {
          const rawUrl = docMap[cfg.key] || localStorage.getItem(`evidence_${dealId}_${cfg.key}`);
          const viewUrl = presignedMap[cfg.key] || rawUrl;
          const isUploading = uploadingKeys[cfg.key];
          const hasFile = !!rawUrl;
          const isMissing = cfg.required && !hasFile;

          return (
            <div
              key={cfg.key}
              className={`rounded-2xl border transition-all ${
                hasFile
                  ? 'bg-emerald-50 border-emerald-200'
                  : isMissing
                  ? 'bg-red-50 border-red-200'
                  : 'bg-surface-50/60 border-dashed border-surface-200'
              }`}
            >
              {/* Status stripe at top */}
              {isMissing && (
                <div className="flex items-center gap-1.5 px-3.5 pt-2.5 pb-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest">Missing — Required</span>
                </div>
              )}
              {hasFile && (
                <div className="flex items-center gap-1.5 px-3.5 pt-2.5 pb-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Uploaded</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    hasFile
                      ? 'bg-emerald-100 text-emerald-600'
                      : isMissing
                      ? 'bg-red-100 text-red-500'
                      : 'bg-surface-200/70 text-surface-500'
                  }`}>
                    {hasFile ? <CheckCircle2 size={15} /> : isMissing ? <AlertCircle size={15} /> : <FileText size={15} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-xs font-bold ${
                        hasFile ? 'text-emerald-900' : isMissing ? 'text-red-900' : 'text-surface-700'
                      }`}>{cfg.label}</p>
                      {!cfg.required && (
                        <span className="text-[9px] font-semibold text-surface-400 bg-surface-200 px-1.5 py-0.5 rounded-md">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 leading-snug ${
                      isMissing ? 'text-red-400' : 'text-surface-400'
                    }`}>{cfg.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isUploading ? (
                    <div className="flex items-center gap-1.5 text-xs text-deepal-600 font-bold px-3 py-1.5 bg-deepal-50 rounded-xl">
                      <Loader2 size={13} className="animate-spin" />
                      <span>Uploading…</span>
                    </div>
                  ) : hasFile ? (
                    <div className="flex items-center gap-1.5">
                      {viewUrl && (
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </a>
                      )}
                      {!readOnly && (
                        <label className="cursor-pointer text-[11px] text-surface-400 hover:text-surface-700 bg-surface-100 hover:bg-surface-200 px-2.5 py-1.5 rounded-xl transition">
                          Replace
                          <input type="file" accept={cfg.allowedTypes} className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(cfg, f); }} />
                        </label>
                      )}
                    </div>
                  ) : !readOnly ? (
                    <label className={`flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-2 rounded-xl cursor-pointer shadow-sm transition active:scale-95 ${
                      isMissing
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-deepal-500 hover:bg-deepal-600'
                    }`}>
                      <Upload size={12} />
                      <span>Upload</span>
                      <input type="file" accept={cfg.allowedTypes} className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(cfg, f); }} />
                    </label>
                  ) : (
                    <span className="text-xs text-surface-400 italic">No document</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional docs sub-count if any */}
      {totalOptional > 0 && (
        <p className="mt-2 text-[10px] text-surface-400 text-right">
          {uploadedOptional}/{totalOptional} optional document{totalOptional > 1 ? 's' : ''} uploaded
        </p>
      )}
    </div>
  );
};

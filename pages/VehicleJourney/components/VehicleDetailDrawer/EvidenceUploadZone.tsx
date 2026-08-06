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
    { key: 'customer_kyc', label: 'Customer Citizenship / PAN Copy', description: 'Individual Citizenship card OR Company PAN Certificate', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  ALLOCATED: [
    { key: 'allocation_note', label: 'VIN Allotment Slip (Optional)', description: 'Internal stock allocation confirmation', required: false, allowedTypes: '.pdf,.jpg,.png' }
  ],
  PAYMENT_STRUCTURED: [
    { key: 'bank_do', label: 'Bank Delivery Order (DO)', description: 'Upload official DO from financing bank', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'down_payment_receipt', label: 'Down Payment Bank Deposit Slip', description: 'Upload customer margin money payment proof', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  BANK_ALLOTMENT: [
    { key: 'allotment_letter', label: 'Bank Allotment Letter', description: 'Upload signed allotment advice issued to bank', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  READY_FOR_DELIVERY: [
    { key: 'pdi_report', label: 'PDI Inspection Checklist Report', description: 'Upload signed 50-point PDI checklist', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  DELIVERED: [
    { key: 'delivery_challan', label: 'Signed Delivery Challan', description: 'Upload customer signed physical delivery receipt', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  INSURANCE_ACTIVATION: [
    { key: 'insurance_policy', label: 'Insurance Policy / Cover Note', description: 'Upload comprehensive 1st-party insurance policy', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  DOTM_REGISTRATION: [
    { key: 'bluebook_photo', label: 'DoTM Bluebook Photo / Scan', description: 'Upload photo of physical registration bluebook', required: true, allowedTypes: '.pdf,.jpg,.png' },
    { key: 'dafa_form', label: 'Dafa / Excise Tax Form (Optional)', description: 'Upload DoTM Dafa tax clearance receipt', required: false, allowedTypes: '.pdf,.jpg,.png' }
  ],
  INSURANCE_ENDORSEMENT: [
    { key: 'endorsed_insurance', label: 'Endorsed Insurance Policy', description: 'Upload policy with Bank Hire Purchase Endorsement', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ],
  BANK_DISBURSEMENT: [
    { key: 'disbursement_advice', label: 'Bank Disbursement Advice / Payment Proof', description: 'Upload released bank loan disbursement slip', required: true, allowedTypes: '.pdf,.jpg,.png' }
  ]
};

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

  return (
    <div className="mt-4 pt-4 border-t border-surface-200">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={16} className="text-deepal-600" />
        <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider font-display">
          Step Verification Evidence (Cloudflare R2)
        </h4>
      </div>

      <div className="flex flex-col gap-3">
        {configs.map(cfg => {
          const rawUrl = docMap[cfg.key] || localStorage.getItem(`evidence_${dealId}_${cfg.key}`);
          const viewUrl = presignedMap[cfg.key] || rawUrl;
          const isUploading = uploadingKeys[cfg.key];
          const hasFile = !!rawUrl;

          return (
            <div
              key={cfg.key}
              className={`p-3.5 rounded-2xl border transition-all ${
                hasFile
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : cfg.required
                  ? 'bg-surface-50 border-surface-200 hover:border-deepal-300'
                  : 'bg-surface-50/50 border-dashed border-surface-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                    hasFile ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-200/70 text-surface-600'
                  }`}>
                    {hasFile ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-surface-900">{cfg.label}</p>
                      {cfg.required ? (
                        <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md">
                          Required *
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-surface-500 bg-surface-200 px-1.5 py-0.5 rounded-md">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-surface-500 mt-0.5 leading-snug">{cfg.description}</p>
                  </div>
                </div>

                {/* Upload Action / View Link */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isUploading ? (
                    <div className="flex items-center gap-1.5 text-xs text-deepal-600 font-bold px-3 py-1.5 bg-deepal-50 rounded-xl">
                      <Loader2 size={14} className="animate-spin" />
                      <span>R2...</span>
                    </div>
                  ) : hasFile ? (
                    <div className="flex items-center gap-1">
                      {viewUrl && (
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition"
                        >
                          <Eye size={13} />
                          <span>View Proof</span>
                        </a>
                      )}
                      {!readOnly && (
                        <label className="cursor-pointer text-[11px] text-surface-500 hover:text-surface-800 underline px-1 py-1">
                          Replace
                          <input
                            type="file"
                            accept={cfg.allowedTypes}
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleFileChange(cfg, f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ) : !readOnly ? (
                    <label className="flex items-center gap-1.5 text-xs font-bold text-white bg-deepal-500 hover:bg-deepal-600 active:scale-95 px-3.5 py-2 rounded-xl cursor-pointer shadow-sm transition">
                      <Upload size={13} />
                      <span>Upload Proof</span>
                      <input
                        type="file"
                        accept={cfg.allowedTypes}
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleFileChange(cfg, f);
                        }}
                      />
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
    </div>
  );
};

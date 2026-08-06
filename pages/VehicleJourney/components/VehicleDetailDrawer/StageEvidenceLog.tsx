import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lock, Eye, FileText, ShieldCheck, FolderOpen } from 'lucide-react';
import { STATE_METADATA } from '../../../../lib/stateMachine';
import { STATE_EVIDENCE_MAP } from './EvidenceUploadZone';
import { resolveR2Url } from '../../../../services/r2Upload';

const STAGE_ORDER = [
  'PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK',
  'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT',
  'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION',
  'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'
];

interface StageEvidenceLogProps {
  selectedItem: any;
  pis: any[];
}

export const StageEvidenceLog: React.FC<StageEvidenceLogProps> = ({ selectedItem, pis }) => {
  const currentIdx = STAGE_ORDER.indexOf(selectedItem.state);
  const dealId = selectedItem.id;
  const completedStages = STAGE_ORDER.slice(0, currentIdx + 1);

  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const linkedPI = pis.find((p: any) => p.id === selectedItem.rawVehicle?.piId);

  // Scan and resolve all stored R2 URLs for completed stages
  useEffect(() => {
    let isMounted = true;
    const loadAllProofUrls = async () => {
      const urls: Record<string, string> = {};

      for (const stage of completedStages) {
        const configs = STATE_EVIDENCE_MAP[stage] || [];
        for (const cfg of configs) {
          const rawUrl = localStorage.getItem(`evidence_${dealId}_${cfg.key}`) || selectedItem.rawDeal?.[`${cfg.key}_url`];
          if (rawUrl) {
            try {
              urls[cfg.key] = await resolveR2Url(rawUrl);
            } catch {
              urls[cfg.key] = rawUrl;
            }
          }
        }
      }

      if (isMounted) setResolvedUrls(urls);
    };

    loadAllProofUrls();
    return () => { isMounted = false; };
  }, [dealId, selectedItem.state]);

  const hasAnyProof = Object.keys(resolvedUrls).length > 0 || linkedPI;

  if (completedStages.length === 0 && !hasAnyProof) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-surface-100 pb-2.5">
        <FolderOpen size={16} className="text-deepal-600" />
        <h4 className="text-xs font-bold text-surface-800 uppercase tracking-wider font-display">
          Vehicle Journey Proof Vault ({Object.keys(resolvedUrls).length} Documents)
        </h4>
      </div>

      {/* PI information at top if linked */}
      {linkedPI && (
        <div className="bg-deepal-50/70 border border-deepal-100 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Lock size={13} className="text-deepal-600" />
              <p className="text-xs font-bold text-deepal-800">Proforma Invoice & LC</p>
            </div>
            {linkedPI.lc?.lcDocumentUrl && (
              <a
                href={linkedPI.lc.lcDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-deepal-700 bg-white hover:bg-deepal-100 border border-deepal-200 px-2.5 py-1 rounded-lg transition"
              >
                <Eye size={12} />
                <span>View LC Proof</span>
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div>
              <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wide">PI Number</p>
              <p className="text-xs font-mono text-surface-700 font-bold">{linkedPI.piNumber}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wide">Issue Date</p>
              <p className="text-xs text-surface-700">{linkedPI.issueDate ? new Date(linkedPI.issueDate).toLocaleDateString() : '—'}</p>
            </div>
            {linkedPI.lc && (
              <>
                <div>
                  <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wide">LC Number</p>
                  <p className="text-xs font-mono text-surface-700 font-bold">{linkedPI.lc.lcNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wide">LC Bank</p>
                  <p className="text-xs text-surface-700">{linkedPI.lc.bankName}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Completed stage evidence cards */}
      <div className="space-y-2.5">
        {completedStages.map(stage => {
          const configs = STATE_EVIDENCE_MAP[stage] || [];
          const stageMeta = STATE_METADATA[stage as keyof typeof STATE_METADATA];

          const stageProofs = configs.map(cfg => ({
            ...cfg,
            viewUrl: resolvedUrls[cfg.key]
          })).filter(cfg => cfg.viewUrl);

          if (stageProofs.length === 0) return null;

          return (
            <div key={stage} className="bg-surface-50 border border-surface-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                <p className="text-xs font-bold text-surface-800">{stageMeta?.label ?? stage}</p>
              </div>

              <div className="flex flex-col gap-2">
                {stageProofs.map(proof => (
                  <div key={proof.key} className="flex items-center justify-between bg-white border border-surface-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-deepal-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-surface-800 truncate">{proof.label}</p>
                        <p className="text-[10px] text-surface-400 truncate">{proof.description}</p>
                      </div>
                    </div>

                    <a
                      href={proof.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition flex-shrink-0 ml-2"
                    >
                      <Eye size={12} />
                      <span>View Proof</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(resolvedUrls).length === 0 && !linkedPI && (
          <p className="text-xs text-surface-400 italic text-center py-2">No uploaded proof documents recorded yet.</p>
        )}
      </div>
    </div>
  );
};

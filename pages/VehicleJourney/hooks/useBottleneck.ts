import { useMemo } from 'react';
import { STATE_METADATA } from '../../../lib/stateMachine';

export interface Blocker {
  id: string;
  label: string;
  urgency: 'warning' | 'critical';
  fixField?: 'registrationNo' | 'insuranceNo';
}

export interface BottleneckInfo {
  title: string;
  emoji: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  urgency: 'normal' | 'warning' | 'critical';
  healthColor: 'green' | 'yellow' | 'red';
  healthScore: number;
  awaitingText: string;
  relevantDocType: 'PI' | 'LC' | 'DO' | 'GATE_PASS' | null;
  blockers: Blocker[];
}

type StateConfig = Omit<BottleneckInfo, 'healthScore' | 'awaitingText' | 'blockers' | 'healthColor' | 'urgency'>;

const STATE_CONFIG: Record<string, StateConfig & { relevantDocType: BottleneckInfo['relevantDocType'] }> = {
  PO_ISSUED: {
    title: 'Confirm Letter of Credit Opened',
    emoji: '🏦', description: 'Verify the LC has been activated by the financing bank before shipping can proceed.',
    stepNumber: 1, totalSteps: 1, relevantDocType: 'LC',
  },
  LC_OPENED: {
    title: 'Mark Vehicle as Shipped',
    emoji: '🚢', description: 'Record shipment dispatch and set the expected delivery date.',
    stepNumber: 1, totalSteps: 1, relevantDocType: 'LC',
  },
  IN_TRANSIT: {
    title: 'Log Goods Receipt Note (GRN)',
    emoji: '📋', description: 'Record physical yard receipt — engine number, chassis number, and GRN reference.',
    stepNumber: 1, totalSteps: 1, relevantDocType: 'PI',
  },
  RECEIVED: {
    title: 'Approve Yard Inspection',
    emoji: '✅', description: 'Complete PDI checklist and approve vehicle for In-Stock status.',
    stepNumber: 1, totalSteps: 1, relevantDocType: null,
  },
  IN_STOCK: {
    title: 'Allocate to Customer Booking',
    emoji: '🔗', description: 'Link this in-stock unit to a pending customer booking.',
    stepNumber: 1, totalSteps: 1, relevantDocType: null,
  },
  BOOKED: {
    title: 'Assign Physical Vehicle',
    emoji: '🚗', description: 'Select the exact in-stock unit to fulfil this customer booking.',
    stepNumber: 1, totalSteps: 1, relevantDocType: null,
  },
  ALLOCATED: {
    title: 'Structure Payment Terms',
    emoji: '💳', description: 'Finalise sale price, payment mode, and bank financing details.',
    stepNumber: 1, totalSteps: 3, relevantDocType: 'DO',
  },
  PAYMENT_STRUCTURED: {
    title: 'PDI & Delivery Preparation',
    emoji: '🔍', description: 'Complete pre-delivery inspection checklist and mark vehicle ready for handover.',
    stepNumber: 2, totalSteps: 3, relevantDocType: 'DO',
  },
  BANK_ALLOTMENT: {
    title: 'Register Vehicle at DoTM',
    emoji: '🏛️', description: 'Submit for number plate registration at the Department of Transport.',
    stepNumber: 1, totalSteps: 2, relevantDocType: null,
  },
  READY_FOR_DELIVERY: {
    title: 'Complete Customer Delivery',
    emoji: '🎉', description: 'Confirm handover form is signed, keys released, and delivery recorded.',
    stepNumber: 3, totalSteps: 3, relevantDocType: 'GATE_PASS',
  },
  DELIVERED: {
    title: 'Activate Insurance Policy',
    emoji: '🛡️', description: 'Record insurance policy number or confirm activation email was sent.',
    stepNumber: 1, totalSteps: 3, relevantDocType: null,
  },
  INSURANCE_ACTIVATION: {
    title: 'Generate Bank Allotment Letter',
    emoji: '📄', description: 'Generate and dispatch the allotment letter to the financing bank.',
    stepNumber: 2, totalSteps: 3, relevantDocType: null,
  },
  DOTM_REGISTRATION: {
    title: 'Endorse Insurance to Bank',
    emoji: '🔏', description: 'Confirm insurance policy is endorsed with bank hypothecation included.',
    stepNumber: 1, totalSteps: 2, relevantDocType: null,
  },
  INSURANCE_ENDORSEMENT: {
    title: 'Confirm Bank Disbursement',
    emoji: '💰', description: 'Verify and record the loan amount released by the financing bank.',
    stepNumber: 2, totalSteps: 2, relevantDocType: null,
  },
  BANK_DISBURSEMENT: {
    title: 'Journey Complete',
    emoji: '✅', description: 'All milestones achieved. Bank disbursement confirmed. Deal fully closed.',
    stepNumber: 0, totalSteps: 0, relevantDocType: null,
  },
};

function deriveBlockers(selectedItem: any): Blocker[] {
  if (!selectedItem) return [];
  const deal = selectedItem.rawDeal || {};
  const state = selectedItem.state;
  const all: Blocker[] = [];

  if (state === 'PAYMENT_STRUCTURED' && deal.paymentType === 'FINANCED' && !deal.deliveryOrderUrl) {
    all.push({ id: 'do_upload', label: 'Bank Delivery Order (DO) not uploaded', urgency: 'critical' });
  }
  if (state === 'INSURANCE_ACTIVATION' && deal.insurancePolicyNo === 'PENDING_EMAIL_SENT') {
    all.push({ id: 'insurance_pending', label: 'Insurance Policy # not yet received from insurer', urgency: 'warning' });
  }
  if (['BANK_ALLOTMENT', 'DOTM_REGISTRATION'].includes(state) && !deal.registrationNo) {
    all.push({ id: 'dotm_plate', label: 'DoTM registration plate not recorded', urgency: 'warning', fixField: 'registrationNo' });
  }
  if (['DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT'].includes(state) && deal.insurancePolicyNo === 'PENDING_EMAIL_SENT') {
    all.push({ id: 'insurance_policy_missing', label: 'Insurance Policy # still pending — update before endorsement', urgency: 'critical', fixField: 'insuranceNo' });
  }

  // Return only the most critical blocker
  const critical = all.find(b => b.urgency === 'critical');
  return critical ? [critical] : all.slice(0, 1);
}

function deriveHealthColor(selectedItem: any, urgency: 'normal' | 'warning' | 'critical'): 'green' | 'yellow' | 'red' {
  if (urgency === 'critical') return 'red';
  const days = selectedItem?.daysInStock ?? 0;
  if (days > 90) return 'red';
  if (urgency === 'warning' || days > 60) return 'yellow';
  return 'green';
}

function deriveUrgency(state: string, selectedItem: any): 'normal' | 'warning' | 'critical' {
  const days = selectedItem?.daysInStock ?? 0;
  if (days > 90) return 'critical';
  if (['DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT'].includes(state)) return 'critical';
  if (['DELIVERED', 'INSURANCE_ACTIVATION', 'BANK_ALLOTMENT'].includes(state) || days > 60) return 'warning';
  return 'normal';
}

export function useBottleneck(selectedItem: any): BottleneckInfo {
  return useMemo(() => {
    // Guard: return safe defaults while data is loading (selectedItem is null)
    if (!selectedItem) {
      return {
        title: 'Loading…',
        emoji: '⏳',
        description: '',
        stepNumber: 0,
        totalSteps: 0,
        urgency: 'normal',
        healthColor: 'green',
        healthScore: 0,
        awaitingText: '',
        relevantDocType: null,
        blockers: [],
      };
    }

    const state = selectedItem.state || 'IN_STOCK';
    const config = STATE_CONFIG[state] || STATE_CONFIG.IN_STOCK;
    const meta = STATE_METADATA[state as keyof typeof STATE_METADATA];
    const healthScore = meta?.progress ?? 0;
    const urgency = deriveUrgency(state, selectedItem);
    const blockers = deriveBlockers(selectedItem);
    const healthColor = deriveHealthColor(selectedItem, urgency);
    const awaitingText = `Awaiting: ${meta?.label ?? state.replace(/_/g, ' ')}`;

    return {
      ...config,
      urgency,
      healthColor,
      healthScore,
      awaitingText,
      blockers,
    };
  }, [selectedItem?.state, selectedItem?.rawDeal, selectedItem?.daysInStock]);
}


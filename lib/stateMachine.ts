import { VehicleState } from '../types';

export const VEHICLE_STATE_TRANSITIONS: Record<VehicleState, VehicleState[]> = {
  'PO_ISSUED': ['LC_OPENED'],
  'LC_OPENED': ['IN_TRANSIT'],
  'IN_TRANSIT': ['RECEIVED'],
  'RECEIVED': ['IN_STOCK'],
  'IN_STOCK': ['BOOKED'],
  'BOOKED': ['ALLOCATED'],
  'ALLOCATED': ['PAYMENT_STRUCTURED'],
  'PAYMENT_STRUCTURED': ['READY_FOR_DELIVERY', 'BANK_ALLOTMENT'],
  'BANK_ALLOTMENT': ['READY_FOR_DELIVERY'],
  'READY_FOR_DELIVERY': ['DELIVERED'],
  'DELIVERED': ['INSURANCE_ACTIVATION', 'DOTM_REGISTRATION'],
  'INSURANCE_ACTIVATION': ['DOTM_REGISTRATION'],
  'DOTM_REGISTRATION': ['INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'],
  'INSURANCE_ENDORSEMENT': ['BANK_DISBURSEMENT'],
  'BANK_DISBURSEMENT': []
};

export function canTransition(from: VehicleState, to: VehicleState): boolean {
  const allowed = VEHICLE_STATE_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function getNextStates(current: VehicleState): VehicleState[] {
  return VEHICLE_STATE_TRANSITIONS[current] || [];
}

export interface StateMetadata {
  label: string;
  module: 'PROCUREMENT' | 'SALES' | 'FNI';
  color: string;
  progress: number;
}

export const STATE_METADATA: Record<VehicleState, StateMetadata> = {
  'PO_ISSUED': { label: 'PO Issued', module: 'PROCUREMENT', color: 'blue', progress: 5 },
  'LC_OPENED': { label: 'LC Opened', module: 'PROCUREMENT', color: 'indigo', progress: 12 },
  'IN_TRANSIT': { label: 'In Transit', module: 'PROCUREMENT', color: 'orange', progress: 20 },
  'RECEIVED': { label: 'Received (GRN)', module: 'PROCUREMENT', color: 'teal', progress: 30 },
  'IN_STOCK': { label: 'In Stock', module: 'PROCUREMENT', color: 'green', progress: 40 },
  'BOOKED': { label: 'Booked', module: 'SALES', color: 'pink', progress: 45 },
  'ALLOCATED': { label: 'Allocated', module: 'SALES', color: 'purple', progress: 50 },
  'PAYMENT_STRUCTURED': { label: 'Payment Structured (DO & Deposit)', module: 'SALES', color: 'cyan', progress: 58 },
  'BANK_ALLOTMENT': { label: 'Bank Allotment', module: 'SALES', color: 'sky', progress: 62 },
  'READY_FOR_DELIVERY': { label: 'Ready for Delivery', module: 'SALES', color: 'green', progress: 68 },
  'DELIVERED': { label: 'Vehicle Delivered', module: 'SALES', color: 'emerald', progress: 75 },
  'INSURANCE_ACTIVATION': { label: 'Insurance Activated', module: 'FNI', color: 'violet', progress: 82 },
  'DOTM_REGISTRATION': { label: 'DoTM Registered', module: 'FNI', color: 'amber', progress: 88 },
  'INSURANCE_ENDORSEMENT': { label: 'Insurance Endorsed', module: 'FNI', color: 'indigo', progress: 94 },
  'BANK_DISBURSEMENT': { label: 'Bank Disbursed', module: 'FNI', color: 'rose', progress: 100 }
};

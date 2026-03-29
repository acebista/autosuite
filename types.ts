export type Role = 'SuperAdmin' | 'Admin' | 'SalesManager' | 'SalesRep' | 'ServiceAdvisor' | 'Technician' | 'Marketing' | 'Finance';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  subscription_status: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string;
  avatar?: string;
  status: 'Active' | 'Inactive';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgId: string | null;
  orgName?: string;
  orgSlug?: string;
  orgLogo?: string;
  orgAddress?: string | null;
  orgPhone?: string | null;
  orgEmail?: string | null;
  branchId: string | null;
  avatarUrl?: string;
  department?: string;
  status: 'Active' | 'Inactive';
}

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  TEST_DRIVE = 'Test Drive',
  PROPOSAL = 'Proposal Sent',
  WON = 'Won',
  LOST = 'Lost'
}

export interface Activity {
  id: string;
  entityId: string;
  entityType: 'LEAD' | 'VEHICLE' | 'JOB' | 'CUSTOMER';
  kind: 'CALL' | 'WHATSAPP' | 'NOTE' | 'STATUS_CHANGE' | 'SYSTEM' | 'AI';
  title: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

export interface ExchangeDetails {
  hasExchange: boolean;
  vehicleModel?: string;
  engineNumber?: string;
  kilometers?: number;
  expectedValue?: number;
  offeredValue?: number;
  photoUrl?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string; // New
  source: string;
  modelInterest: string;
  vehicleColor?: string; // New
  budget: number;

  // Pipeline Status
  status: string; // "Stage" from Excel (Delivered, Dropout, Cancelled)
  temperature: 'Hot' | 'Warm' | 'Cold'; // "Enquiry Status" from Excel

  // Dates
  createdAt: string;
  updatedAt: string;
  testDriveDate?: string;
  nextFollowUpDate?: string;
  bookingDate?: string;
  deliveryDate?: string;

  // Meta
  aiScore: number;
  ownerId: string | null; // Sales Representative
  branchId: string;

  // Details
  quotationIssued: boolean;
  exchange: ExchangeDetails;
  remarks?: string;

  notes: Activity[];
}

export type LeadFilters = {
  search: string;
  status: LeadStatus | 'All';
  source: string;
  ownerId: string;
  scoreBucket: 'All' | 'HOT' | 'WARM' | 'COLD';
};

export interface LeadExtended extends Lead { }
export type LeadViewMode = 'LIST' | 'KANBAN';

export interface Vehicle {
  id: string;
  model: string;
  variant: string;
  year: number;
  color: string;  // Current/default color
  vin: string;
  price: number;
  cost: number;
  status: 'In Stock' | 'Reserved' | 'Sold' | 'Transit' | 'Test Drive';
  branchId: string;
  daysInStock: number;
  fuelType: 'Petrol' | 'Diesel' | 'EV' | 'Hybrid';
  image: string;  // Current/default image
  // Available color options for this model/variant
  availableColors?: { color: string; image: string }[];
  // Dynamic Specs for Quotation Engine (e.g., Battery Capacity vs Engine CC)
  specifications?: { label: string; value: string }[];
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
}

export interface ServiceJob {
  id: string;
  customerId: string;
  customerName: string;
  vehicleModel: string;
  regNumber: string;
  type: 'Periodic' | 'Repair' | 'Warranty' | 'Bodywork';
  status: 'Queued' | 'In Progress' | 'Waiting Parts' | 'Ready' | 'Delivered';
  technicianId: string | null;
  branchId: string;
  createdAt: string;
  promisedAt: string;
  costEstimate: number;
  actualCost: number;
  isOverdue: boolean;
  notes: Activity[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  branchId: string;
  location: string;
  ltv: number;
  lastServiceAt: string | null;
  nextServiceDueAt: string | null;
  carsOwned: { model: string; plate: string; status: string }[];
  referrals: number;
}

export interface Campaign {
  id: string;
  name: string;
  channel: 'WhatsApp' | 'Facebook' | 'SMS' | 'Email';
  status: 'Active' | 'Draft' | 'Completed';
  spend: number;
  leadsGenerated: number;
  conversionRate: number;
  revenueGenerated: number;
  roi: number;
}

export interface Bank {
  id: string;
  name: string;
  branch: string;
  address: string;
}

export interface Quotation {
  id: string;
  leadId: string;
  date: string;
  validUntil: string;
  bankId?: string;
  vehicleModel: string;
  vehicleColor: string;
  price: number;
  discount: number;
  finalPrice: number;
  status: 'Draft' | 'Sent' | 'Expired';
}

export interface QuotationTemplate {
  id: string;
  dealerName: string;
  dealerLogo: string;
  dealerAddress: string;
  dealerPhone: string;
  dealerEmail: string;
  termsAndConditions: string; // HTML string
}

export interface DashboardExceptions {
  overdueFollowups: number;
  stuckLeads: number;
  agedInventory: number;
  overdueJobs: number;
  lowStockParts: number;
  pendingInvoices: number;
}

// Enterprise Modules

export interface Part {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: 'Part' | 'Fluid' | 'Accessory' | 'Consumable';
  price: number; // Selling Price
  cost: number; // Cost Price
  stock: number;
  minStockLevel: number; // Reorder point
  binLocation: string; // e.g. "Row-A-12"
  supplier: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface PartTransaction {
  id: string;
  partId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  referenceId: string; // PO Number or Job ID
  date: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'Part' | 'Labor' | 'Vehicle' | 'Fee';
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Void';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  type: 'Service' | 'Sales';
}

export interface Appointment {
  id: string;
  title: string;
  start: string; // ISO Date
  end: string;   // ISO Date
  type: 'Test Drive' | 'Service' | 'Delivery' | 'Meeting';
  resourceId?: string; // e.g., Vehicle ID or Bay ID
  customerId?: string;
  customerName?: string;
  status: 'Confirmed' | 'Pending' | 'Canceled' | 'Completed';
  notes?: string;
}

// =====================================================
// PHASE 1: TRUST & CONTROL TYPES
// =====================================================

export type GatePassType = 'test_drive' | 'delivery' | 'service_return' | 'internal_transfer';
export type GatePassStatus = 'active' | 'used' | 'expired' | 'cancelled';
export type FuelLevel = 'full' | '3/4' | '1/2' | '1/4' | 'empty';
export type VehicleCondition = 'good' | 'minor_damage' | 'major_damage';

export interface GatePass {
  id: string;
  passCode: string;
  qrData: string;

  // Vehicle
  vehicleId: string;
  vehicleModel: string;
  vehicleRegNumber?: string;
  vehicleVin?: string;

  // Customer/Lead
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  leadId?: string;

  // Pass details
  passType: GatePassType;
  purpose?: string;

  // Authorization
  issuedBy: string;
  issuedAt: string;
  validUntil: string;
  status: GatePassStatus;

  // Exit tracking
  exitedAt?: string;
  exitScannedBy?: string;
  exitOdometer?: number;
  exitFuelLevel?: FuelLevel;

  // Return tracking
  returnedAt?: string;
  returnScannedBy?: string;
  returnOdometer?: number;
  returnFuelLevel?: FuelLevel;
  returnCondition?: VehicleCondition;
  returnNotes?: string;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'STATUS_CHANGE'
  | 'GATE_PASS_ISSUED'
  | 'GATE_PASS_SCANNED';

export type AuditResourceType =
  | 'lead'
  | 'vehicle'
  | 'customer'
  | 'service_job'
  | 'invoice'
  | 'quotation'
  | 'gate_pass'
  | 'user'
  | 'organization'
  | 'settings';

export interface AuditLog {
  id: string;
  userId: string;
  orgId: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
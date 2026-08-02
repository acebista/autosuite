import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Phone, Mail, Car, X, Check, FileText, Send, Printer, DollarSign, ArrowLeft, ArrowRight, ClipboardCheck, Plus, ChevronDown, RefreshCw, User, Palette } from 'lucide-react';
import { useCustomers, useUpdateCustomer, useInventory, useUsers, useCreateCustomer, useCreateLead, useUpdateVehicle, useLeads, useUpdateLead } from '../api';
import { Customer, Lead, Vehicle } from '../types';
import { Card, Button, Badge, SectionHeader, Skeleton, useToast } from '../UI';
import { useAuth } from '../AuthContext';

const ApolloMotorsLogo: React.FC<{ className?: string }> = ({ className = "w-[240px] h-[72px]" }) => (
   <svg 
      viewBox="0 0 350 100" 
      className={className}
   >
      {/* Sunburst rays */}
      <g stroke="#f26522" strokeWidth="3" strokeLinecap="round">
         {/* Rays calculated around center (55, 50) */}
         {/* Left rays */}
         <line x1="33" y1="50" x2="15" y2="50" />
         <line x1="34" y1="42" x2="18" y2="30" />
         <line x1="34" y1="58" x2="18" y2="70" />
         <line x1="38" y1="35" x2="25" y2="15" />
         <line x1="38" y1="65" x2="25" y2="85" />
         {/* Top rays */}
         <line x1="45" y1="31" x2="38" y2="8" />
         <line x1="55" y1="29" x2="55" y2="5" />
         <line x1="65" y1="31" x2="72" y2="8" />
         {/* Bottom rays */}
         <line x1="45" y1="69" x2="38" y2="92" />
         <line x1="55" y1="71" x2="55" y2="95" />
         <line x1="65" y1="69" x2="72" y2="92" />
         {/* Top-Right and Bottom-Right extension rays */}
         <line x1="74" y1="35" x2="88" y2="18" />
         <line x1="83" y1="41" x2="102" y2="30" />
         <line x1="74" y1="65" x2="88" y2="82" />
         <line x1="83" y1="59" x2="102" y2="70" />
      </g>
      
      {/* Logo Text in Orbitron style */}
      <g style={{ fontFamily: "'Orbitron', sans-serif" }} fontWeight="900" fill="#000">
         <text x="115" y="46" fontSize="26" letterSpacing="3">APOLLO</text>
         <text x="115" y="78" fontSize="26" letterSpacing="3">MOTORS</text>
      </g>
   </svg>
);

const CustomerRegistry: React.FC = () => {
   const { customerId } = useParams<{ customerId?: string }>();
   const navigate = useNavigate();
   const { data: customers = [], isLoading } = useCustomers();
   const { data: vehicles = [] } = useInventory();
   const updateCustomer = useUpdateCustomer();
   const { addToast } = useToast();

   const createCustomer = useCreateCustomer();
   const createLead = useCreateLead();
   const updateLead = useUpdateLead();
   const updateVehicle = useUpdateVehicle();
   const { data: users = [] } = useUsers();
   const { data: leads = [] } = useLeads();
   const { user } = useAuth();

   const [searchTerm, setSearchTerm] = useState('');
   const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');
   const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
   const [isSubmittingAllotment, setIsSubmittingAllotment] = useState(false);
   const [selectedLeadId, setSelectedLeadId] = useState('');

   const [allotmentFormData, setAllotmentFormData] = useState({
      name: '',
      phone: '',
      email: '',
      address: '',
      companyName: '',
      panNumber: '',
      allottedVehicleId: '',
      source: 'Showroom Walk In',
      budget: '',
      temperature: 'Warm' as 'Hot' | 'Warm' | 'Cold',
      ownerId: '',
      hasExchange: false,
      exchangeVehicle: '',
      expectedValue: '',
      remarks: '',
      nextFollowUpDate: ''
   });

   // Filter available vehicles in stock
   const availableVehicles = useMemo(() => {
      return vehicles.filter(v => v.status === 'In Stock' && v.vin && !v.vin.startsWith('CAT-'));
   }, [vehicles]);

   // Filter sales consultants
   const salesReps = useMemo(() => {
      return users.filter(u => ['SalesRep', 'SalesManager', 'Admin'].includes(u.role));
   }, [users]);

   // Auto-set ownerId for SalesRep
   useEffect(() => {
      if (user && user.role === 'SalesRep') {
         setAllotmentFormData(prev => ({ ...prev, ownerId: user.id }));
      }
   }, [user]);

   // Auto-set budget when vehicle changes
   useEffect(() => {
      if (allotmentFormData.allottedVehicleId) {
         const vehicle = vehicles.find(v => v.id === allotmentFormData.allottedVehicleId);
         if (vehicle && !allotmentFormData.budget) {
            setAllotmentFormData(prev => ({ ...prev, budget: vehicle.price?.toString() || '' }));
         }
      }
   }, [allotmentFormData.allottedVehicleId, vehicles]);

   // Auto-populate form when selecting an existing pipeline lead
   useEffect(() => {
      if (selectedLeadId) {
         const lead = leads.find(l => l.id === selectedLeadId);
         if (lead) {
            setAllotmentFormData(prev => ({
               ...prev,
               name: lead.name || '',
               phone: lead.phone || '',
               email: lead.email || '',
               address: lead.address || '',
               companyName: lead.companyName || '',
               panNumber: lead.panNumber || '',
               source: lead.source || 'Showroom Walk In',
               budget: lead.budget?.toString() || '',
               temperature: (lead.temperature || 'Warm') as any,
               ownerId: lead.ownerId || '',
               hasExchange: lead.exchange?.hasExchange || false,
               exchangeVehicle: lead.exchange?.vehicleModel || '',
               expectedValue: lead.exchange?.expectedValue?.toString() || '',
               remarks: lead.remarks || '',
               nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : ''
            }));
         }
      } else {
         // Reset when selection is cleared
         setAllotmentFormData(prev => ({
            ...prev,
            name: '',
            phone: '',
            email: '',
            address: '',
            companyName: '',
            panNumber: '',
            allottedVehicleId: '',
            source: 'Showroom Walk In',
            budget: '',
            temperature: 'Warm',
            ownerId: user?.role === 'SalesRep' ? user.id : '',
            hasExchange: false,
            exchangeVehicle: '',
            expectedValue: '',
            remarks: '',
            nextFollowUpDate: ''
         }));
      }
   }, [selectedLeadId, leads, user]);

   // Submit onboarding form to create customer, create lead, and reserve vehicle
   const handleCreateOnboarding = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!allotmentFormData.name || !allotmentFormData.phone || !allotmentFormData.address) {
         addToast('Name, Phone, and Address are required.', 'warning');
         return;
      }

      if (!allotmentFormData.allottedVehicleId) {
         addToast('Please select a vehicle to allot.', 'warning');
         return;
      }

      const vehicle = vehicles.find(v => v.id === allotmentFormData.allottedVehicleId);
      if (!vehicle) {
         addToast('Selected vehicle not found in inventory.', 'error');
         return;
      }

      setIsSubmittingAllotment(true);
      try {
         // 1. Create customer
         const newCust = await createCustomer.mutateAsync({
            name: allotmentFormData.name,
            phone: allotmentFormData.phone,
            email: allotmentFormData.email || '',
            companyName: allotmentFormData.companyName || '',
            panNumber: allotmentFormData.panNumber || '',
            location: allotmentFormData.address,
            branchId: vehicle.branchId || user?.branchId || '7b0e8c8a-7c9b-4d5e-8f2a-1b2c3d4e5f6a',
            ltv: 0,
            referrals: 0,
            carsOwned: [{
               model: `${vehicle.model} ${vehicle.variant}`,
               vin: vehicle.vin,
               plate: vehicle.registrationNo || 'Not Registered',
               status: 'Active',
               paymentMethod: 'cash',
               checklist: {}
            }]
         });

         // 2. Create or update lead in pipeline
         if (selectedLeadId) {
            await updateLead.mutateAsync({
               id: selectedLeadId,
               patch: {
                  name: allotmentFormData.name,
                  phone: allotmentFormData.phone,
                  email: allotmentFormData.email || undefined,
                  address: allotmentFormData.address || undefined,
                  companyName: allotmentFormData.companyName || undefined,
                  panNumber: allotmentFormData.panNumber || undefined,
                  source: allotmentFormData.source,
                  modelInterest: vehicle.model,
                  vehicleColor: vehicle.color,
                  budget: parseFloat(allotmentFormData.budget) || vehicle.price || 0,
                  status: 'Reserved',
                  temperature: allotmentFormData.temperature,
                  ownerId: allotmentFormData.ownerId || null,
                  exchange: {
                     hasExchange: allotmentFormData.hasExchange,
                     vehicleModel: allotmentFormData.hasExchange ? allotmentFormData.exchangeVehicle : undefined,
                     expectedValue: allotmentFormData.hasExchange ? parseFloat(allotmentFormData.expectedValue) : undefined,
                     offeredValue: undefined,
                     photoUrl: undefined
                  },
                  remarks: allotmentFormData.remarks || undefined,
                  nextFollowUpDate: allotmentFormData.nextFollowUpDate || undefined
               }
            });
         } else {
            await createLead.mutateAsync({
               name: allotmentFormData.name,
               phone: allotmentFormData.phone,
               email: allotmentFormData.email || undefined,
               address: allotmentFormData.address || undefined,
               companyName: allotmentFormData.companyName || undefined,
               panNumber: allotmentFormData.panNumber || undefined,
               source: allotmentFormData.source,
               modelInterest: vehicle.model,
               vehicleColor: vehicle.color,
               budget: parseFloat(allotmentFormData.budget) || vehicle.price || 0,
               status: 'Reserved',
               temperature: allotmentFormData.temperature,
               ownerId: allotmentFormData.ownerId || null,
               exchange: {
                  hasExchange: allotmentFormData.hasExchange,
                  vehicleModel: allotmentFormData.hasExchange ? allotmentFormData.exchangeVehicle : undefined,
                  expectedValue: allotmentFormData.hasExchange ? parseFloat(allotmentFormData.expectedValue) : undefined,
                  offeredValue: undefined,
                  photoUrl: undefined
               },
               remarks: allotmentFormData.remarks || undefined,
               nextFollowUpDate: allotmentFormData.nextFollowUpDate || undefined
            });
         }

         // 3. Update vehicle status to Reserved
         await updateVehicle.mutateAsync({
            id: vehicle.id,
            patch: { status: 'Reserved' }
         });

         addToast('Customer created, vehicle allotted, and pipeline synchronized successfully!', 'success');
         setIsOnboardingModalOpen(false);
         setSelectedLeadId('');

         // Reset form
         setAllotmentFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            companyName: '',
            panNumber: '',
            allottedVehicleId: '',
            source: 'Showroom Walk In',
            budget: '',
            temperature: 'Warm',
            ownerId: user?.role === 'SalesRep' ? user.id : '',
            hasExchange: false,
            exchangeVehicle: '',
            expectedValue: '',
            remarks: '',
            nextFollowUpDate: ''
         });

         // Redirect to the newly created customer's settlement profile!
         if (newCust && newCust.id) {
            navigate(`/customer-registry/${newCust.id}`);
         }
      } catch (err) {
         console.error('Failed to create customer settlement profile:', err);
         addToast('Failed to create profile. Please check inputs and try again.', 'error');
      } finally {
         setIsSubmittingAllotment(false);
      }
   };

   // Document preview modal state
   const [previewDocType, setPreviewDocType] = useState<'allotment' | 'disbursement' | null>(null);
   const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
   const [docAllotmentCustomer, setDocAllotmentCustomer] = useState('');
   const [docBankName, setDocBankName] = useState('');
   const [docBankBranch, setDocBankBranch] = useState('');
   const [docRmName, setDocRmName] = useState('');
   const [docRmPhone, setDocRmPhone] = useState('');
   const [docNepaliDate, setDocNepaliDate] = useState('2083-  -  ');
   const [docApprovedLoan, setDocApprovedLoan] = useState('');
   const [docAmountReceived, setDocAmountReceived] = useState('');
   const [docSalePrice, setDocSalePrice] = useState('');
   const [docDate, setDocDate] = useState('');

   // Mailto and details helpers
   const getVehicleDetails = (vin: string) => {
      return vehicles.find(v => v.vin === vin);
   };

   const getAllotmentDetails = (vehicle: any) => {
      if (!vehicle) return null;
      const spec = vehicle.specifications?.find((s: any) => s.label === 'allotment_details');
      if (spec) {
         try {
            return JSON.parse(spec.value);
         } catch (err) {
            console.error('Failed to parse allotment details:', err);
         }
      }
      return null;
   };

   const handleTriggerDocument = (type: 'allotment' | 'disbursement', vehicle: any, allotmentDetails: any) => {
      setSelectedVehicle(vehicle);
      setDocAllotmentCustomer(allotmentDetails.customerName || '');
      setDocBankName(allotmentDetails.bankName || 'Nabil Bank Ltd');
      setDocBankBranch(allotmentDetails.bankBranch || 'Biratnagar');
      setDocRmName(allotmentDetails.rmName || '');
      setDocRmPhone(allotmentDetails.rmPhone || '');
      setDocNepaliDate(allotmentDetails.nepaliDate || '2083-  -  ');
      setDocApprovedLoan(allotmentDetails.approvedLoan?.toString() || '');
      setDocAmountReceived(allotmentDetails.amountReceived?.toString() || '');
      setDocSalePrice(allotmentDetails.salePrice?.toString() || vehicle.price?.toString() || '');
      setDocDate(allotmentDetails.allotmentDate || new Date().toISOString().split('T')[0]);
      setPreviewDocType(type);
   };

   const getInsuranceActivationMailto = (cust: Customer, vehicle: any) => {
      const to = 'insurance@mawnepal.com';
      const subject = `Activation of Motor Insurance - ${cust.name} - Changan ${vehicle?.model || ''}`;
      const body = `Dear MAW Insurance Team,\n\nPlease activate the comprehensive motor insurance policy for the following vehicle:\n\nCustomer Name: ${cust.name}\nPhone: ${cust.phone}\nVehicle Model: Changan ${vehicle?.model || ''}\nVariant: ${vehicle?.variant || ''}\nChassis No (VIN): ${vehicle?.vin || ''}\nEngine No: ${vehicle?.motorNo || 'N/A'}\nRegistration No: ${vehicle?.registrationNo || 'Not Registered'}\n\nKindly issue the policy copy as soon as possible and send it to us.\n\nBest regards,\nApollo Motors Team`;
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
   };

   const getInsuranceEndorsementMailto = (cust: Customer, vehicle: any, allotment: any) => {
      const to = 'insurance@mawnepal.com';
      const subject = `Insurance Endorsement Request - ${cust.name} - ${allotment?.bankName || ''} - Changan ${vehicle?.model || ''}`;
      const body = `Dear MAW Insurance Team,\n\nWe request you to endorse the motor insurance policy for the following vehicle in favor of our financing bank partner:\n\nCustomer Name: ${cust.name}\nFinancing Bank: ${allotment?.bankName || ''} (${allotment?.bankBranch || ''} Branch)\nVehicle Model: Changan ${vehicle?.model || ''}\nVariant: ${vehicle?.variant || ''}\nChassis No (VIN): ${vehicle?.vin || ''}\nEngine No: ${vehicle?.motorNo || 'N/A'}\nRegistration No: ${vehicle?.registrationNo || 'Not Registered'}\n\nPlease update the hypothecation status to "${allotment?.bankName || ''}" and send the endorsed copy to the bank and customer.\n\nBest regards,\nApollo Motors Team`;
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
   };

   const handleToggleStep = async (carIndex: number, stepKey: string, currentValue: boolean, currentCustomer: Customer) => {
      const updatedCars = currentCustomer.carsOwned.map((car, idx) => {
         if (idx === carIndex) {
            const checklist = { ...((car as any).checklist || {}) };
            checklist[stepKey] = !currentValue;
            return { ...car, checklist };
         }
         return car;
      });

      try {
         await updateCustomer.mutateAsync({
            id: currentCustomer.id,
            patch: { carsOwned: updatedCars }
         });
         addToast('Post-sale step updated successfully!', 'success');
      } catch (err) {
         addToast('Failed to update step.', 'error');
      }
   };

   // Helper to calculate settlement state
   const getCustomerSettlement = (cust: Customer) => {
      const hasLinkedCar = cust.carsOwned && cust.carsOwned.length > 0;
      if (!hasLinkedCar) return { isFullyPaid: false, completed: 0, total: 0, percentage: 0 };

      let totalSteps = 0;
      let completedSteps = 0;

      cust.carsOwned.forEach(car => {
         const vehicle = vehicles.find(v => v.vin === car.vin);
         if (!vehicle) return;

         const spec = vehicle.specifications?.find((s: any) => s.label === 'allotment_details');
         let allotment: any = null;
         if (spec) {
            try {
               allotment = JSON.parse(spec.value);
            } catch (err) {}
         }

         const method = (car as any).paymentMethod || allotment?.paymentMethod || (allotment?.bankName ? 'finance' : 'cash');
         const checklist = (car as any).checklist || {};

         const steps = method === 'cash' 
            ? ['insuranceActivated', 'registered'] 
            : ['insuranceActivated', 'allotmentLetterWritten', 'registrationCoordinated', 'insuranceEndorsed', 'disbursementLetterWritten'];

         totalSteps += steps.length;
         steps.forEach(step => {
            if (checklist[step]) {
               completedSteps += 1;
            }
         });
      });

      const isFullyPaid = totalSteps > 0 && completedSteps === totalSteps;

      return {
         isFullyPaid,
         completed: completedSteps,
         total: totalSteps,
         percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
      };
   };

   const filteredCustomers = useMemo(() => {
      return customers.filter(cust => {
         // Must have cars owned to be in the registry
         const hasLinkedCar = cust.carsOwned && cust.carsOwned.length > 0;
         if (!hasLinkedCar) return false;

         const settlement = getCustomerSettlement(cust);
         const matchesTab = activeTab === 'settled' ? settlement.isFullyPaid : !settlement.isFullyPaid;
         if (!matchesTab) return false;

         const matchesSearch = cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cust.phone.includes(searchTerm);
         return matchesSearch;
      });
   }, [searchTerm, customers, vehicles, activeTab]);

   // Resolve customer if customerId parameter is present
   const customer = useMemo(() => {
      if (!customerId) return null;
      return customers.find(c => c.id === customerId) || null;
   }, [customerId, customers]);

   if (isLoading) {
      return (
         <div className="space-y-6 animate-fade-in">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-14" />
            <Skeleton className="h-96" />
         </div>
      );
   }

   // ----------------------------------------------------
   // RENDER PROFILE VIEW
   // ----------------------------------------------------
   if (customerId) {
      if (!customer) {
         return (
            <div className="space-y-6 text-center py-20 animate-fade-in">
               <ClipboardCheck size={48} className="text-slate-300 mx-auto mb-4" />
               <h3 className="text-lg font-black text-slate-800">Profile Not Found</h3>
               <p className="text-sm text-slate-500 max-w-md mx-auto">
                  The registry profile you are trying to access does not exist or has been removed.
               </p>
               <Button onClick={() => navigate('/customer-registry')} className="mt-4" icon={ArrowLeft}>
                  Back to Registry
               </Button>
            </div>
         );
      }

      const settlement = getCustomerSettlement(customer);

      return (
         <div className="space-y-6 animate-fade-in text-left">
            {/* Header bar */}
            <div className="flex flex-col gap-2">
               <button 
                  onClick={() => navigate('/customer-registry')} 
                  className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-colors cursor-pointer border-none bg-transparent self-start"
               >
                  <ArrowLeft size={12} /> Back to Customer Registry
               </button>
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-900/10">
                        {customer.name.charAt(0)}
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{customer.name}</h2>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold mt-2">
                           <MapPin size={12} /> {customer.location}
                        </div>
                     </div>
                  </div>
                  <Badge variant={settlement.isFullyPaid ? 'success' : 'blue'} size="lg">
                     Settlement: {settlement.percentage}% Complete ({settlement.completed}/{settlement.total} Steps)
                  </Badge>
               </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
               {/* Left Sidebar Info */}
               <div className="space-y-6 lg:col-span-1">
                  <Card className="p-6 space-y-6 border border-slate-200 shadow-sm bg-white">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Customer Profile</h3>
                     
                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                           <span className="text-slate-400 font-bold">Lifetime Value</span>
                           <span className="font-black text-slate-900 font-mono text-sm">₹{(customer.ltv / 100000).toFixed(1)}L</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                           <span className="text-slate-400 font-bold">Referral Units</span>
                           <span className="font-black text-slate-900">{customer.referrals}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                           <span className="text-slate-400 font-bold">Vehicles Registered</span>
                           <span className="font-black text-slate-900">{customer.carsOwned.length}</span>
                        </div>
                     </div>
                  </Card>

                  <Card className="p-6 space-y-6 border border-slate-200 shadow-sm bg-white">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Contact Identity</h3>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 text-xs">
                           <Phone size={16} className="text-slate-400 shrink-0" />
                           <span className="text-slate-700 font-bold">{customer.phone}</span>
                           <a href={`tel:${customer.phone}`} className="ml-auto">
                              <Button size="xs" variant="outline">Call</Button>
                           </a>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                           <Mail size={16} className="text-slate-400 shrink-0" />
                           <span className="text-slate-700 font-bold truncate max-w-[150px]">{customer.email || 'No Email'}</span>
                           {customer.email && (
                              <a href={`mailto:${customer.email}`} className="ml-auto">
                                 <Button size="xs" variant="outline">Email</Button>
                              </a>
                           )}
                        </div>
                     </div>
                  </Card>

                  <Card className="p-6 space-y-6 border border-slate-200 shadow-sm bg-white">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Allotted Garage</h3>
                     <div className="space-y-3">
                        {customer.carsOwned.map((car, idx) => (
                           <div key={idx} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50">
                              <Car size={16} className="text-blue-600 shrink-0" />
                              <div className="text-left min-w-0 flex-1">
                                 <p className="font-bold text-slate-800 text-xs truncate">{car.model}</p>
                                 <p className="text-[9px] text-slate-400 font-mono mt-0.5">{car.vin || 'No VIN Number'}</p>
                              </div>
                              <Badge size="xs" variant={car.status === 'Active' ? 'success' : 'neutral'}>{car.status}</Badge>
                           </div>
                        ))}
                     </div>
                  </Card>
               </div>

               {/* Right Main Stepper Panel */}
               <div className="lg:col-span-2 space-y-6">
                  {customer.carsOwned.map((car, carIdx) => {
                     const vehicle = getVehicleDetails(car.vin || '');
                     const allotment = getAllotmentDetails(vehicle);
                     const activeVehicle = vehicle || { model: car.model, vin: car.vin, color: 'N/A', motorNo: 'N/A', registrationNo: car.plate || 'Not Registered', price: '' };
                     const method = (car as any).paymentMethod || allotment?.paymentMethod || (allotment?.bankName ? 'finance' : 'cash');
                     const checklist = (car as any).checklist || {};
                     const isCash = method === 'cash';

                     const supplyChainSteps = [
                        {
                           label: 'Proforma Invoice (PI) Received',
                           value: activeVehicle?.proformaInvoiceNo ? `PI No: ${activeVehicle.proformaInvoiceNo}` : 'PI details recorded',
                           description: 'Proforma Invoice received from MAW Vriddhi Autocorp Pvt. Ltd.'
                        },
                        {
                           label: 'Letter of Credit (LC) Established',
                           value: activeVehicle?.lcNo ? `LC No: ${activeVehicle.lcNo}` : 'Domestic LC established',
                           description: 'Domestic Letter of Credit established with banking partner.'
                        },
                        {
                           label: 'Vehicle Received in Stock',
                           value: activeVehicle?.createdAt ? `Date: ${new Date(activeVehicle.createdAt).toLocaleDateString()}` : 'Stock receipt logged',
                           description: `Procurement complete. Motor No: ${activeVehicle?.motorNo || 'N/A'} • Color: ${activeVehicle?.color || 'N/A'}`
                        }
                     ];

                     const retailSaleSteps = [
                        {
                           label: 'Vehicle Sold & Allotted',
                           value: allotment?.salePrice ? `NPR ${allotment.salePrice.toLocaleString()}` : 'N/A',
                           description: `Allotted to customer on ${allotment?.allotmentDate || 'N/A'} ${allotment?.nepaliDate ? `(BS ${allotment.nepaliDate})` : ''}.`
                        }
                     ];

                     const financingSteps = isCash ? [
                        {
                           key: 'insuranceActivated',
                           label: 'Activate Insurance',
                           description: 'Activate insurance by writing email to MAW insurance team.',
                           completed: checklist.insuranceActivated || false,
                           action: {
                              label: 'Send Email',
                              icon: Send,
                              href: activeVehicle ? getInsuranceActivationMailto(customer, activeVehicle) : '#'
                           }
                        },
                        {
                           key: 'registered',
                           label: 'Register Car & Issue VAT Bill',
                           description: "Register car in person's name. Issue VAT bill, contact Yatayat representative Ram Lakhan Sah (+977-9851090652) and the customer.",
                           completed: checklist.registered || false
                        }
                     ] : [
                        {
                           key: 'insuranceActivated',
                           label: 'Activate Insurance',
                           description: 'Activate insurance by writing email to MAW insurance team.',
                           completed: checklist.insuranceActivated || false,
                           action: {
                              label: 'Send Email',
                              icon: Send,
                              href: activeVehicle ? getInsuranceActivationMailto(customer, activeVehicle) : '#'
                           }
                        },
                        {
                           key: 'allotmentLetterWritten',
                           label: 'Write Allotment Letter',
                           description: 'Write allotment letter to Bank Relation Manager.',
                           completed: checklist.allotmentLetterWritten || false,
                           action: {
                              label: 'Print Letter',
                              icon: Printer,
                              onClick: () => handleTriggerDocument('allotment', activeVehicle, allotment)
                           }
                        },
                        {
                           key: 'registrationCoordinated',
                           label: 'Coordinate Vehicle Registration',
                           description: 'Coordinate vehicle registration with bank.',
                           completed: checklist.registrationCoordinated || false
                        },
                        {
                           key: 'insuranceEndorsed',
                           label: 'Endorsement of Insurance',
                           description: 'Endorsement of insurance to bank and customer via email to MAW insurance team.',
                           completed: checklist.insuranceEndorsed || false,
                           action: {
                              label: 'Send Email',
                              icon: Send,
                              href: activeVehicle && allotment ? getInsuranceEndorsementMailto(customer, activeVehicle, allotment) : '#'
                           }
                        },
                        {
                           key: 'disbursementLetterWritten',
                           label: 'Write Disbursement Letter',
                           description: "Once registered in bank's name, write disbursement letter.",
                           completed: checklist.disbursementLetterWritten || false,
                           action: {
                              label: 'Print Letter',
                              icon: Printer,
                              onClick: () => handleTriggerDocument('disbursement', activeVehicle, allotment)
                           }
                        }
                     ];

                     const progressPercent = Math.round((financingSteps.filter(s => s.completed).length / financingSteps.length) * 100);

                     return (
                        <Card key={carIdx} className="bg-white border border-slate-200 shadow-sm p-6 space-y-6">
                           <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <div>
                                 <h4 className="font-black text-slate-900 text-base">{car.model}</h4>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                    Chassis (VIN): {car.vin || 'N/A'} • {isCash ? 'Direct Cash Sale' : 'Bank Finance Sale'}
                                 </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                 <div className="flex gap-2">
                                    <Button 
                                       size="xs" 
                                       variant="outline" 
                                       icon={Printer}
                                       onClick={() => handleTriggerDocument('allotment', activeVehicle, allotment)}
                                    >
                                       Allotment Letter
                                    </Button>
                                    {!isCash && (
                                       <Button 
                                          size="xs" 
                                          variant="outline" 
                                          icon={Printer}
                                          onClick={() => handleTriggerDocument('disbursement', activeVehicle, allotment)}
                                       >
                                          Disbursement Letter
                                       </Button>
                                    )}
                                 </div>
                                 <Badge variant={progressPercent === 100 ? 'success' : 'blue'}>
                                    Process Progress: {progressPercent}%
                                 </Badge>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* 1. Supply Chain */}
                              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4 text-left">
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                                    1. Supply Chain
                                 </h5>
                                 <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200/50">
                                    {supplyChainSteps.map((step, sIdx) => (
                                       <div key={sIdx} className="flex gap-2.5 items-start relative z-10">
                                          <div className="h-4 w-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 border border-slate-300">
                                             <Check size={8} className="stroke-[3]" />
                                          </div>
                                          <div className="min-w-0">
                                             <p className="text-xs font-bold text-slate-800 leading-tight">{step.label}</p>
                                             <p className="text-[9px] text-blue-600 font-black mt-0.5">{step.value}</p>
                                             <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                                                {step.description}
                                             </p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* 2. Retail Sale */}
                              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4 text-left">
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                                    2. Retail Sale
                                 </h5>
                                 <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-emerald-200/50">
                                    {retailSaleSteps.map((step, rIdx) => (
                                       <div key={rIdx} className="flex gap-2.5 items-start relative z-10">
                                          <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
                                             <Check size={8} className="stroke-[3]" />
                                          </div>
                                          <div className="min-w-0">
                                             <p className="text-xs font-bold text-slate-800 leading-tight">{step.label}</p>
                                             <p className="text-[9px] text-emerald-700 font-black mt-0.5">Price: {step.value}</p>
                                             <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                                                {step.description}
                                             </p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* 3. Registration & Financing */}
                              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4 text-left">
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">
                                    3. Settlement Steps
                                 </h5>
                                 <div className="space-y-3">
                                    {financingSteps.map((step, fIdx) => (
                                       <div 
                                          key={fIdx} 
                                          onClick={() => handleToggleStep(carIdx, step.key, step.completed, customer)}
                                          className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-start gap-3 select-none ${
                                             step.completed
                                                ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50/70'
                                                : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
                                          }`}
                                       >
                                          <div className={`h-4.5 w-4.5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                             step.completed
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                                : 'bg-white border-slate-300 group-hover:border-blue-500'
                                          }`}>
                                             {step.completed ? (
                                                <Check size={10} className="stroke-[3]" />
                                             ) : (
                                                <Check size={10} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                                             )}
                                          </div>
                                          
                                          <div className="flex-1 min-w-0 space-y-1">
                                             <div className="flex items-center justify-between gap-2">
                                                <p className={`text-xs font-bold leading-tight ${step.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                   {step.label}
                                                </p>
                                                
                                                {step.action && (
                                                   <div onClick={(e) => e.stopPropagation()}>
                                                      {step.action.href ? (
                                                         <a
                                                            href={step.action.href}
                                                            className="flex items-center gap-0.5 text-[9px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm"
                                                         >
                                                            <step.action.icon size={8} />
                                                            {step.action.label}
                                                         </a>
                                                      ) : (
                                                         <button
                                                            type="button"
                                                            onClick={step.action.onClick}
                                                            className="flex items-center gap-0.5 text-[9px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider cursor-pointer bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm"
                                                         >
                                                            <step.action.icon size={8} />
                                                            {step.action.label}
                                                         </button>
                                                      )}
                                                   </div>
                                                )}
                                             </div>
                                             
                                             <p className={`text-[9px] leading-normal ${step.completed ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {step.description}
                                             </p>
                                             
                                             <div className="flex items-center justify-between mt-1 text-[8px] font-bold">
                                                <span className="text-slate-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                                   {step.completed ? 'Mark Incomplete' : 'Mark Done'}
                                                </span>
                                                {step.completed && (
                                                   <span className="text-emerald-700 uppercase tracking-wider bg-emerald-100 px-1 rounded">
                                                      Done
                                                   </span>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </Card>
                     );
                  })}
               </div>
            </div>

            {/* Print letter portals */}
            {previewDocType && selectedVehicle && createPortal(
               <div id="document-preview-portal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden text-slate-700 portal-modal-content">
                     {/* Header Controls */}
                     <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print-hide">
                        <div className="text-left">
                           <h3 className="text-lg font-black">
                              {previewDocType === 'allotment' && 'Preview: Bank Allotment Letter'}
                              {previewDocType === 'disbursement' && 'Preview: Loan Disbursement Letter'}
                           </h3>
                           <p className="text-slate-400 text-xs">Edit any dotted field directly in the letter before printing</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <Button 
                              onClick={() => window.print()}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 border-none cursor-pointer"
                           >
                              Print / Save PDF
                           </Button>
                           <button 
                              onClick={() => setPreviewDocType(null)} 
                              className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
                           >
                              <X size={20} />
                           </button>
                        </div>
                     </div>

                     {/* Document Content Canvas */}
                     <div className="p-6 md:p-12 overflow-y-auto flex-1 flex justify-center bg-slate-200 print-bg-white">
                        <div 
                           id="printable-document-area" 
                           className="bg-white text-black w-[21cm] h-[29.7cm] pt-[2cm] px-[2.5cm] pb-[3.5cm] shadow-lg font-serif leading-relaxed text-sm relative border border-slate-300 print-no-shadow overflow-hidden"
                        >
                           {/* Print Stylesheet */}
                           <style>{`
                              @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');

                              @media print {
                                 body * {
                                    visibility: hidden !important;
                                 }
                                 #document-preview-portal, #document-preview-portal * {
                                    visibility: visible !important;
                                 }
                                 #document-preview-portal {
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: 100% !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    box-shadow: none !important;
                                    background: white !important;
                                    max-height: none !important;
                                    overflow: visible !important;
                                 }
                                 .portal-modal-content {
                                    box-shadow: none !important;
                                    background: white !important;
                                    border: none !important;
                                    width: 100% !important;
                                    max-width: none !important;
                                    max-height: none !important;
                                    overflow: visible !important;
                                 }
                                 @page {
                                    size: A4;
                                    margin: 0;
                                 }
                                 #printable-document-area {
                                    border: none !important;
                                    box-shadow: none !important;
                                    margin: 0 !important;
                                    padding: 2cm 2.5cm 3.5cm 2.5cm !important;
                                    width: 21cm !important;
                                    height: 29.7cm !important;
                                    box-sizing: border-box !important;
                                    position: relative !important;
                                    background: white !important;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                 }
                                 .print-hide {
                                    display: none !important;
                                 }
                                 .print-bg-white {
                                    background: white !important;
                                    padding: 0 !important;
                                 }
                                 .print-input-inline {
                                    border: none !important;
                                    background: transparent !important;
                                    padding: 0 !important;
                                    outline: none !important;
                                    box-shadow: none !important;
                                    font-weight: bold !important;
                                 }
                              }
                              .print-color-adjust-exact {
                                 -webkit-print-color-adjust: exact !important;
                                 print-color-adjust: exact !important;
                              }
                              .doc-input {
                                 border-bottom: 1px dotted #888;
                                 padding: 2px 4px;
                                 background: #fff8e1;
                                 outline: none;
                                 transition: all 0.2s;
                              }
                              .doc-input:focus {
                                 background: #fff;
                                 border-bottom-color: #3b82f6;
                              }
                           `}</style>

                           {/* Faded Watermark in background */}
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden" style={{ opacity: 0.03 }}>
                              <ApolloMotorsLogo className="w-[500px] h-[150px]" />
                           </div>

                           {/* Document Logo & Brand Header */}
                           <div className="relative z-10 flex justify-center items-center mb-10 pb-4 border-b border-slate-100">
                              <ApolloMotorsLogo className="w-[280px] h-[84px]" />
                           </div>

                           {previewDocType === 'allotment' && (
                              <div className="space-y-6 text-left">
                                 {/* Date */}
                                 <div>
                                    <span className="font-bold">Date: - </span>
                                    <input 
                                       type="text" 
                                       value={docNepaliDate}
                                       onChange={e => setDocNepaliDate(e.target.value)}
                                       className="doc-input print-input-inline w-44 font-bold"
                                       placeholder="Nepali Date (BS 2083- - )"
                                    />
                                 </div>

                                 {/* Recipient */}
                                 <div className="space-y-1">
                                    <p className="font-bold">To,</p>
                                    <p className="font-bold">The Manager</p>
                                    <p className="font-bold">
                                       <input 
                                          type="text" 
                                          value={docBankName}
                                          onChange={e => setDocBankName(e.target.value)}
                                          className="doc-input print-input-inline w-[300px] font-bold"
                                          placeholder="Bank Name"
                                       />
                                    </p>
                                    <p className="font-bold">
                                       <input 
                                          type="text" 
                                          value={docBankBranch}
                                          onChange={e => setDocBankBranch(e.target.value)}
                                          className="doc-input print-input-inline w-[300px] font-bold"
                                          placeholder="Branch Name"
                                       /> Branch
                                    </p>
                                 </div>

                                 {/* Subject */}
                                 <div className="mt-8">
                                    <h3 className="font-black text-sm uppercase underline">Subject: Allotment Letter</h3>
                                 </div>

                                 {/* Greeting */}
                                 <div>
                                    <p className="font-bold">Dear Sir/Mam,</p>
                                 </div>

                                 {/* Body */}
                                 <p className="text-justify leading-relaxed">
                                    Here, we have allotted the following vehicle for{' '}
                                    <input 
                                       type="text" 
                                       value={docAllotmentCustomer}
                                       onChange={e => setDocAllotmentCustomer(e.target.value)}
                                       className="doc-input print-input-inline w-[350px] font-bold"
                                       placeholder="Customer Name"
                                    />
                                    . Kindly get the attached details and proceed for the ownership transfer as request.
                                 </p>

                                 <p className="font-bold uppercase tracking-wider text-xs border-b pb-1 mt-4">Name of customer : M/S {docAllotmentCustomer}</p>

                                 {/* Vehicle Details Table */}
                                 <div>
                                    <h4 className="font-bold underline text-xs uppercase mb-2">Vehicle Details</h4>
                                    <table className="w-full border-collapse border border-slate-300 text-xs">
                                       <tbody>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 w-48 text-left">Model</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">{selectedVehicle.model} {selectedVehicle.variant}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Chassis Number</td>
                                             <td className="border border-slate-300 px-4 py-2 font-mono font-bold text-left">{selectedVehicle.vin}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Engine Number</td>
                                             <td className="border border-slate-300 px-4 py-2 font-mono font-bold text-left">{selectedVehicle.motorNo || 'N/A'}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Color</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">{selectedVehicle.color}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Regd No</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">{selectedVehicle.registrationNo || 'Not Registered'}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Sale Price</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">
                                                NPR{' '}
                                                <input 
                                                   type="text" 
                                                   value={docSalePrice}
                                                   onChange={e => setDocSalePrice(e.target.value)}
                                                   className="doc-input print-input-inline w-40 font-bold"
                                                />
                                             </td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Amount received from customer</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-emerald-800 text-left">
                                                NPR{' '}
                                                <input 
                                                   type="text" 
                                                   value={docAmountReceived}
                                                   onChange={e => setDocAmountReceived(e.target.value)}
                                                   className="doc-input print-input-inline w-40 font-bold"
                                                />
                                             </td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Approved loan from customer</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-blue-800 text-left">
                                                NPR{' '}
                                                <input 
                                                   type="text" 
                                                   value={docApprovedLoan}
                                                   onChange={e => setDocApprovedLoan(e.target.value)}
                                                   className="doc-input print-input-inline w-40 font-bold"
                                                />
                                             </td>
                                          </tr>
                                       </tbody>
                                    </table>
                                 </div>

                                 <p className="text-justify leading-relaxed font-bold">
                                    We request to arrange for the ownership transfer of the above-mentioned vehicle in your bank name and proceed for the disbursement of approved amount.
                                 </p>

                                 <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl leading-relaxed text-xs">
                                    <p className="font-bold">Note:</p>
                                    Ownership transfer will be done in Transport Management Office, Biratnagar. For that purpose kindly contact our yatayat representative{' '}
                                    <span className="font-bold">Ram Lakhan Sah</span> (Contact No. <span className="font-bold">+977-9851090652</span>)
                                 </div>

                                 {/* Footer */}
                                 <div className="pt-8 text-right space-y-1">
                                    <p className="font-bold">Best Regard</p>
                                    <p className="font-black text-slate-900 mt-6 pt-4">Urmila Bishwokarma</p>
                                    <p className="font-bold text-xs">Apollo Motors Pvt. Ltd.</p>
                                    <p className="text-slate-500 font-medium text-xs">+9779712066053</p>
                                 </div>
                              </div>
                           )}

                           {previewDocType === 'disbursement' && (
                              <div className="space-y-6 text-left">
                                 {/* Date */}
                                 <div>
                                    <span className="font-bold">Date: - </span>
                                    <input 
                                       type="text" 
                                       value={docDate}
                                       onChange={e => setDocDate(e.target.value)}
                                       className="doc-input print-input-inline w-44 font-bold"
                                    />
                                 </div>

                                 {/* Recipient */}
                                 <div className="space-y-1">
                                    <p className="font-bold">To,</p>
                                    <p className="font-bold">The Manager</p>
                                    <p className="font-bold">
                                       <input 
                                          type="text" 
                                          value={docBankName}
                                          onChange={e => setDocBankName(e.target.value)}
                                          className="doc-input print-input-inline w-[300px] font-bold"
                                          placeholder="Bank Name"
                                       />
                                    </p>
                                    <p className="font-bold">
                                       <input 
                                          type="text" 
                                          value={docBankBranch}
                                          onChange={e => setDocBankBranch(e.target.value)}
                                          className="doc-input print-input-inline w-[300px] font-bold"
                                          placeholder="Branch Name"
                                       /> Branch
                                    </p>
                                 </div>

                                 {/* Subject */}
                                 <div className="mt-8">
                                    <h3 className="font-black text-sm uppercase underline">Subject: Request for Loan Disbursement</h3>
                                 </div>

                                 {/* Greeting */}
                                 <div>
                                    <p className="font-bold">Dear Sir/Madam,</p>
                                 </div>

                                 {/* Body */}
                                 <p className="text-justify leading-relaxed">
                                    With reference to the Allotment Letter issued for the vehicle detailed below, we would like to inform you that the vehicle ownership transfer has been completed in the bank's name. We request you to kindly disburse the approved loan amount of NPR{' '}
                                    <span className="font-bold">{parseFloat(docApprovedLoan || '0').toLocaleString()}</span>{' '}
                                    in favor of Apollo Motors Pvt. Ltd. to our bank account specified below.
                                 </p>

                                 {/* Details Table */}
                                 <div>
                                    <table className="w-full border-collapse border border-slate-300 text-xs">
                                       <tbody>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 w-48 text-left">Name of Customer</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">M/S {docAllotmentCustomer}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Vehicle Model</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">{selectedVehicle.model} {selectedVehicle.variant}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Chassis Number</td>
                                             <td className="border border-slate-300 px-4 py-2 font-mono font-bold text-left">{selectedVehicle.vin}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Engine Number</td>
                                             <td className="border border-slate-300 px-4 py-2 font-mono font-bold text-left">{selectedVehicle.motorNo || 'N/A'}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Registration Number</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">{selectedVehicle.registrationNo || 'Not Registered'}</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-blue-800 text-left">Approved Loan Amount</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-blue-800 text-left">NPR {parseFloat(docApprovedLoan || '0').toLocaleString()}</td>
                                          </tr>
                                       </tbody>
                                    </table>
                                 </div>

                                 {/* Account Info */}
                                 <div>
                                    <h4 className="font-bold underline text-xs uppercase mb-2">Bank Account Details for Disbursement</h4>
                                    <table className="w-full border-collapse border border-slate-300 text-xs">
                                       <tbody>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 w-48 text-left">Account Name</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">Apollo Motors Pvt. Ltd.</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Account Number</td>
                                             <td className="border border-slate-300 px-4 py-2 font-mono font-bold text-left">01020304050607</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Bank Name</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">Nabil Bank Ltd.</td>
                                          </tr>
                                          <tr>
                                             <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-left">Branch</td>
                                             <td className="border border-slate-300 px-4 py-2 font-bold text-left">Naxal Branch, Kathmandu</td>
                                          </tr>
                                       </tbody>
                                    </table>
                                 </div>

                                 <p className="text-justify leading-relaxed font-bold">
                                    Should you require any further information, please feel free to contact us or your Relation Manager{' '}
                                    <input 
                                       type="text" 
                                       value={docRmName}
                                       onChange={e => setDocRmName(e.target.value)}
                                       className="doc-input print-input-inline w-44 font-bold"
                                       placeholder="RM Name"
                                    />{' '}
                                    (Contact:{' '}
                                    <input 
                                       type="text" 
                                       value={docRmPhone}
                                       onChange={e => setDocRmPhone(e.target.value)}
                                       className="doc-input print-input-inline w-40 font-bold"
                                       placeholder="RM Contact Number"
                                    />
                                    ).
                                 </p>

                                 {/* Footer */}
                                 <div className="pt-8 text-right space-y-1">
                                    <p className="font-bold">Best Regards,</p>
                                    <p className="font-black text-slate-900 mt-6 pt-4">Urmila Bishwokarma</p>
                                    <p className="text-slate-600 font-medium text-xs">Accounts Manager</p>
                                    <p className="font-bold text-xs">Apollo Motors Pvt. Ltd.</p>
                                    <p className="text-slate-500 font-medium text-xs">+9779712066053</p>
                                 </div>
                              </div>
                            )}

                            {/* Solid Orange Footer Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-[2.5cm] bg-[#f26522] text-white flex flex-col justify-center items-center px-8 print-color-adjust-exact z-10">
                               <div className="font-bold text-sm tracking-wide">Apollo Motors Pvt. Ltd.</div>
                               <div className="flex justify-center items-center gap-6 mt-1.5 text-xs text-white/90">
                                  <div className="flex items-center gap-1.5">
                                     <Mail size={12} className="text-white" />
                                     <span>info.apollomotors@gmail.com</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                     <MapPin size={12} className="text-white" />
                                     <span>Maharajgunj-4, Kathmandu</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                     <Phone size={12} className="text-white" />
                                     <span>+977-9866288313</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                     </div>
                  </div>
               </div>,
               document.body
            )}
         </div>
      );
   }

   // ----------------------------------------------------
   // RENDER LIST VIEW
   // ----------------------------------------------------
   return (
      <>
         <div className="space-y-8 animate-fade-in font-sans">
         <SectionHeader
            title="Customer Registry"
            subtitle="Track vehicle supply chain, retail sales, and registration/finance milestones until full payment is settled."
         />

         {/* Navigation Tabs and Search */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            {/* Toggle tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                     activeTab === 'pending'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
               >
                  Pending Settlement ({customers.filter(c => c.carsOwned?.length > 0 && !getCustomerSettlement(c).isFullyPaid).length})
               </button>
               <button
                  onClick={() => setActiveTab('settled')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                     activeTab === 'settled'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
               >
                  Fully Settled ({customers.filter(c => c.carsOwned?.length > 0 && getCustomerSettlement(c).isFullyPaid).length})
               </button>
            </div>

            {/* Search Input & Info */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-lg justify-end w-full md:w-auto">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Search registry (name, phone)..."
                     className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none font-bold bg-slate-50 border-none transition-all focus:bg-white focus:ring-blue-500"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="text-[10px] bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-semibold text-center leading-tight">
                  ℹ️ Profiles onboarding only via Pipeline
               </div>
            </div>
         </div>

         {/* Data Table */}
         <div className="hidden lg:block">
            <Card noPadding>
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                     <tr>
                        <th className="px-6 py-4">Customer Name / Location</th>
                        <th className="px-6 py-4">Vehicle Model / Chassis (VIN)</th>
                        <th className="px-6 py-4">Payment Deal</th>
                        <th className="px-6 py-4">Financing Bank</th>
                        <th className="px-6 py-4 text-center">Settlement Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredCustomers.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-32 text-center text-slate-400 font-medium italic">
                              No registry profiles found in this tab.
                           </td>
                        </tr>
                     ) : filteredCustomers.map(cust => {
                        const settlement = getCustomerSettlement(cust);
                        const mainCar = cust.carsOwned[0];
                        const mainVehicle = vehicles.find(v => v.vin === mainCar?.vin);
                        const spec = mainVehicle?.specifications?.find((s: any) => s.label === 'allotment_details');
                        let allotment: any = null;
                        if (spec) {
                           try { allotment = JSON.parse(spec.value); } catch(e) {}
                        }
                        const paymentMethod = (mainCar as any)?.paymentMethod || allotment?.paymentMethod || (allotment?.bankName ? 'finance' : 'cash');
                        const bankName = allotment?.bankName || 'N/A (Direct Cash)';

                        return (
                           <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="font-bold text-slate-900">{cust.name}</div>
                                 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{cust.location}</div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="font-bold text-slate-700">{mainCar?.model || 'Unknown Model'}</div>
                                 <div className="text-[10px] text-slate-400 font-mono mt-0.5">{mainCar?.vin || 'No VIN'}</div>
                              </td>
                              <td className="px-6 py-4">
                                 <Badge size="sm" variant={paymentMethod === 'cash' ? 'success' : 'blue'}>
                                    {paymentMethod === 'cash' ? 'Cash Deal' : 'Finance Deal'}
                                 </Badge>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-600 text-xs">
                                 {paymentMethod === 'cash' ? '--' : bankName}
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full ${settlement.isFullyPaid ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                          style={{ width: `${settlement.percentage}%` }}
                                       ></div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-700">
                                       {settlement.completed}/{settlement.total} Steps
                                    </span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <Button 
                                    size="sm" 
                                    variant="outline" 
                                    icon={ArrowRight}
                                    onClick={() => navigate(`/customer-registry/${cust.id}`)}
                                 >
                                    Settlement Profile
                                 </Button>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </Card>
         </div>

         {/* Mobile view */}
         <div className="lg:hidden space-y-4">
            {filteredCustomers.length === 0 ? (
               <div className="text-center py-20 text-slate-400 italic">No registry profiles found in this tab</div>
            ) : filteredCustomers.map(cust => {
               const settlement = getCustomerSettlement(cust);
               const mainCar = cust.carsOwned[0];
               return (
                  <div 
                     key={cust.id} 
                     onClick={() => navigate(`/customer-registry/${cust.id}`)}
                     className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all"
                  >
                     <div className="flex justify-between items-start mb-3">
                        <div>
                           <h4 className="font-black text-slate-900">{cust.name}</h4>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{cust.location}</p>
                        </div>
                        <Badge variant={settlement.isFullyPaid ? 'success' : 'blue'} size="sm">
                           {settlement.percentage}% Settled
                        </Badge>
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                        <div>
                           <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Model</p>
                           <p className="text-xs font-bold text-slate-700 truncate">{mainCar?.model || 'None'}</p>
                        </div>
                        <div>
                           <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Settlement Steps</p>
                           <p className="text-xs font-bold text-slate-700">
                              {settlement.completed} of {settlement.total}
                           </p>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      {/* Customer Onboarding & Allotment Modal */}
      {isOnboardingModalOpen && createPortal(
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in text-slate-700 font-sans">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
               {/* Header */}
               <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between shrink-0">
                  <div>
                     <h2 className="text-2xl font-black">New Customer Registry & Allotment</h2>
                     <p className="text-blue-100 text-sm mt-1">Create customer profile, add to showroom pipeline, and allot a vehicle</p>
                  </div>
                  <button 
                     onClick={() => {
                        setIsOnboardingModalOpen(false);
                        setSelectedLeadId('');
                     }} 
                     className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white bg-transparent border-none"
                  >
                     <X size={24} />
                  </button>
               </div>

               {/* Form */}
               <form onSubmit={handleCreateOnboarding} className="p-6 overflow-y-auto flex-1 text-left">
                  <div className="space-y-6">
                     {/* Import from Showroom Pipeline */}
                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-2">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                           <ClipboardCheck size={14} className="text-blue-600" />
                           Import from Showroom Pipeline (Existing Lead)
                        </label>
                        <div className="relative">
                           <select
                              value={selectedLeadId}
                              onChange={(e) => setSelectedLeadId(e.target.value)}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white text-xs font-bold text-slate-800"
                           >
                              <option value="">-- Create New Customer (Not in Pipeline) --</option>
                              {leads.map(lead => (
                                 <option key={lead.id} value={lead.id}>
                                    {lead.name} ({lead.phone}) - {lead.modelInterest || 'No Model Interest'} [{lead.status || 'Active'}]
                                 </option>
                              ))}
                           </select>
                           <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                           Selecting an existing pipeline lead will automatically populate their contact, budget, assignment, and exchange details.
                        </p>
                     </div>

                     {/* Customer Information */}
                     <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                           <User size={16} className="text-blue-600" />
                           Customer Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Full Name *</label>
                              <input
                                 type="text"
                                 required
                                 value={allotmentFormData.name}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, name: e.target.value })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                 placeholder="e.g., Vivek Dahal"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Phone Number *</label>
                              <input
                                 type="tel"
                                 required
                                 value={allotmentFormData.phone}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, phone: e.target.value })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                 placeholder="98XXXXXXXX"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Email (Optional)</label>
                              <input
                                 type="email"
                                 value={allotmentFormData.email}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, email: e.target.value })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                 placeholder="customer@example.com"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Company Name (Optional)</label>
                              <input
                                 type="text"
                                 value={allotmentFormData.companyName}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, companyName: e.target.value })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                 placeholder="e.g., ABC Pvt Ltd"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">PAN Number (Optional)</label>
                              <input
                                 type="text"
                                 value={allotmentFormData.panNumber}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, panNumber: e.target.value })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                 placeholder="Enter PAN"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Address *</label>
                              <input
                                 type="text"
                                 required
                                 value={allotmentFormData.address}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, address: e.target.value })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                 placeholder="e.g., Maharajgunj, Kathmandu"
                              />
                           </div>
                        </div>
                     </div>

                     {/* Vehicle Allotment */}
                     <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                           <Car size={16} className="text-blue-600" />
                           Vehicle Allotment
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Allot Available Vehicle *</label>
                              <div className="relative">
                                 <select
                                    required
                                    value={allotmentFormData.allottedVehicleId}
                                    onChange={(e) => setAllotmentFormData({ ...allotmentFormData, allottedVehicleId: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white text-xs font-bold"
                                 >
                                    <option value="">Select in-stock vehicle...</option>
                                    {availableVehicles.map(v => (
                                       <option key={v.id} value={v.id}>
                                          {v.model} {v.variant} ({v.color}) - VIN: {v.vin}
                                       </option>
                                    ))}
                                 </select>
                                 <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Deal Price (NPR)</label>
                              <input
                                 type="number"
                                 value={allotmentFormData.budget}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, budget: e.target.value })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                 placeholder="Enter final price"
                              />
                           </div>
                        </div>
                     </div>

                     {/* Pipeline & Assignment */}
                     <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                           <FileText size={16} className="text-blue-600" />
                           Pipeline Details & Assignment
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Enquiry Source *</label>
                              <select
                                 value={allotmentFormData.source}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, source: e.target.value })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-white"
                              >
                                 <option value="Showroom Walk In">Showroom Walk In</option>
                                 <option value="Facebook">Facebook</option>
                                 <option value="WhatsApp">WhatsApp</option>
                                 <option value="Referral">Referral</option>
                                 <option value="Website">Website</option>
                                 <option value="Others">Others</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Temperature *</label>
                              <select
                                 value={allotmentFormData.temperature}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, temperature: e.target.value as 'Hot' | 'Warm' | 'Cold' })}
                                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-white"
                              >
                                 <option value="Hot">🔥 Hot (Ready to Buy)</option>
                                 <option value="Warm">⚡ Warm (Interested)</option>
                                 <option value="Cold">❄️ Cold (Just Looking)</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Assign Sales Consultant</label>
                              <div className="relative">
                                 <select
                                    value={allotmentFormData.ownerId}
                                    onChange={(e) => setAllotmentFormData({ ...allotmentFormData, ownerId: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white text-xs font-bold"
                                 >
                                    <option value="">Leave Unassigned</option>
                                    {salesReps.map(rep => (
                                       <option key={rep.id} value={rep.id}>{rep.name} ({rep.role})</option>
                                    ))}
                                 </select>
                                 <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Exchange Details */}
                     <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                           <RefreshCw size={16} className="text-blue-600" />
                           Vehicle Exchange
                        </h3>
                        <div className="space-y-4">
                           <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                 type="checkbox"
                                 checked={allotmentFormData.hasExchange}
                                 onChange={(e) => setAllotmentFormData({ ...allotmentFormData, hasExchange: e.target.checked })}
                                 className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-sm font-bold text-slate-700">Customer wants to exchange their current vehicle</span>
                           </label>

                           {allotmentFormData.hasExchange && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8 animate-fade-in">
                                 <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Current Vehicle Model</label>
                                    <input
                                       type="text"
                                       value={allotmentFormData.exchangeVehicle}
                                       onChange={(e) => setAllotmentFormData({ ...allotmentFormData, exchangeVehicle: e.target.value })}
                                       className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                       placeholder="e.g., Hyundai Creta"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Expected Value (NPR)</label>
                                    <input
                                       type="number"
                                       value={allotmentFormData.expectedValue}
                                       onChange={(e) => setAllotmentFormData({ ...allotmentFormData, expectedValue: e.target.value })}
                                       className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                                       placeholder="e.g., 2800000"
                                    />
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Next Steps */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-600 mb-2">Next Follow-up Date</label>
                           <input
                              type="date"
                              value={allotmentFormData.nextFollowUpDate}
                              onChange={(e) => setAllotmentFormData({ ...allotmentFormData, nextFollowUpDate: e.target.value })}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-600 mb-2">Initial Remarks</label>
                           <textarea
                              value={allotmentFormData.remarks}
                              onChange={(e) => setAllotmentFormData({ ...allotmentFormData, remarks: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs font-bold bg-slate-50 resize-none"
                              placeholder="Initial customer requirements or notes..."
                           />
                        </div>
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100 shrink-0">
                     <Button type="button" variant="secondary" onClick={() => {
                        setIsOnboardingModalOpen(false);
                        setSelectedLeadId('');
                     }} className="flex-1">
                        Cancel
                     </Button>
                     <Button 
                        type="submit" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black"
                        isLoading={isSubmittingAllotment}
                     >
                        Allot Vehicle & Save Profile
                     </Button>
                  </div>
               </form>
            </div>
         </div>,
         document.body
      )}
      </>
   );
};

export default CustomerRegistry;


import React, { useState, useMemo } from 'react';
import { Search, MapPin, Phone, Mail, Car, X, Plus, ChevronRight, Users } from 'lucide-react';
import { useCustomers, useCreateCustomer } from '../api';
import { Customer } from '../types';
import { Card, Button, Badge, SectionHeader, Input, Skeleton, useToast } from '../UI';

const CustomerDrawer: React.FC<{ customer: Customer | null; onClose: () => void }> = ({ customer, onClose }) => {
   if (!customer) return null;

   return (
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
         <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>

         <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto border-l border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
               <div className="flex gap-4 items-center">
                  <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-900/20">
                     {customer.name.charAt(0)}
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-slate-900 tracking-tight">{customer.name}</h2>
                     <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mt-1">
                        <MapPin size={14} /> {customer.location}
                     </div>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="p-6 space-y-8">
               <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Lifetime Value</p>
                     <p className="text-lg font-black text-slate-900">₹{(customer.ltv / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Referrals</p>
                     <p className="text-lg font-black text-slate-900">{customer.referrals}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Units Owned</p>
                     <p className="text-lg font-black text-slate-900">{customer.carsOwned.length}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Identity</h3>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                     <div className="flex items-center gap-3">
                        <Phone size={18} className="text-slate-400" />
                        <span className="text-slate-700 font-bold">{customer.phone}</span>
                        <Button size="sm" variant="outline" className="ml-auto">Call</Button>
                     </div>
                     <div className="flex items-center gap-3">
                        <Mail size={18} className="text-slate-400" />
                        <span className="text-slate-700 font-bold">{customer.email}</span>
                        <Button size="sm" variant="outline" className="ml-auto">Email</Button>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Garage</h3>
                  <div className="space-y-3">
                     {customer.carsOwned.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                           <Car size={24} className="text-slate-300 mx-auto mb-2" />
                           <p className="text-sm text-slate-500 font-medium">No active vehicles found</p>
                        </div>
                     ) : customer.carsOwned.map((car, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 border border-slate-200 rounded-2xl bg-slate-50">
                           <div className="flex items-center gap-3">
                              <Car size={20} className="text-blue-600" />
                              <div>
                                 <p className="font-bold text-slate-800">{car.model}</p>
                                 <p className="text-[10px] text-slate-500 font-black">{car.plate}</p>
                              </div>
                           </div>
                           <Badge variant={car.status === 'Active' ? 'success' : 'neutral'}>{car.status}</Badge>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto flex justify-end gap-3">
               <Button variant="outline" onClick={onClose}>Close</Button>
               <Button>Open Sale Card</Button>
            </div>
         </div>
      </div>
   );
};

const AddCustomerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
   const createCustomer = useCreateCustomer();
   const { addToast } = useToast();
   const [formData, setFormData] = useState<Partial<Customer>>({
      name: '', phone: '', email: '', location: '', carsOwned: []
   });

   if (!isOpen) return null;

   const handleSave = async () => {
      if (!formData.name || !formData.phone) {
         addToast('Name and Phone are required', 'error');
         return;
      }
      try {
         await createCustomer.mutateAsync(formData);
         addToast('Customer profile created', 'success');
         onClose();
      } catch (err) {
         addToast('Failed to create customer', 'error');
      }
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
         <Card className="relative w-full max-w-lg bg-white shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-slate-900">Add New Customer</h2>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-4">
               <Input label="Full Name" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
               <Input label="Phone Number" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
               <Input label="Email Address" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
               <div className="grid grid-cols-2 gap-4">
                  <Input label="Company Name (Optional)" placeholder="e.g. ABC Pvt Ltd" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                  <Input label="PAN Number (Optional)" placeholder="9 Digit Number" value={formData.panNumber} onChange={e => setFormData({ ...formData, panNumber: e.target.value })} />
               </div>
               <Input label="Primary Location" placeholder="e.g. South Delhi" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div className="flex gap-3 mt-8">
               <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
               <Button className="flex-1" onClick={handleSave}>Create Profile</Button>
            </div>
         </Card>
      </div>
   );
};

const Customers: React.FC = () => {
   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const { data: customers = [], isLoading } = useCustomers();

   const filteredCustomers = useMemo(() => {
      return customers.filter(cust => {
         const matchesSearch = cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cust.phone.includes(searchTerm);
         if (!matchesSearch) return false;
         return true;
      });
   }, [searchTerm, customers]);

   if (isLoading) {
      return (
         <div className="space-y-6 animate-fade-in">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-14" />
            <Skeleton className="h-96" />
         </div>
      );
   }

   return (
      <div className="space-y-8 animate-fade-in font-sans">
         <SectionHeader
            title="Customer CRM"
            subtitle="Unified customer identity, lifetime value tracking, and retention."
            actions={<Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>Add Customer</Button>}
         />

         <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
         <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 min-w-[300px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <input
                  type="text"
                  placeholder="Search customers (name, phone)..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-bold bg-slate-50 border-none transition-all focus:bg-white focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <Card noPadding>
            <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                  <tr>
                     <th className="px-6 py-4">Name / Location</th>
                     <th className="px-6 py-4">Current Vehicle</th>
                     <th className="px-6 py-4">Next Service</th>
                     <th className="px-6 py-4 text-center">LTV</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                           <div className="flex flex-col items-center">
                              <div className="p-4 bg-slate-100 rounded-2xl mb-4">
                                 <Users size={32} className="text-slate-400" />
                              </div>
                              <p className="font-semibold text-slate-700">No customers found</p>
                              <p className="text-sm text-slate-500 mt-1">
                                 {searchTerm ? 'Try adjusting your search' : 'Add your first customer to get started'}
                              </p>
                           </div>
                        </td>
                     </tr>
                  ) : filteredCustomers.map(cust => (
                     <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="font-bold text-slate-900">{cust.name}</div>
                           <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{cust.location}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-600">
                           {cust.carsOwned[0]?.model || '--'}
                        </td>
                        <td className="px-6 py-4">
                           <Badge size="sm" variant={cust.nextServiceDueAt ? 'blue' : 'neutral'}>{cust.nextServiceDueAt || 'Not Scheduled'}</Badge>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-slate-900">₹{(cust.ltv / 100000).toFixed(1)}L</td>
                        <td className="px-6 py-4 text-right">
                           <Button size="sm" variant="ghost" onClick={() => setSelectedCustomer(cust)}>Profile</Button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </Card>

         <CustomerDrawer customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      </div>
   );
};

export default Customers;

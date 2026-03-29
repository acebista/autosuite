import React, { useState } from 'react';
import { User, Settings as SettingsIcon, Share2, Plus, Globe, Bell, MessageSquare, Facebook, Smartphone, Shield } from 'lucide-react';
import { Card, Button, Badge, SectionHeader, useToast } from '../UI';
import { useUsers } from '../api';
import { useAuth } from '../AuthContext';
import { useAuthStore } from '../lib/store';
import { updateOrganization } from '../lib/rbac';
import { supabase } from '../lib/supabase';

const IntegrationCard: React.FC<{ name: string; desc: string; icon: any; connected: boolean }> = ({ name, desc, icon: Icon, connected }) => (
   <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-full bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
         <div className={`p-3 rounded-xl ${connected ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
            <Icon size={24} />
         </div>
         <Badge variant={connected ? 'success' : 'neutral'}>{connected ? 'Connected' : 'Not Linked'}</Badge>
      </div>
      <div>
         <h4 className="font-bold text-slate-900">{name}</h4>
         <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed font-medium">{desc}</p>
      </div>
      <Button variant={connected ? 'outline' : 'primary'} size="sm" className="w-full">
         {connected ? 'Configure' : 'Connect'}
      </Button>
   </div>
);

const Settings: React.FC = () => {
    const { user, orgId } = useAuth();
    const { setUser } = useAuthStore();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'general' | 'users' | 'integrations' | 'developer'>('general');
    const [currentUserRole, setCurrentUserRole] = useState<'Admin' | 'Sales'>(user?.role === 'Admin' || user?.role === 'SuperAdmin' ? 'Admin' : 'Sales');
    const [useMockData, setUseMockData] = useState(localStorage.getItem('useMockData') === 'true');
    const { data: users = [] } = useUsers();

    // Dealership Profile States
    const [brandName, setBrandName] = useState(user?.orgName || '');
    const [brandEmail, setBrandEmail] = useState(user?.orgEmail || user?.email || '');
    const [brandPhone, setBrandPhone] = useState(user?.orgPhone || '');
    const [brandAddress, setBrandAddress] = useState(user?.orgAddress || '');
    const [brandLogo, setBrandLogo] = useState(user?.orgLogo || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveOrganization = async () => {
        if (!orgId) return;
        setIsSaving(true);
        try {
            const res = await updateOrganization(orgId, {
                name: brandName,
                email: brandEmail,
                phone: brandPhone,
                address: brandAddress,
                logo_url: brandLogo
            });
            
            if (res.error) throw new Error(res.error);
            
            // Update local store immediately for UI consistency
            if (user) {
                setUser({
                    ...user,
                    orgName: brandName,
                    orgEmail: brandEmail,
                    orgPhone: brandPhone,
                    orgAddress: brandAddress,
                    orgLogo: brandLogo
                });
            }

            addToast('Dealership branding updated successfully!', 'success');
        } catch (err: any) {
            addToast(`Failed to update branding: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

   const tabs = [
      { id: 'general', label: 'General', icon: SettingsIcon },
      { id: 'users', label: 'Users & Roles', icon: User },
      { id: 'integrations', label: 'Integrations', icon: Share2 },
      { id: 'developer', label: 'Developer', icon: Shield },
   ];

   const handleMockDataToggle = () => {
      const newValue = !useMockData;
      setUseMockData(newValue);
      localStorage.setItem('useMockData', String(newValue));
      // Force page reload to apply changes
      window.location.reload();
   };

   return (
      <div className="space-y-6">
         <SectionHeader title="System Settings" subtitle="Configure your dealership preferences and team access." />

         <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-4">
               <Card noPadding>
                  <nav className="flex flex-col p-2">
                     {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                           <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                           >
                              <Icon size={18} />
                              {tab.label}
                           </button>
                        )
                     })}
                  </nav>
               </Card>

               {/* Role Simulator */}
               <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-amber-800 mb-2 font-black uppercase text-[10px] tracking-widest">
                     <Shield size={14} />
                     <span>RBAC Demo Mode</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mb-3 font-medium">Switch roles to test feature permissions.</p>
                  <div className="flex bg-white rounded-xl p-1 border border-amber-200">
                     <button onClick={() => setCurrentUserRole('Admin')} className={`flex-1 text-[10px] py-1.5 rounded-lg font-black uppercase tracking-tight transition-all ${currentUserRole === 'Admin' ? 'bg-amber-100 text-amber-800' : 'text-slate-500'}`}>Admin</button>
                     <button onClick={() => setCurrentUserRole('Sales')} className={`flex-1 text-[10px] py-1.5 rounded-lg font-black uppercase tracking-tight transition-all ${currentUserRole === 'Sales' ? 'bg-amber-100 text-amber-800' : 'text-slate-500'}`}>Sales</button>
                  </div>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {activeTab === 'general' && (
                  <div className="space-y-6 animate-fade-in">
                     <Card>
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                           <h3 className="text-lg font-bold text-slate-900">Dealership Branding</h3>
                           <Badge variant={user?.role === 'Admin' || user?.role === 'SuperAdmin' ? 'success' : 'neutral'}>
                              {user?.role === 'Admin' || user?.role === 'SuperAdmin' ? 'Admin Access' : 'Read Only'}
                           </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Official Dealership Name</label>
                              <input 
                                 type="text" 
                                 value={brandName} 
                                 onChange={(e) => setBrandName(e.target.value)}
                                 disabled={!(user?.role === 'Admin' || user?.role === 'SuperAdmin')}
                                 placeholder="e.g. Lalitpur Auto Works"
                                 className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white disabled:opacity-60" 
                              />
                              <p className="text-[10px] text-slate-400 mt-1.5 font-medium italic">This name appears on all quotations and invoices.</p>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Primary Contact Email</label>
                              <input 
                                 type="email" 
                                 value={brandEmail} 
                                 onChange={(e) => setBrandEmail(e.target.value)}
                                 disabled={!(user?.role === 'Admin' || user?.role === 'SuperAdmin')}
                                 placeholder="sales@dealership.com"
                                 className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white disabled:opacity-60" 
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Official Phone Number</label>
                              <input 
                                 type="text" 
                                 value={brandPhone} 
                                 onChange={(e) => setBrandPhone(e.target.value)}
                                 disabled={!(user?.role === 'Admin' || user?.role === 'SuperAdmin')}
                                 placeholder="+977-XXXXXXXXXX"
                                 className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white disabled:opacity-60" 
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Logo URL</label>
                              <input 
                                 type="text" 
                                 value={brandLogo} 
                                 onChange={(e) => setBrandLogo(e.target.value)}
                                 disabled={!(user?.role === 'Admin' || user?.role === 'SuperAdmin')}
                                 placeholder="https://.../logo.png"
                                 className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white disabled:opacity-60" 
                              />
                              {brandLogo && (
                                 <div className="mt-2 flex items-center gap-2 p-2 bg-slate-100 rounded-lg">
                                    <img src={brandLogo} alt="Preview" className="h-6 object-contain" />
                                    <span className="text-[10px] text-slate-500 font-bold">Logo Preview</span>
                                 </div>
                              )}
                           </div>
                           <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business Address</label>
                              <textarea 
                                 value={brandAddress} 
                                 onChange={(e) => setBrandAddress(e.target.value)}
                                 disabled={!(user?.role === 'Admin' || user?.role === 'SuperAdmin')}
                                 placeholder="Full address for header section"
                                 rows={2}
                                 className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white resize-none disabled:opacity-60" 
                              />
                           </div>
                        </div>
                        
                        {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
                           <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                              <Button 
                                 onClick={handleSaveOrganization} 
                                 disabled={isSaving}
                                 className="px-8"
                              >
                                 {isSaving ? 'Saving...' : 'Update Dealership Profile'}
                              </Button>
                           </div>
                        )}
                     </Card>
                  </div>
               )}

               {activeTab === 'developer' && (
                  <div className="space-y-6 animate-fade-in">
                     <Card>
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                           <div className="p-2 bg-purple-50 rounded-xl">
                              <Shield size={20} className="text-purple-600" />
                           </div>
                           <div>
                              <h3 className="text-lg font-bold text-slate-900">Developer Settings</h3>
                              <p className="text-xs text-slate-500 font-medium">Testing and debugging options</p>
                           </div>
                        </div>

                        <div className="space-y-6">
                           {/* Mock Data Toggle */}
                           <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                              <div className="flex items-start justify-between mb-4">
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                       <h4 className="text-sm font-black text-slate-900">Mock Data Mode</h4>
                                       <Badge variant={useMockData ? 'success' : 'neutral'}>
                                          {useMockData ? 'ENABLED' : 'DISABLED'}
                                       </Badge>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                       When enabled, the application will use comprehensive mock data instead of live Supabase data.
                                       Perfect for testing UI components, demos, and development without affecting your database.
                                    </p>
                                 </div>
                              </div>

                              <div className="flex items-center gap-3 pt-4 border-t border-blue-200">
                                 <Button
                                    variant={useMockData ? 'danger' : 'primary'}
                                    onClick={handleMockDataToggle}
                                    className="flex-1"
                                 >
                                    {useMockData ? 'Disable Mock Data' : 'Enable Mock Data'}
                                 </Button>
                              </div>
                           </div>

                           {/* Mock Data Info */}
                           {useMockData && (
                              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                                 <h4 className="text-xs font-black text-green-900 uppercase tracking-widest mb-3">Mock Data Includes:</h4>
                                 <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       <span className="font-bold text-green-800">3 Sample Leads</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       <span className="font-bold text-green-800">4 Vehicles</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       <span className="font-bold text-green-800">3 Service Jobs</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       <span className="font-bold text-green-800">4 Customers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       <span className="font-bold text-green-800">3 Invoices</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       <span className="font-bold text-green-800">4 Parts</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       <span className="font-bold text-green-800">3 Campaigns</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                       <span className="font-bold text-green-800">3 Appointments</span>
                                    </div>
                                 </div>
                              </div>
                           )}

                           {/* Warning */}
                           <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                              <div className="flex gap-3">
                                 <div className="text-amber-600 mt-0.5">
                                    <Bell size={16} />
                                 </div>
                                 <div>
                                    <h4 className="text-xs font-black text-amber-900 mb-1">Important Note</h4>
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                       Toggling mock data will reload the page. Any unsaved changes will be lost.
                                       Mock data is read-only and changes won't persist after disabling.
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </Card>
                  </div>
               )}

               {activeTab === 'users' && (
                  <div className="space-y-6 animate-fade-in">
                     <div className="flex justify-between items-center">
                        <div>
                           <h3 className="text-lg font-bold text-slate-900">Team Members</h3>
                           <p className="text-sm text-slate-500 font-medium">Manage workshop and showroom access.</p>
                        </div>
                        {currentUserRole === 'Admin' && (
                           <Button icon={Plus} onClick={() => window.location.href = '/users'} size="sm">
                              Add User
                           </Button>
                        )}
                     </div>
                     <Card noPadding>
                        <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                              <tr>
                                 <th className="px-6 py-4">Name</th>
                                 <th className="px-6 py-4">Role</th>
                                 <th className="px-6 py-4">Status</th>
                                 {currentUserRole === 'Admin' && <th className="px-6 py-4">Actions</th>}
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {users.map(user => (
                                 <tr key={user.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                       <div className="font-bold text-slate-900">{user.name}</div>
                                       <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4"><Badge variant="blue">{user.role}</Badge></td>
                                    <td className="px-6 py-4">
                                       <Badge variant={user.status === 'Active' ? 'success' : 'neutral'}>{user.status}</Badge>
                                    </td>
                                    {currentUserRole === 'Admin' && (
                                       <td className="px-6 py-4">
                                          <button className="text-slate-400 hover:text-blue-600 font-bold text-[10px] uppercase tracking-wider mr-4">Edit</button>
                                          <button className="text-slate-400 hover:text-red-600 font-bold text-[10px] uppercase tracking-wider">Remove</button>
                                       </td>
                                    )}
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </Card>
                  </div>
               )}

               {activeTab === 'integrations' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                     <IntegrationCard
                        name="WhatsApp Business"
                        desc="Automated follow-ups and lead response engine via Meta Cloud API."
                        icon={MessageSquare}
                        connected={true}
                     />
                     <IntegrationCard
                        name="Meta Ads Manager"
                        desc="Direct ingestion of Facebook Lead Gen forms into Sales Pipeline."
                        icon={Facebook}
                        connected={true}
                     />
                     <IntegrationCard
                        name="Google Search Console"
                        desc="Conversion tracking for showroom website traffic."
                        icon={Globe}
                        connected={false}
                     />
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default Settings;
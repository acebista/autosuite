import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, Share2, Plus, Globe, Bell, MessageSquare, Facebook, Smartphone, Shield, FileText, Image as ImageIcon, Check } from 'lucide-react';
import { Card, Button, Badge, SectionHeader, useToast } from '../UI';
import { useUsers } from '../api';
import { useAuth } from '../AuthContext';
import { useAuthStore } from '../lib/store';
import { updateOrganization } from '../lib/rbac';

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
    const { data: users = [] } = useUsers();

    // Dealership Profile States
    const [brandName, setBrandName] = useState(user?.orgName || '');
    const [brandEmail, setBrandEmail] = useState(user?.orgEmail || user?.email || '');
    const [brandPhone, setBrandPhone] = useState(user?.orgPhone || '');
    const [brandAddress, setBrandAddress] = useState(user?.orgAddress || '');
    const [brandLogo, setBrandLogo] = useState(user?.orgLogo || '');
    const [letterheadBg, setLetterheadBg] = useState<string>(() => localStorage.getItem('autosuite_letterhead_bg') || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
       const storedBg = localStorage.getItem('autosuite_letterhead_bg');
       if (storedBg) setLetterheadBg(storedBg);
    }, []);

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

            if (letterheadBg) {
               localStorage.setItem('autosuite_letterhead_bg', letterheadBg);
            } else {
               localStorage.removeItem('autosuite_letterhead_bg');
            }
            
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

            addToast('Dealership branding and letterhead template saved successfully!', 'success');
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
   ];

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
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {activeTab === 'general' && (
                  <div className="space-y-6 animate-fade-in">
                     <Card>
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                           <h3 className="text-lg font-bold text-slate-900">Dealership Branding & Letterhead</h3>
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
                                 placeholder="e.g. Apollo Motors Pvt. Ltd."
                                 className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white disabled:opacity-60" 
                              />
                              <p className="text-[10px] text-slate-400 mt-1.5 font-medium italic">This name appears on all official documents, quotations, and invoices.</p>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Primary Contact Email</label>
                              <input 
                                 type="email" 
                                 value={brandEmail} 
                                 onChange={(e) => setBrandEmail(e.target.value)}
                                 disabled={!(user?.role === 'Admin' || user?.role === 'SuperAdmin')}
                                 placeholder="info.apollomotors@gmail.com"
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
                                 placeholder="+977-1-4412066"
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
                                 placeholder="Maharajgunj-4, Kathmandu, Nepal"
                                 rows={2}
                                 className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white resize-none disabled:opacity-60" 
                              />
                           </div>

                           {/* Custom Letterhead Background Upload Section */}
                           <div className="md:col-span-2 border-t border-slate-200 pt-6">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                 <ImageIcon size={14} className="text-blue-600" /> Custom PDF / Image Letterhead Background Template
                              </label>
                              <p className="text-xs text-slate-500 mb-3 font-medium">
                                 Upload your official company letterhead PDF or PNG/JPG image background. Document Vault will overlay GRN, Allotment Letters, and Invoices directly onto your exact letterhead template.
                              </p>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                 <input 
                                    type="text" 
                                    value={letterheadBg} 
                                    onChange={(e) => {
                                       setLetterheadBg(e.target.value);
                                       localStorage.setItem('autosuite_letterhead_bg', e.target.value);
                                    }}
                                    placeholder="Enter Image/PDF URL or click Upload File"
                                    className="flex-1 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white" 
                                 />
                                 <label className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors">
                                    <FileText size={16} />
                                    <span>Upload Letterhead Image/PDF</span>
                                    <input
                                       type="file"
                                       accept="image/*,.pdf"
                                       className="hidden"
                                       onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                             const reader = new FileReader();
                                             reader.onload = (ev) => {
                                                const result = ev.target?.result as string;
                                                setLetterheadBg(result);
                                                localStorage.setItem('autosuite_letterhead_bg', result);
                                                addToast('Custom letterhead background template saved!', 'success');
                                             };
                                             reader.readAsDataURL(file);
                                          }
                                       }}
                                    />
                                 </label>
                              </div>

                              {letterheadBg && (
                                 <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                       <img src={letterheadBg} alt="Letterhead Background Template" className="h-14 w-10 object-cover border border-blue-300 rounded shadow-sm bg-white" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                       <div>
                                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                                             <Check size={14} className="text-emerald-600" /> Custom Letterhead Template Active
                                          </div>
                                          <p className="text-[11px] text-blue-700 mt-0.5 font-medium">This background template will automatically be used in Document Vault print previews.</p>
                                       </div>
                                    </div>
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setLetterheadBg('');
                                          localStorage.removeItem('autosuite_letterhead_bg');
                                          addToast('Custom letterhead template removed.', 'info');
                                       }}
                                       className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline border-none bg-transparent cursor-pointer px-2 py-1"
                                    >
                                       Remove Template
                                    </button>
                                 </div>
                              )}
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
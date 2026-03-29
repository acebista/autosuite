import React, { useState } from 'react';
import { useCampaigns } from '../api';
import { PageHeader, Card, Badge, Button, Skeleton, Input, Select, useToast } from '../UI';
import { Megaphone, TrendingUp, Target, DollarSign, ArrowUpRight, X, Send } from 'lucide-react';

const Marketing: React.FC = () => {
   const { data: campaigns, isLoading } = useCampaigns();
   const { addToast } = useToast();
   const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
   const [isSmsBlastOpen, setIsSmsBlastOpen] = useState(false);
   const [campaignForm, setCampaignForm] = useState({
      name: '',
      channel: 'WhatsApp' as 'WhatsApp' | 'Facebook' | 'SMS' | 'Email',
      budget: ''
   });
   const [smsForm, setSmsForm] = useState({
      audience: 'truck-owners',
      message: 'New Hilux stock has arrived! Upgrade your 3+ year old truck today. Visit our showroom for exclusive offers. Reply STOP to opt out.'
   });

   const handleCreateCampaign = () => {
      if (!campaignForm.name || !campaignForm.budget) {
         addToast('Please fill in all fields', 'error');
         return;
      }
      // In a real app, this would call an API
      addToast(`Campaign "${campaignForm.name}" created successfully!`, 'success');
      setIsNewCampaignOpen(false);
      setCampaignForm({ name: '', channel: 'WhatsApp', budget: '' });
   };

   const handleSendSmsBlast = () => {
      if (!smsForm.message) {
         addToast('Please enter a message', 'error');
         return;
      }
      // In a real app, this would call an SMS API
      addToast('SMS blast scheduled for 45 recipients!', 'success');
      setIsSmsBlastOpen(false);
   };

   if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-96" /></div>;

   return (
      <div className="space-y-8 animate-fade-in">
         <PageHeader
            title="Marketing ROI"
            subtitle="Campaign performance and revenue attribution chain."
            actions={<Button icon={Megaphone} onClick={() => setIsNewCampaignOpen(true)}>New Campaign</Button>}
         />

         {/* New Campaign Modal */}
         {isNewCampaignOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNewCampaignOpen(false)}></div>
               <Card className="relative w-full max-w-lg bg-white shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl">
                           <Megaphone size={20} className="text-blue-600" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Create New Campaign</h2>
                     </div>
                     <button onClick={() => setIsNewCampaignOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={18} />
                     </button>
                  </div>
                  <div className="space-y-4">
                     <Input
                        label="Campaign Name"
                        placeholder="e.g. Year-End Clearance Sale"
                        value={campaignForm.name}
                        onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
                     />
                     <Select
                        label="Channel"
                        value={campaignForm.channel}
                        onChange={e => setCampaignForm({ ...campaignForm, channel: e.target.value as any })}
                        options={[
                           { value: 'WhatsApp', label: 'WhatsApp Business' },
                           { value: 'Facebook', label: 'Facebook Ads' },
                           { value: 'SMS', label: 'SMS Broadcast' },
                           { value: 'Email', label: 'Email Marketing' }
                        ]}
                     />
                     <Input
                        label="Budget (₹)"
                        type="number"
                        placeholder="50000"
                        value={campaignForm.budget}
                        onChange={e => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                     />
                  </div>
                  <div className="flex gap-3 mt-8">
                     <Button variant="outline" className="flex-1" onClick={() => setIsNewCampaignOpen(false)}>Cancel</Button>
                     <Button className="flex-1" onClick={handleCreateCampaign}>Create Campaign</Button>
                  </div>
               </Card>
            </div>
         )}

         {/* SMS Blast Modal */}
         {isSmsBlastOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSmsBlastOpen(false)}></div>
               <Card className="relative w-full max-w-lg bg-white shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-xl">
                           <Send size={20} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Generate SMS Blast</h2>
                     </div>
                     <button onClick={() => setIsSmsBlastOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={18} />
                     </button>
                  </div>
                  <div className="space-y-4">
                     <Select
                        label="Target Audience"
                        value={smsForm.audience}
                        onChange={e => setSmsForm({ ...smsForm, audience: e.target.value })}
                        options={[
                           { value: 'truck-owners', label: 'Truck Owners (45 contacts)' },
                           { value: 'suv-prospects', label: 'SUV Prospects (78 contacts)' },
                           { value: 'service-due', label: 'Service Due This Month (32 contacts)' },
                           { value: 'all-customers', label: 'All Customers (234 contacts)' }
                        ]}
                     />
                     <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Message Content</label>
                        <textarea
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium placeholder:slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                           rows={4}
                           value={smsForm.message}
                           onChange={e => setSmsForm({ ...smsForm, message: e.target.value })}
                           maxLength={160}
                        />
                        <p className="text-xs text-slate-400 mt-1 font-medium">{smsForm.message.length}/160 characters</p>
                     </div>
                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-900 mb-1">Preview</p>
                        <p className="text-sm text-blue-800 font-medium">{smsForm.message}</p>
                     </div>
                  </div>
                  <div className="flex gap-3 mt-8">
                     <Button variant="outline" className="flex-1" onClick={() => setIsSmsBlastOpen(false)}>Cancel</Button>
                     <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSendSmsBlast}>
                        Send to {smsForm.audience === 'truck-owners' ? '45' : smsForm.audience === 'suv-prospects' ? '78' : smsForm.audience === 'service-due' ? '32' : '234'} Recipients
                     </Button>
                  </div>
               </Card>
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <Card>
                  <h3 className="text-lg font-black text-slate-900 mb-6">Active Performance Chain</h3>
                  <div className="space-y-4">
                     {campaigns?.map(camp => (
                        <div key={camp.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all group">
                           <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-3">
                                 <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20">
                                    <Target size={20} />
                                 </div>
                                 <div>
                                    <h4 className="font-black text-slate-900">{camp.name}</h4>
                                    <p className="text-xs font-bold text-slate-400">{camp.channel} • {camp.status}</p>
                                 </div>
                              </div>
                              <Badge variant="success">ROI {camp.roi}%</Badge>
                           </div>

                           <div className="grid grid-cols-4 gap-4">
                              {[
                                 { label: 'Spend', val: `₹${camp.spend.toLocaleString()}`, icon: DollarSign },
                                 { label: 'Leads', val: camp.leadsGenerated, icon: TrendingUp },
                                 { label: 'Conv.', val: `${camp.conversionRate}%`, icon: ArrowUpRight },
                                 { label: 'Revenue', val: `₹${(camp.revenueGenerated / 100000).toFixed(1)}L`, icon: DollarSign }
                              ].map(m => (
                                 <div key={m.label} className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{m.label}</p>
                                    <p className="text-sm font-black text-slate-900">{m.val}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>

            <div className="space-y-8">
               <Card className="bg-slate-900 text-white border-none">
                  <h3 className="text-lg font-black mb-6">AI Ad Engine</h3>
                  <div className="space-y-6">
                     <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Top Opportunity</label>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                           <p className="text-sm font-bold text-slate-300">New Hilux Stock arrived.</p>
                           <p className="text-[11px] text-slate-500 mt-1">Found 45 existing truck owners with {'>'}3yr old models.</p>
                        </div>
                     </div>
                     <Button variant="secondary" size="sm" className="w-full" onClick={() => setIsSmsBlastOpen(true)}>
                        Generate SMS Blast
                     </Button>
                  </div>
               </Card>

               <Card>
                  <h3 className="text-lg font-black text-slate-900 mb-4">Attribution Accuracy</h3>
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matched Conversion</span>
                     <span className="text-xl font-black text-slate-900">84%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600" style={{ width: '84%' }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-bold">
                     Most conversion data is currently synced via WhatsApp Business API and Dealer Website hooks.
                  </p>
               </Card>
            </div>
         </div>
      </div>
   );
};

export default Marketing;

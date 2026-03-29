import React, { useState } from 'react';
import { useLeads, useCreateLead, useUpdateLead } from '../api';
import { PageHeader, Card, Badge, Button, Skeleton, EmptyState, useToast } from '../UI';
import {
  Plus, Search, Filter, Phone,
  MessageCircle, AlertTriangle,
  Calendar, RefreshCw, Car, MapPin, User
} from 'lucide-react';
import CustomerOnboardingForm from '../components/CustomerOnboardingForm';
import LeadDetailPanel from '../components/LeadDetailPanel';
import { Lead } from '../types';

const Leads: React.FC = () => {
  const { data: leads, isLoading } = useLeads();
  const { addToast } = useToast();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewLead = async (leadData: any) => {
    try {
      await createLead.mutateAsync({
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        address: leadData.address,
        source: leadData.source || 'Walk-in',
        modelInterest: leadData.modelInterest || leadData.vehicleInterest || '',
        vehicleColor: leadData.vehicleColor,
        budget: leadData.budget || 0,
        temperature: leadData.temperature || 'Warm',
        exchange: leadData.exchange || { hasExchange: false },
        remarks: leadData.remarks,
        nextFollowUpDate: leadData.nextFollowUpDate,
      });
      addToast('New lead added to pipeline successfully!', 'success');
    } catch (err) {
      addToast('Failed to add lead. Please try again.', 'error');
    }
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      await updateLead.mutateAsync({ id: leadId, patch: updates });
      addToast('Lead updated successfully!', 'success');
      setSelectedLead(null);
    } catch (err) {
      addToast('Failed to update lead.', 'error');
    }
  };

  const handleConvertToDeal = async (leadId: string) => {
    const lead = leads?.find(l => l.id === leadId);
    if (!lead) return;

    try {
      await updateLead.mutateAsync({
        id: leadId,
        patch: { status: 'Delivered' }
      });
      addToast(`Deal created for ${lead.name}! Status set to Delivered.`, 'success');
      setSelectedLead(null);
    } catch (err) {
      addToast('Failed to convert deal.', 'error');
    }
  };

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const filteredLeads = leads?.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      lead.modelInterest.toLowerCase().includes(query) ||
      lead.address?.toLowerCase().includes(query)
    );
  });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-96" /></div>;

  return (
    <>
      <div className="space-y-8 animate-fade-in font-sans pb-10">
        <PageHeader
          title="Showroom Pipeline"
          subtitle="Enhanced customer onboarding and exchange tracking."
          actions={
            <Button icon={Plus} onClick={() => setIsOnboardingOpen(true)}>
              New Customer Enquiry
            </Button>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-6 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search pipeline (Lead name, model, phone)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
              />
            </div>
            <Button variant="outline" size="sm" icon={Filter}>Filter</Button>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Enquiries</p>
              <p className="text-xl font-black text-slate-900">{leads?.length || 0}</p>
            </div>
            <div className="text-center border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hot Leads</p>
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-xl font-black text-slate-900">{leads?.filter(l => l.temperature === 'Hot').length || 0}</p>
              </div>
            </div>
            <div className="text-center border-l border-slate-100 pl-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivered</p>
              <p className="text-xl font-black text-green-600">{leads?.filter(l => l.status === 'Delivered').length || 0}</p>
            </div>
          </div>
        </div>

        {filteredLeads && filteredLeads.length > 0 ? (
          <Card noPadding>
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5">Customer Profile</th>
                  <th className="px-6 py-5">Vehicle Interest</th>
                  <th className="px-6 py-5">Exchange</th>
                  <th className="px-6 py-5">Status & Temp</th>
                  <th className="px-6 py-5">Remarks</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ${lead.temperature === 'Hot' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{lead.name}</p>
                          <p className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                            <Phone size={10} /> {lead.phone}
                          </p>
                          {lead.address && <p className="text-[10px] font-medium text-slate-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {lead.address}</p>}
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5 flex items-center gap-1"><User size={10} /> Rep: {lead.ownerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        {lead.modelInterest}
                        {lead.quotationIssued && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">Quote Sent</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200" /> {lead.vehicleColor || 'Color Pending'}</div>
                      <div className="text-xs text-slate-500 mt-1">{lead.testDriveDate ? `TD: ${lead.testDriveDate}` : 'TD: Not Taken'}</div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      {lead.exchange?.hasExchange ? (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                            <RefreshCw size={12} className="text-blue-600" />
                            {lead.exchange.vehicleModel}
                          </div>
                          <div className="text-[10px] text-slate-500 grid grid-cols-2 gap-x-4">
                            <span>Exp: {lead.exchange.expectedValue ? `${(lead.exchange.expectedValue / 100000).toFixed(1)}L` : '-'}</span>
                            <span className="font-bold text-blue-600">Off: {lead.exchange.offeredValue ? `${(lead.exchange.offeredValue / 100000).toFixed(1)}L` : '-'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">- No Exchange -</span>
                      )}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <Badge variant={lead.temperature === 'Hot' ? 'danger' : 'warning'} size="sm">
                          {lead.temperature}
                        </Badge>
                        <Badge variant={lead.status === 'Delivered' ? 'success' : lead.status === 'Dropout' || lead.status === 'Cancelled' ? 'neutral' : 'blue'} size="sm">
                          {lead.status || 'Active'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top max-w-xs">
                      <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-2 line-clamp-2">
                        "{lead.remarks || 'No remarks captured.'}"
                      </p>
                      {lead.nextFollowUpDate && (
                        <div className="mt-2 text-[10px] font-bold text-blue-600 flex items-center gap-1">
                          <Calendar size={10} /> Next: {lead.nextFollowUpDate}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 align-top text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" icon={Phone} />
                        <Button variant="ghost" size="sm" icon={MessageCircle} className="text-emerald-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <EmptyState
            title={searchQuery ? "No matching leads" : "No active leads"}
            description={searchQuery ? "Try adjusting your search terms" : "Pipeline is clear. Click 'New Customer Enquiry' to add leads."}
          />
        )}
      </div>

      {/* Customer Onboarding Form Modal */}
      <CustomerOnboardingForm
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleNewLead}
      />

      {/* Lead Detail Side Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleUpdateLead}
        onConvertToDeal={handleConvertToDeal}
      />
    </>
  );
};

export default Leads;
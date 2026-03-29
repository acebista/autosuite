import React, { useState } from 'react';
import { useServiceJobs, useCreateServiceJob } from '../api';
import { PageHeader, Card, Badge, Button, Skeleton, useToast } from '../UI';
import { Wrench, Clock, AlertCircle, CheckCircle, Package, User, Plus, X, Link as LinkIcon, Copy } from 'lucide-react';

const Service: React.FC = () => {
  const { data: jobs, isLoading } = useServiceJobs();
  const { addToast } = useToast();
  const createServiceJob = useCreateServiceJob();
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [jobForm, setJobForm] = useState({
    customerName: '',
    phone: '',
    vehicleModel: '',
    regNumber: '',
    type: '' as 'Periodic' | 'Repair' | 'Warranty' | 'Bodywork' | '',
    technicianId: '',
    promisedAt: '',
    costEstimate: 0,
    complaint: '',
  });

  const handleShareTrackingLink = (jobId: string) => {
    const trackingUrl = `${window.location.origin}/track/${jobId}`;
    navigator.clipboard.writeText(trackingUrl);
    addToast(`✓ Tracking link copied! Share with customer via WhatsApp/SMS.`, 'success');
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-96" /></div>;

  const STATUS_CONFIG = {
    'Queued': { color: 'bg-slate-500', icon: Clock },
    'In Progress': { color: 'bg-blue-600', icon: Wrench },
    'Waiting Parts': { color: 'bg-orange-500', icon: Package },
    'Ready': { color: 'bg-emerald-500', icon: CheckCircle },
    'Delivered': { color: 'bg-slate-300', icon: CheckCircle },
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.customerName || !jobForm.vehicleModel || !jobForm.regNumber || !jobForm.type) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }
    try {
      await createServiceJob.mutateAsync({
        customerName: jobForm.customerName,
        vehicleModel: jobForm.vehicleModel,
        regNumber: jobForm.regNumber,
        type: jobForm.type as any,
        technicianId: jobForm.technicianId || null,
        promisedAt: jobForm.promisedAt ? new Date(jobForm.promisedAt).toISOString() : undefined,
        costEstimate: jobForm.costEstimate || 0,
      });
      addToast('Job card created successfully!', 'success');
      setIsNewJobOpen(false);
      setJobForm({ customerName: '', phone: '', vehicleModel: '', regNumber: '', type: '', technicianId: '', promisedAt: '', costEstimate: 0, complaint: '' });
    } catch (err) {
      addToast('Failed to create job card. Please try again.', 'error');
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          title="Service Operations"
          subtitle="Manage workshop floor and promised delivery SLAs."
          actions={
            <Button
              icon={Plus}
              onClick={() => setIsNewJobOpen(true)}
            >
              New Job Card
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Card key={status} className="flex flex-col items-center py-4 bg-white border-slate-200">
              <div className={`h-2 w-12 rounded-full mb-3 ${config.color}`} />
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{status}</p>
              <p className="text-2xl font-black text-slate-900">{jobs?.filter(j => j.status === status).length}</p>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-4 bg-red-50 p-4 border border-red-100 rounded-2xl">
          <AlertCircle className="text-red-500" />
          <p className="text-sm font-bold text-red-900">2 Jobs are currently overdue based on the promised delivery SLA. Immediate attention required.</p>
        </div>

        <Card noPadding>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Job Detail</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Technician</th>
                <th className="px-6 py-4">SLA / Promised</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!jobs || jobs.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-slate-100 rounded-2xl mb-4"><Wrench size={32} className="text-slate-400" /></div>
                      <p className="font-semibold text-slate-700">No service jobs</p>
                      <p className="text-sm text-slate-500 mt-1">Create a new job card to get started</p>
                    </div>
                  </td>
                </tr>
              ) : jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900 uppercase tracking-tight">{job.id}</p>
                    <p className="text-xs font-bold text-slate-400">{job.vehicleModel} • {job.regNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={job.status === 'In Progress' ? 'primary' : job.status === 'Waiting Parts' ? 'warning' : 'neutral'}>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><User size={12} className="text-slate-400" /></div>
                      <span className="text-xs font-bold text-slate-600">{job.technicianId || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700">{new Date(job.promisedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Promised Delivery</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={LinkIcon}
                        onClick={() => handleShareTrackingLink(job.id)}
                      >
                        Share Link
                      </Button>
                      <Button variant="ghost" size="sm">Update</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* New Job Card Modal */}
      {isNewJobOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Create New Job Card</h2>
                <p className="text-orange-100 text-sm mt-1">Initialize a new service order for vehicle repair/maintenance</p>
              </div>
              <button
                onClick={() => setIsNewJobOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateJob} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
              {/* Customer & Vehicle Information */}
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} className="text-orange-600" />
                  Customer & Vehicle Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={jobForm.customerName}
                      onChange={e => setJobForm({ ...jobForm, customerName: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g., Rajesh Hamal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={jobForm.phone}
                      onChange={e => setJobForm({ ...jobForm, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="98XXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Vehicle Model *</label>
                    <input
                      type="text"
                      required
                      value={jobForm.vehicleModel}
                      onChange={e => setJobForm({ ...jobForm, vehicleModel: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g., Hyundai Creta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Registration Number *</label>
                    <input
                      type="text"
                      required
                      value={jobForm.regNumber}
                      onChange={e => setJobForm({ ...jobForm, regNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="BA 2 CHA 1234"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Wrench size={16} className="text-orange-600" />
                  Service Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Service Type *</label>
                    <select
                      required
                      value={jobForm.type}
                      onChange={e => setJobForm({ ...jobForm, type: e.target.value as any })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select service type</option>
                      <option value="Periodic">Periodic Maintenance</option>
                      <option value="Repair">Repair</option>
                      <option value="Accident">Accident Repair</option>
                      <option value="Breakdown">Breakdown Service</option>
                      <option value="Inspection">Pre-Purchase Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Priority</label>
                    <select
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Assigned Technician</label>
                    <select
                      value={jobForm.technicianId}
                      onChange={e => setJobForm({ ...jobForm, technicianId: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select technician</option>
                      <option value="T1">Hari Bahadur</option>
                      <option value="T2">Ram Krishna</option>
                      <option value="T3">Shyam Sundar</option>
                      <option value="T4">Unassigned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Promised Delivery Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={jobForm.promisedAt}
                      onChange={e => setJobForm({ ...jobForm, promisedAt: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Service Description */}
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-orange-600" />
                  Reported Issues
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Customer Complaint / Service Request *</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Describe the issue or service requested by the customer..."
                  />
                </div>
              </div>

              {/* Cost Estimate */}
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  💰 Cost Estimate (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Labor Cost (NPR)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Parts Cost (NPR)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                      placeholder="12000"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsNewJobOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Create Job Card
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Service;


import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../UI';
import { Check, Clock, Wrench, Sparkles, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useServiceJob } from '../api';
import { ServiceJob } from '../types';

// Helper to add UI-specific fields not yet in DB
const enrichJobData = (job: ServiceJob) => {
    return {
        ...job,
        currentStage: job.status === 'Queued' ? 'received' :
            job.status === 'In Progress' ? 'service' :
                job.status === 'Ready' ? 'ready' : 'unknown',
        stages: [
            { id: 'received', name: 'Vehicle Received', icon: FileText, status: 'completed', time: '09:00 AM' },
            { id: 'inspection', name: 'Initial Inspection', icon: Wrench, status: 'completed', time: '09:30 AM' },
            { id: 'service', name: 'Service Work', icon: Wrench, status: job.status === 'In Progress' ? 'in-progress' : job.status === 'Ready' || job.status === 'Delivered' ? 'completed' : 'pending', time: '11:45 AM' },
            { id: 'washing', name: 'Washing & Cleaning', icon: Sparkles, status: 'pending', time: 'Pending' },
            { id: 'qc', name: 'Quality Check', icon: CheckCircle2, status: 'pending', time: 'Pending' },
            { id: 'ready', name: 'Ready for Pickup', icon: Check, status: job.status === 'Ready' ? 'completed' : 'pending', time: 'Est. 5:00 PM' }
        ],
        serviceItems: [
            { name: 'Periodic Service', status: 'completed' },
            { name: 'General Checkup', status: 'completed' }
        ],
        additionalWork: []
    };
};

const ServiceTracking: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const { data: apiJob, isLoading: loading } = useServiceJob(jobId);
    const [job, setJob] = useState<any>(null);

    useEffect(() => {
        if (apiJob) {
            setJob(enrichJobData(apiJob));
        }
    }, [apiJob]);

    const handleApproval = (itemIndex: number, approved: boolean) => {
        const updatedJob = { ...job };
        if (updatedJob.additionalWork && updatedJob.additionalWork[itemIndex]) {
            updatedJob.additionalWork[itemIndex].approved = approved;
            setJob(updatedJob);
        }
        // In production: POST /api/service/jobs/:id/approve-additional-work
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 font-bold text-slate-700">Loading service status...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="max-w-md text-center">
                    <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Job Not Found</h1>
                    <p className="text-slate-600">The service job you're looking for doesn't exist or the link is invalid.</p>
                </Card>
            </div>
        );
    }

    const currentStageIndex = job.stages.findIndex((s: any) => s.id === job.currentStage);
    const estimatedCompletion = new Date(job.promisedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block bg-white px-6 py-3 rounded-2xl shadow-lg mb-4">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Service Tracking</p>
                        <h1 className="text-3xl font-black text-slate-900">{job.id}</h1>
                    </div>
                    <p className="text-slate-700 font-medium">{job.vehicleModel} • {job.regNumber}</p>
                    <p className="text-sm text-slate-600">Customer: {job.customerName}</p>
                </div>

                {/* Progress Timeline */}
                <Card className="mb-6 shadow-xl">
                    <h2 className="text-xl font-black text-slate-900 mb-6">Current Status</h2>
                    <div className="space-y-4">
                        {job.stages.map((stage: any, index: number) => {
                            const Icon = stage.icon;
                            const isCompleted = stage.status === 'completed';
                            const isInProgress = stage.status === 'in-progress';
                            const isPending = stage.status === 'pending';

                            return (
                                <div key={stage.id} className="flex items-start gap-4">
                                    <div className={`
                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2
                    ${isCompleted ? 'bg-green-100 border-green-500' : ''}
                    ${isInProgress ? 'bg-blue-100 border-blue-500 animate-pulse' : ''}
                    ${isPending ? 'bg-slate-100 border-slate-300' : ''}
                  `}>
                                        <Icon size={20} className={`
                      ${isCompleted ? 'text-green-600' : ''}
                      ${isInProgress ? 'text-blue-600' : ''}
                      ${isPending ? 'text-slate-400' : ''}
                    `} />
                                    </div>
                                    <div className="flex-1 pt-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-bold ${isInProgress ? 'text-blue-900' : 'text-slate-900'}`}>
                                                    {stage.name}
                                                </p>
                                                {isCompleted && <p className="text-xs text-green-600 font-medium mt-1">✓ Completed at {stage.time}</p>}
                                                {isInProgress && <p className="text-xs text-blue-600 font-bold mt-1 animate-pulse">⚡ {stage.time}</p>}
                                                {isPending && <p className="text-xs text-slate-500 mt-1">{stage.time}</p>}
                                            </div>
                                            {isInProgress && (
                                                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                    Current
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm font-bold text-blue-900">
                            🕐 Estimated Completion: <span className="text-lg">{estimatedCompletion}</span>
                        </p>
                    </div>
                </Card>

                {/* Service Items Completed */}
                <Card className="mb-6 shadow-xl">
                    <h2 className="text-xl font-black text-slate-900 mb-4">Completed Work</h2>
                    <div className="space-y-2">
                        {job.serviceItems.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <CheckCircle2 size={16} className="text-green-600" />
                                <span className="text-slate-700 font-medium">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Additional Work Approval */}
                {job.additionalWork && job.additionalWork.length > 0 && (
                    <Card className="mb-6 shadow-xl border-2 border-orange-200 bg-orange-50/30">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-black">
                                ACTION REQUIRED
                            </div>
                            <h2 className="text-xl font-black text-slate-900">Additional Work Needed</h2>
                        </div>

                        {job.additionalWork.map((item: any, index: number) => (
                            <div key={index} className="bg-white rounded-xl p-5 border border-orange-200">
                                <div className="flex gap-4">
                                    <img
                                        src={item.image}
                                        alt={item.item}
                                        className="w-24 h-24 rounded-lg object-cover border-2 border-slate-200"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-900 mb-1">{item.item}</h3>
                                        <p className="text-sm text-slate-600 mb-2">⚠️ {item.reason}</p>
                                        <p className="text-sm font-bold text-slate-900">Cost: NPR {item.cost.toLocaleString()}/-</p>
                                    </div>
                                </div>

                                {item.approved === null && (
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => handleApproval(index, true)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
                                        >
                                            ✓ Approve Repair
                                        </button>
                                        <button
                                            onClick={() => handleApproval(index, false)}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
                                        >
                                            ✗ Decline
                                        </button>
                                    </div>
                                )}

                                {item.approved === true && (
                                    <div className="mt-4 bg-green-100 text-green-800 p-4 rounded-xl text-center font-bold">
                                        ✓ Approved - Work will proceed
                                    </div>
                                )}

                                {item.approved === false && (
                                    <div className="mt-4 bg-red-100 text-red-800 p-4 rounded-xl text-center font-bold">
                                        ✗ Declined - This work will be skipped
                                    </div>
                                )}
                            </div>
                        ))}
                    </Card>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-slate-500 mt-8">
                    <p>Questions? Call us at <span className="font-bold text-slate-700">9852034784</span></p>
                    <p className="mt-2 text-xs">Powered by AutoSuite AI</p>
                </div>
            </div>
        </div>
    );
};

export default ServiceTracking;

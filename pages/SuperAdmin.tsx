import React, { useState, useEffect } from 'react';
import { 
    PageHeader, Card, Badge, Button, Modal, useToast 
} from '../UI';
import { 
    Building2, Users, Plus, Shield, Globe, 
    CheckCircle, AlertCircle, ExternalLink, 
    Mail, Key, User as UserIcon
} from 'lucide-react';
import { 
    listOrganizations, 
    createOrganizationWithAdmin, 
    updateOrganization,
    toggleOrgStatus,
    Organization 
} from '../lib/rbac';
import { Edit2, Ban, Play } from 'lucide-react';

const SuperAdmin: React.FC = () => {
    const { addToast } = useToast();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        orgName: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
    });

    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<Organization>>({});
    
    const [orgUsers, setOrgUsers] = useState<any[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    useEffect(() => {
        loadOrgs();
    }, []);

    const loadOrgs = async () => {
        setIsLoading(true);
        try {
            const data = await listOrganizations();
            setOrgs(data);
        } catch (err) {
            console.error('Failed to load orgs:', err);
            addToast('Failed to load dealerships', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const loadOrgUsers = async (orgId: string) => {
        setIsUsersLoading(true);
        const { getOrgUsersByOrgId } = await import('../lib/rbac');
        const users = await getOrgUsersByOrgId(orgId);
        setOrgUsers(users);
        setIsUsersLoading(false);
    };

    const handleResetPassword = async (userId: string, newPass: string) => {
        const { resetUserPassword } = await import('../lib/rbac');
        const res = await resetUserPassword(userId, newPass);
        if (res.success) {
            addToast('Password reset successfully', 'success');
        } else {
            addToast(res.error || 'Reset failed', 'error');
        }
    };

    const handleToggleStatus = async (orgId: string, currentStatus: string) => {
        const action = currentStatus === 'active' ? 'suspend' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this dealership?`)) return;

        try {
            const res = await toggleOrgStatus(orgId, currentStatus);
            if (res.success) {
                addToast(`Dealership ${res.newStatus === 'active' ? 'activated' : 'suspended'} successfully`, 'success');
                loadOrgs();
            } else {
                addToast(res.error || 'Failed to update status', 'error');
            }
        } catch (error: any) {
            addToast(error.message || 'An error occurred', 'error');
        }
    };

    const handleUpdateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrg) return;
        setIsUpdating(true);

        try {
            const res = await updateOrganization(selectedOrg.id, {
                name: editFormData.name,
                slug: editFormData.slug,
                domain: editFormData.domain,
                address: editFormData.address,
                phone: editFormData.phone,
                email: editFormData.email,
                subscription_tier: editFormData.subscription_tier,
                max_users: Number(editFormData.max_users),
                max_branches: Number(editFormData.max_branches)
            });

            if (res.success) {
                addToast('Dealership updated successfully', 'success');
                setIsEditModalOpen(false);
                loadOrgs();
            } else {
                addToast(res.error || 'Update failed', 'error');
            }
        } catch (err: any) {
            addToast(err.message || 'An unexpected error occurred', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        
        try {
            const result = await createOrganizationWithAdmin(
                formData.orgName,
                formData.adminEmail,
                formData.adminPassword,
                formData.adminName
            );

            if (result.success) {
                addToast('Organization and Admin created successfully', 'success');
                setShowCreateModal(false);
                setFormData({ orgName: '', adminName: '', adminEmail: '', adminPassword: '' });
                loadOrgs();
            } else {
                addToast(result.error || 'Failed to create organization', 'error');
            }
        } catch (error) {
            addToast('An unexpected error occurred', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <PageHeader
                title="Super Admin Control"
                subtitle="SaaS Platform Management — Oversee all dealerships and organizations"
                actions={
                    <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
                        Create Dealership
                    </Button>
                }
            />

            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-none shadow-glow-purple">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-purple-100 text-xs font-bold uppercase tracking-wider">Total Dealerships</p>
                            <p className="text-3xl font-black">{orgs.length}</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Instances</p>
                            <p className="text-3xl font-black text-slate-900">
                                {orgs.filter(o => o.subscription_status === 'active').length}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Globe size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Growth Rate</p>
                            <p className="text-3xl font-black text-slate-900">+12%</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Organizations List */}
            <Card title="Dealership Organizations" subtitle="Manage instances and administrative access">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">
                        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        Loading dealerships...
                    </div>
                ) : orgs.length === 0 ? (
                    <div className="text-center py-12">
                        <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No organizations found</p>
                        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
                            Create the first one
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">dealership</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">slug</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">status</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">created</th>
                                    <th className="text-right py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orgs.map((org) => (
                                    <React.Fragment key={org.id}>
                                        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold">
                                                        {org.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-900">{org.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-mono text-sm text-slate-500">/{org.slug}</td>
                                            <td className="py-4 px-4">
                                                <Badge variant={org.subscription_status === 'active' ? 'success' : 'warning'}>
                                                    {org.subscription_status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-500">
                                                {new Date(org.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-4 text-right space-x-2">
                                                <Button size="sm" variant="secondary" icon={Edit2} onClick={() => {
                                                    setSelectedOrg(org);
                                                    setEditFormData(org);
                                                    setIsEditModalOpen(true);
                                                }}>Edit</Button>
                                                <Button size="sm" variant="secondary" icon={Users} onClick={() => {
                                                    setSelectedOrg(org);
                                                    loadOrgUsers(org.id);
                                                }}>Admins</Button>
                                                <Button 
                                                    size="sm" 
                                                    variant={org.subscription_status === 'active' ? 'danger' : 'success'} 
                                                    icon={org.subscription_status === 'active' ? Ban : Play}
                                                    onClick={() => handleToggleStatus(org.id, org.subscription_status)}
                                                >
                                                    {org.subscription_status === 'active' ? 'Suspend' : 'Activate'}
                                                </Button>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Manage Users Modal */}
            <Modal
                isOpen={!!selectedOrg && !isEditModalOpen}
                onClose={() => setSelectedOrg(null)}
                title={`Manage Admins - ${selectedOrg?.name}`}
                size="lg"
            >
                <div className="space-y-6">
                    {isUsersLoading ? (
                        <div className="text-center py-8 text-slate-500">Loading users...</div>
                    ) : (
                        <div className="space-y-4">
                            {orgUsers.map(u => (
                                <div key={u.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                            <UserIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{u.name}</p>
                                            <p className="text-sm text-slate-500">{u.email} • <span className="text-purple-600 font-semibold">{u.role}</span></p>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="secondary" 
                                        icon={Key}
                                        onClick={() => {
                                            const newPass = prompt(`Enter new password for ${u.name}:`);
                                            if (newPass) handleResetPassword(u.id, newPass);
                                        }}
                                    >
                                        Reset Password
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Edit Organization Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedOrg(null);
                }}
                title={`Edit Dealership - ${selectedOrg?.name}`}
                size="xl"
            >
                <form onSubmit={handleUpdateOrg} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Building2 size={16} /> Basic Information
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Dealership Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={editFormData.name || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">URL Slug (e.g. sarva-motors)</label>
                                    <input
                                        required
                                        type="text"
                                        value={editFormData.slug || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Custom Domain (Optional)</label>
                                    <input
                                        type="text"
                                        value={editFormData.domain || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, domain: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                        placeholder="dms.sarvamotors.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Mail size={16} /> Contact Details
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Public Email</label>
                                        <input
                                            type="email"
                                            value={editFormData.email || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Phone Number</label>
                                        <input
                                            type="text"
                                            value={editFormData.phone || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Address</label>
                                    <textarea
                                        rows={3}
                                        value={editFormData.address || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subscription & Limits */}
                        <div className="space-y-4 col-span-1 md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Globe size={16} /> Subscription & Resource Limits
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Plan Tier</label>
                                    <select
                                        value={editFormData.subscription_tier || 'starter'}
                                        onChange={(e) => setEditFormData({ ...editFormData, subscription_tier: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                    >
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Max Users</label>
                                    <input
                                        type="number"
                                        value={editFormData.max_users || 5}
                                        onChange={(e) => setEditFormData({ ...editFormData, max_users: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Max Branches</label>
                                    <input
                                        type="number"
                                        value={editFormData.max_branches || 1}
                                        onChange={(e) => setEditFormData({ ...editFormData, max_branches: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => {
                            setIsEditModalOpen(false);
                            setSelectedOrg(null);
                        }}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-glow-purple" 
                            disabled={isUpdating}
                        >
                            {isUpdating ? 'Saving Changes...' : 'Save All Details'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Create Organization Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Dealership"
            >
                <form onSubmit={handleCreateOrg} className="space-y-6 p-1">
                    <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                            <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                <Building2 size={16} /> Dealership Identity
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-purple-700/70 mb-1 ml-1 uppercase">Dealership Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.orgName}
                                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                    placeholder="e.g. Paramount Motors"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <Shield size={16} /> Admin Account
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Admin Full Name</label>
                                    <div className="relative">
                                        <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required
                                            type="text"
                                            value={formData.adminName}
                                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Email Address</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                required
                                                type="email"
                                                value={formData.adminEmail}
                                                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                                placeholder="admin@dealership.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Initial Password</label>
                                        <div className="relative">
                                            <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                required
                                                type="text"
                                                value={formData.adminPassword}
                                                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none font-mono"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-glow-purple" 
                            disabled={isCreating}
                        >
                            {isCreating ? 'Creating Dealership...' : 'Launch Instance'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdmin;

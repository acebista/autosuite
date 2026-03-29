import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Badge, Button, Input, Select, useToast } from '../UI';
import { Users, Plus, Mail, Shield, Trash2, Edit2, Search, X } from 'lucide-react';
import {
    getOrgUsers,
    createUser,
    updateRole,
    removeUser,
    hasPermission,
    UserProfile,
    ROLE_LABELS,
    ROLE_DESCRIPTIONS,
    getRoleColor
} from '../lib/rbac';
import { Role } from '../types';
import { normalizeRole } from '../lib/store';

const UserManagement: React.FC = () => {
    const { addToast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [canManageUsers, setCanManageUsers] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [userForm, setUserForm] = useState({
        email: '',
        name: '',
        password: '',
        role: 'user' as Role,
        department: ''
    });

    useEffect(() => {
        loadUsers();
        checkPermissions();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        const userData = await getOrgUsers();
        setUsers(userData);
        setIsLoading(false);
    };

    const checkPermissions = async () => {
        const canManage = await hasPermission('users.manage');
        setCanManageUsers(canManage);
    };

    const handleCreateUser = async () => {
        if (!userForm.email || !userForm.name || !userForm.password) {
            addToast('Please fill in all required fields (Name, Email, Password)', 'error');
            return;
        }

        const result = await createUser(
            userForm.email, 
            userForm.role, 
            userForm.name, 
            userForm.password,
            userForm.department
        );

        if (result.success) {
            addToast(`User ${userForm.name} created successfully`, 'success');
            setIsCreateModalOpen(false);
            setUserForm({ email: '', name: '', password: '', role: 'user', department: '' });
            loadUsers();
        } else {
            addToast(result.error || 'Failed to create user', 'error');
        }
    };

    const handleUpdateRole = async (userId: string, newRole: Role) => {
        const result = await updateRole(userId, newRole);

        if (result.success) {
            addToast('User role updated successfully', 'success');
            loadUsers();
            setIsEditModalOpen(false);
            setSelectedUser(null);
        } else {
            addToast(result.error || 'Failed to update role', 'error');
        }
    };

    const handleRemoveUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to remove ${userName}?`)) {
            return;
        }

        const result = await removeUser(userId);

        if (result.success) {
            addToast('User removed successfully', 'success');
            loadUsers();
        } else {
            addToast(result.error || 'Failed to remove user', 'error');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadgeVariant = (role: string) => {
        const lowerRole = role?.toLowerCase();
        const variants: Record<string, any> = {
            super_admin: 'purple',
            superadmin: 'purple',
            admin: 'blue',
            sales: 'success',
            salesrep: 'success',
            salesmanager: 'success',
            finance: 'warning',
            service: 'info',
            serviceadvisor: 'info',
            technician: 'teal',
            user: 'neutral'
        };
        return variants[lowerRole] || 'neutral';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <PageHeader
                title="User Management"
                subtitle="Manage team members, roles, and permissions."
                actions={
                    canManageUsers && (
                        <Button icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
                            Add User
                        </Button>
                    )
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                            <p className="text-2xl font-black text-slate-900">{users.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Shield size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admins</p>
                            <p className="text-2xl font-black text-slate-900">
                                {users.filter(u => ['admin', 'super_admin', 'superadmin', 'SuperAdmin', 'Admin'].includes(u.role)).length}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <Users size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Team</p>
                            <p className="text-2xl font-black text-slate-900">
                                {users.filter(u => ['sales', 'salesrep', 'salesmanager', 'SalesRep', 'SalesManager'].includes(u.role)).length}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-cyan-50 rounded-xl">
                            <Users size={20} className="text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Team</p>
                            <p className="text-2xl font-black text-slate-900">
                                {users.filter(u => ['service', 'serviceadvisor', 'technician', 'ServiceAdvisor', 'Technician'].includes(u.role)).length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-900">Team Members</h3>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4 text-left">User</th>
                                <th className="px-6 py-4 text-left">Role</th>
                                <th className="px-6 py-4 text-left">Department</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                {canManageUsers && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black">
                                                    {user.name?.charAt(0) || user.email?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{user.name || 'Unnamed User'}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                                {ROLE_LABELS[normalizeRole(user.role)] || user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 font-medium">
                                                {user.department || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="success">Active</Badge>
                                        </td>
                                        {canManageUsers && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit role"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveUser(user.id, user.name || user.email)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove user"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <Card className="relative w-full max-w-lg bg-white shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Plus size={20} className="text-blue-600" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900">Add New User</h2>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="mt-6 flex flex-col h-full">
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 flex-1">
                                <Input
                                    label="Full Name"
                                    placeholder="John Doe"
                                    value={userForm.name}
                                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                />
                                <Input
                                    label="Email Address"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={userForm.email}
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                />
                                <Input
                                    label="Department (Optional)"
                                    placeholder="Sales, Tech, etc."
                                    value={userForm.department}
                                    onChange={e => setUserForm({ ...userForm, department: e.target.value })}
                                />
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
                                        Role
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={userForm.role}
                                        onChange={e => setUserForm({ ...userForm, role: e.target.value as Role })}
                                    >
                                        <option value="Admin">Admin - Full Organization Access</option>
                                        <option value="SalesManager">Sales Manager</option>
                                        <option value="SalesRep">Sales Representative</option>
                                        <option value="ServiceAdvisor">Service Advisor</option>
                                        <option value="Technician">Technician</option>
                                        <option value="Finance">Finance</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">
                                        {ROLE_DESCRIPTIONS[userForm.role] || 'Basic access to the organization.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Create User
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Edit Role Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <Card className="relative w-full max-w-lg bg-white shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-xl">
                                    <Shield size={20} className="text-purple-600" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900">Edit User Role</h2>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-slate-600 font-medium">
                                Changing role for: <span className="font-bold text-slate-900">{selectedUser.name}</span>
                            </p>
                        </div>

                        <div className="space-y-3">
                            {(['user', 'sales', 'finance', 'service', 'admin'] as string[]).map(role => (
                                <button
                                    key={role}
                                    onClick={() => handleUpdateRole(selectedUser.id, normalizeRole(role))}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${normalizeRole(selectedUser.role) === normalizeRole(role)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-slate-900">{ROLE_LABELS[role]}</p>
                                            <p className="text-xs text-slate-500 mt-1">{ROLE_DESCRIPTIONS[role]}</p>
                                        </div>
                                        {selectedUser.role === role && (
                                            <Badge variant="blue">Current</Badge>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

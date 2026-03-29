import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Role, UserProfile } from '../types';
import { normalizeRole } from './store';

/**
 * Role-Based Access Control (RBAC) Utilities
 */

// Re-export for consumers that import from here
export type { UserProfile } from '../types';


export interface Organization {
    id: string;
    name: string;
    slug: string;
    domain?: string | null;
    logo_url?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    subscription_tier?: string;
    subscription_status: string;
    max_users?: number;
    max_branches?: number;
    createdAt: string;
}

export interface Permission {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

/**
 * Role hierarchy for permission checks
 */
const ROLE_HIERARCHY: Record<Role, number> = {
    SuperAdmin: 6,
    Admin: 5,
    SalesManager: 4,
    SalesRep: 4,
    ServiceAdvisor: 4,
    Technician: 4,
    Marketing: 4,
    Finance: 4
};

/**
 * Get current user's profile with role
 */

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
    const isMockDataEnabled = localStorage.getItem('useMockData') === 'true';
    if (isMockDataEnabled) {
        const mockSession = localStorage.getItem('autosuite_demo_session');
        if (mockSession) {
            const data = JSON.parse(mockSession);
            return {
                id: data.id,
                email: data.email,
                name: data.name,
                role: normalizeRole(data.role),
                orgId: data.orgId || data.org_id || 'demo-org',
                branchId: data.branchId || null,
                status: (data.status || 'Active') as 'Active' | 'Inactive'
            };
        }
        return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) return null;
    return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: normalizeRole(profile.role),
        orgId: profile.org_id,
        branchId: profile.branch_id,
        department: profile.department,
        status: (profile.status || 'Active') as 'Active' | 'Inactive'
    };
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(permissionName: string): Promise<boolean> {
    const isMockDataEnabled = localStorage.getItem('useMockData') === 'true';
    if (isMockDataEnabled) {
        // In mock mode, allow admins to do everything
        const mockSession = localStorage.getItem('autosuite_demo_session');
        if (mockSession) {
            const user = JSON.parse(mockSession);
            return user.role === 'Admin' || user.role === 'admin' || user.role === 'super_admin';
        }
        return true; 
    }

    const { data, error } = await supabase.rpc('has_permission', {
        required_permission: permissionName
    });

    if (error) {
        console.error('Permission check error:', error);
        return false;
    }

    return (data as unknown) === true;
}

/**
 * Check if user has a specific role or higher
 */
export async function hasRole(requiredRole: Role): Promise<boolean> {
    const profile = await getCurrentUserProfile();

    if (!profile) return false;

    return ROLE_HIERARCHY[profile.role] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
    const profile = await getCurrentUserProfile();
    return profile?.role === 'SuperAdmin';
}

/**
 * Check if user is admin or higher
 */
export async function isAdmin(): Promise<boolean> {
    const profile = await getCurrentUserProfile();
    return profile?.role === 'Admin' || profile?.role === 'SuperAdmin';
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(role: Role): Promise<Permission[]> {
    const { data, error } = await supabase
        .from('role_permissions')
        .select(`
      permissions (
        id,
        name,
        description,
        resource,
        action
      )
    `)
        .eq('role', role);

    if (error) {
        console.error('Error fetching role permissions:', error);
        return [];
    }

    return (data?.map(d => (d as any).permissions) || []) as Permission[];
}

/**
 * Get all users in a specific organization (Super Admin use case)
 */
export async function getOrgUsersByOrgId(orgId: string): Promise<UserProfile[]> {
    const isMockDataEnabled = localStorage.getItem('useMockData') === 'true';
    if (isMockDataEnabled) {
        const persistedUsers = JSON.parse(localStorage.getItem('autosuite_persisted_mock_users') || '[]');
        const { MOCK_USERS } = await import('../mockData');
        const allMockUsers = [...MOCK_USERS, ...persistedUsers];

        return allMockUsers
            .filter(u => (u as any).org_id === orgId || orgId === 'demo-org')
            .map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                role: normalizeRole(u.role as string),
                orgId: orgId,
                branchId: null,
                status: ((u as any).status || 'Active') as 'Active' | 'Inactive'
            }));
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('org_id', orgId);

        if (error) throw error;
        return (data || []).map(d => ({
            id: d.id,
            email: d.email,
            name: d.name,
            role: normalizeRole(d.role),
            orgId: d.org_id,
            branchId: d.branch_id,
            status: (d.status || 'Active') as 'Active' | 'Inactive'
        }));
    } catch (err) {
        console.error('Error fetching org users:', err);
        return [];
    }
}

/**
 * Get all users in current organization
 */
export async function getOrgUsers(): Promise<UserProfile[]> {
    const isMockDataEnabled = localStorage.getItem('useMockData') === 'true';
    if (isMockDataEnabled) {
        // Import dynamic to avoid circular dependencies if any
        const { MOCK_USERS } = await import('../mockData');
        const persistedUsers = JSON.parse(localStorage.getItem('autosuite_persisted_mock_users') || '[]');
        const allMockUsers = [...MOCK_USERS, ...persistedUsers];

        return allMockUsers.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: normalizeRole(u.role as string),
            orgId: 'demo-org',
            branchId: null,
            status: 'Active' as const
        }));
    }

    const profile = await getCurrentUserProfile();

    if (!profile?.orgId) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', profile.orgId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching org users:', error);
        return [];
    }

    return (data || []).map(d => ({
        id: d.id,
        email: d.email,
        name: d.name,
        role: normalizeRole(d.role),
        orgId: d.org_id,
        branchId: d.branch_id,
        status: (d.status || 'Active') as 'Active' | 'Inactive'
    }));
}

/**
 * Update user role (admin only)
 */
export async function updateRole(
    userId: string,
    newRole: Role
): Promise<{ success: boolean; error?: string }> {
    // Check if current user is admin
    const canManageUsers = await hasPermission('users.manage');

    if (!canManageUsers) {
        return { success: false, error: 'Insufficient permissions' };
    }

    // Super admin role can only be assigned by another super admin
    if (newRole === 'SuperAdmin') {
        const isSuperAdm = await isSuperAdmin();
        if (!isSuperAdm) {
            return { success: false, error: 'Only super admins can assign super admin role' };
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole } as any)
        .eq('id', userId);

    if (error) {
        return { success: false, error: error.message };
    }

    // Log the action
    await logAuditEvent('user_role_updated', 'profiles', userId, { new_role: newRole });

    return { success: true };
}

/**
 * Create a new user account directly (Admin only)
 * This bypasses the invitation flow and sets a password immediately.
 */
export async function createUser(
    email: string,
    role: Role,
    name: string,
    password: string,
    department?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    const canCreate = await hasPermission('users.create');

    if (!canCreate) {
        return { success: false, error: 'Insufficient permissions' };
    }

    const currentProfile = await getCurrentUserProfile();

    if (!currentProfile?.orgId) {
        return { success: false, error: 'User not associated with organization' };
    }

    // Check if mock data is enabled
    const isMockDataEnabled = localStorage.getItem('useMockData') === 'true';

    if (isMockDataEnabled) {
        const newUser: UserProfile = {
            id: `U${Math.floor(Math.random() * 1000)}`,
            email,
            name,
            role,
            orgId: currentProfile?.orgId || 'demo-org',
            branchId: null,
            department: department || '',
            status: 'Active'
        };
        
        // Persist in localStorage so they survive reloads
        const storedMockUsers = JSON.parse(localStorage.getItem('autosuite_persisted_mock_users') || '[]');
        storedMockUsers.push({
            ...newUser,
            password, // Store password for mock login check
            branchId: 'B001'
        });
        localStorage.setItem('autosuite_persisted_mock_users', JSON.stringify(storedMockUsers));
        
        return { success: true, data: newUser };
    }

    try {
        // Use the Supabase Edge Function for direct user creation
        // This bypasses email confirmation and is more secure.
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: { 
                email, 
                password, 
                name, 
                role, 
                department 
            }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        return { success: true, data: data.user };
    } catch (error: any) {
        console.error('Create user error:', error);
        return { success: false, error: error.message || 'Failed to create user' };
    }
}

/**
 * Invite new user to organization
 */
export async function inviteUser(
    email: string,
    role: Role,
    name?: string
): Promise<{ success: boolean; error?: string }> {
    const canInvite = await hasPermission('users.create');

    if (!canInvite) {
        return { success: false, error: 'Insufficient permissions' };
    }

    const profile = await getCurrentUserProfile();

    if (!profile?.orgId) {
        return { success: false, error: 'User not associated with organization' };
    }

    // Generate invite token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { error } = await supabase
        .from('organization_invites')
        .insert([{
            org_id: profile.orgId,
            email,
            role,
            invited_by: profile.id,
            token,
            expires_at: expiresAt.toISOString()
        } as any]);

    if (error) {
        return { success: false, error: error.message };
    }

    // TODO: Send invite email via email service (e.g., Supabase Edge Function + Resend)

    return { success: true };
}

/**
 * Remove user from organization
 */
export async function removeUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const canDelete = await hasPermission('users.delete');

    if (!canDelete) {
        return { success: false, error: 'Insufficient permissions' };
    }

    // Prevent self-deletion
    const currentProfile = await getCurrentUserProfile();
    if (currentProfile?.id === userId) {
        return { success: false, error: 'Cannot remove yourself' };
    }

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) {
        return { success: false, error: error.message };
    }

    await logAuditEvent('user_removed', 'profiles', userId);

    return { success: true };
}

/**
 * Log audit event
 */
export async function logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>
): Promise<void> {
    const profile = await getCurrentUserProfile();

    if (!profile) return;

    await supabase.from('audit_logs').insert([{
        org_id: profile.orgId,
        user_id: profile.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        new_values: metadata as any
    } as any]);
}

/**
 * Get audit logs for organization
 */
export async function getAuditLogs(limit: number = 50) {
    const profile = await getCurrentUserProfile();

    if (!profile?.orgId) return [];

    const { data, error } = await supabase
        .from('audit_logs')
        .select(`
      *,
      profiles (
        name,
        email
      )
    `)
        .eq('org_id', profile.orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }

    return data || [];
}

/**
 * Role display names
 */
export const ROLE_LABELS: Record<Role, string> = {
    SuperAdmin: 'Super Admin',
    Admin: 'Admin',
    SalesManager: 'Sales Manager',
    SalesRep: 'Sales Rep',
    ServiceAdvisor: 'Service Advisor',
    Technician: 'Technician',
    Marketing: 'Marketing',
    Finance: 'Finance'
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
    SuperAdmin: 'Full system access. Can assign admin roles and manage all organizations.',
    Admin: 'Full organization access. Can manage users and all organization data.',
    SalesManager: 'Manage sales team, leads, and targets.',
    SalesRep: 'Access to leads, customers, vehicles, and sales-related features.',
    ServiceAdvisor: 'Access to service jobs, parts inventory, and service reports.',
    Technician: 'Access to service jobs and workshop tools.',
    Marketing: 'Access to marketing campaigns and ROI reports.',
    Finance: 'Access to invoices, payments, and financial reports.'
};

/**
 * Get role color for UI
 */
export function getRoleColor(role: Role): string {
    const colors: Partial<Record<Role, string>> = {
        SuperAdmin: 'purple',
        Admin: 'blue',
        SalesManager: 'indigo',
        SalesRep: 'green',
        ServiceAdvisor: 'cyan',
        Technician: 'teal',
        Marketing: 'pink',
        Finance: 'orange'
    };
    return colors[role] || 'gray';
}

/**
 * List all organizations (Super Admin only)
 */
export async function listOrganizations(): Promise<Organization[]> {
    const isMockData = localStorage.getItem('useMockData') === 'true';
    if (isMockData) {
        const { MOCK_ORGANIZATIONS } = await import('../mockData');
        const persistedOrgs = JSON.parse(localStorage.getItem('autosuite_persisted_orgs') || '[]');
        return [...MOCK_ORGANIZATIONS, ...persistedOrgs];
    }

    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching organizations:', error.message, error.details, error.hint);
        return [];
    }

    return (data || []).map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        domain: o.domain,
        logo_url: o.logo_url,
        address: o.address,
        phone: o.phone,
        email: o.email,
        subscription_tier: o.subscription_tier,
        subscription_status: o.subscription_status,
        max_users: o.max_users,
        max_branches: o.max_branches,
        createdAt: o.created_at
    }));
}

/**
 * Update an organization's details (Super Admin only)
 */
export async function updateOrganization(
    orgId: string,
    updates: Partial<Pick<Organization, 'name' | 'slug' | 'domain' | 'address' | 'phone' | 'email' | 'logo_url' | 'subscription_tier' | 'max_users' | 'max_branches'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('organizations')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update organization' };
    }
}

/**
 * Toggle organization status between active and suspended
 */
export async function toggleOrgStatus(
    orgId: string,
    currentStatus: string
): Promise<{ success: boolean; newStatus?: string; error?: string }> {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
        const { error } = await supabase
            .from('organizations')
            .update({
                subscription_status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId);

        if (error) throw error;
        return { success: true, newStatus };
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update status' };
    }
}

/**
 * Create a new organization with its first admin user
 */
export async function createOrganizationWithAdmin(
    orgName: string,
    adminEmail: string,
    adminPassword: string,
    adminName: string
): Promise<{ success: boolean; error?: string }> {
    const isMockData = localStorage.getItem('useMockData') === 'true';

    if (isMockData) {
        const orgId = `org-${Date.now()}`;
        const newOrg: Organization = {
            id: orgId,
            name: orgName,
            slug: orgName.toLowerCase().replace(/\s+/g, '-'),
            subscription_status: 'active',
            createdAt: new Date().toISOString()
        };

        const persistedOrgs = JSON.parse(localStorage.getItem('autosuite_persisted_orgs') || '[]');
        persistedOrgs.push(newOrg);
        localStorage.setItem('autosuite_persisted_orgs', JSON.stringify(persistedOrgs));

        // Create the admin user for this org
        const newUser: UserProfile = {
            id: `U-${Date.now()}`,
            email: adminEmail,
            name: adminName,
            role: 'Admin',
            orgId: orgId,
            branchId: null,
            status: 'Active'
        };

        const persistedUsers = JSON.parse(localStorage.getItem('autosuite_persisted_mock_users') || '[]');
        persistedUsers.push({
            ...newUser,
            password: adminPassword,
            branchId: 'B001'
        });
        localStorage.setItem('autosuite_persisted_mock_users', JSON.stringify(persistedUsers));

        return { success: true };
    }

    try {
        // We use the Edge Function for this as it needs to do both org and user creation
        const { data, error } = await supabase.functions.invoke('create-organization', {
            body: {
                orgName,
                adminEmail,
                adminPassword,
                adminName
            }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to create organization' };
    }
}

/**
 * Reset a user's password (Super Admin only OR Admin in own org)
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const isMockData = localStorage.getItem('useMockData') === 'true';
    if (isMockData) {
        let persistedUsers = JSON.parse(localStorage.getItem('autosuite_persisted_mock_users') || '[]');
        const userIndex = persistedUsers.findIndex((u: any) => u.id === userId);
        
        if (userIndex > -1) {
            persistedUsers[userIndex].password = newPassword;
            localStorage.setItem('autosuite_persisted_mock_users', JSON.stringify(persistedUsers));
            return { success: true };
        }
        return { success: true }; 
    }

    try {
        // Need to use Edge Function since client auth cannot update other users
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: {
                id: userId,
                password: newPassword,
                action: 'update_password'
            }
        });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to reset password' };
    }
}

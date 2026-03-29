import { supabase } from './supabase';

/**
 * Multi-Tenancy Utilities
 * Helper functions for managing organization-scoped data
 */

/**
 * Get the current user's organization ID
 * @returns Promise<string | null> - The organization ID or null if not found
 */
export async function getCurrentOrgId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

    if (!profile) {
        // Fallback to first profile if none active (e.g. initial login)
        const { data: firstProfile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
        return (firstProfile as any)?.org_id || null;
    }

    return (profile as any)?.org_id || null;
}

/**
 * Automatically add org_id to data before insert/update
 * @param data - The data object to add org_id to
 * @returns Promise<T & { org_id: string }> - Data with org_id added
 */
export async function withOrgId<T extends Record<string, any>>(data: T): Promise<T & { org_id: string }> {
    const orgId = await getCurrentOrgId();

    if (!orgId) {
        throw new Error('User not associated with an organization');
    }

    return {
        ...data,
        org_id: orgId
    };
}

/**
 * Automatically add org_id to multiple records
 * @param records - Array of records to add org_id to
 * @returns Promise<Array<T & { org_id: string }>> - Records with org_id added
 */
export async function withOrgIdBatch<T extends Record<string, any>>(
    records: T[]
): Promise<Array<T & { org_id: string }>> {
    const orgId = await getCurrentOrgId();

    if (!orgId) {
        throw new Error('User not associated with an organization');
    }

    return records.map(record => ({
        ...record,
        org_id: orgId
    }));
}

/**
 * Check if user has permission for an action
 * @param requiredRole - The minimum role required
 * @returns Promise<boolean> - True if user has permission
 */
export async function hasOrgPermission(
    requiredRole: 'owner' | 'admin' | 'manager' | 'user'
): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

    if (!profile?.role) {
        return false;
    }

    const roleHierarchy = {
        owner: 4,
        admin: 3,
        manager: 2,
        user: 1
    };

    return (roleHierarchy[profile.role as keyof typeof roleHierarchy] || 0) >= roleHierarchy[requiredRole];
}

/**
 * Get organization details for current user
 * @returns Promise<Organization | null>
 */
export async function getCurrentOrganization() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
      organizations (
        id,
        name,
        slug,
        domain,
        logo_url,
        subscription_tier,
        subscription_status,
        max_users,
        max_branches,
        settings
      )
    `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

    if (!profile) {
        const { data: firstProfile } = await supabase
            .from('profiles')
            .select('organizations(*)')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
        return (firstProfile as any)?.organizations || null;
    }

    return (profile as any)?.organizations || null;
}

/**
 * Validate that a record belongs to the user's organization
 * @param table - Table name
 * @param recordId - Record ID to validate
 * @returns Promise<boolean> - True if record belongs to user's org
 */
export async function validateOrgOwnership(
    table: string,
    recordId: string
): Promise<boolean> {
    const orgId = await getCurrentOrgId();

    if (!orgId) {
        return false;
    }

    const { data } = await supabase
        .from(table as any)
        .select('org_id')
        .eq('id', recordId)
        .single();

    return (data as any)?.org_id === orgId;
}

/**
 * Get usage metrics for current organization
 * @returns Promise<{ users: number, leads: number, invoices: number }>
 */
export async function getOrgUsageMetrics() {
    const orgId = await getCurrentOrgId();

    if (!orgId) {
        return { users: 0, leads: 0, invoices: 0, vehicles: 0 };
    }

    const [
        { count: users },
        { count: leads },
        { count: invoices },
        { count: vehicles }
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('org_id', orgId)
    ]);

    return {
        users: users || 0,
        leads: leads || 0,
        invoices: invoices || 0,
        vehicles: vehicles || 0
    };
}

/**
 * Check if organization has reached usage limits
 * @returns Promise<{ canAddUsers: boolean, canAddBranches: boolean }>
 */
export async function checkOrgLimits() {
    const org = await getCurrentOrganization() as any;

    if (!org) {
        return { canAddUsers: false, canAddBranches: false };
    }

    const { users } = await getOrgUsageMetrics();

    const { count: branches } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org.id);

    return {
        canAddUsers: users < org.max_users,
        canAddBranches: (branches || 0) < org.max_branches
    };
}

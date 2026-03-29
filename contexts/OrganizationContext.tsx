import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    logo_url?: string;
    subscription_tier: 'starter' | 'professional' | 'enterprise';
    subscription_status: 'active' | 'trial' | 'suspended' | 'cancelled';
    max_users: number;
    max_branches: number;
    settings: Record<string, any>;
}

interface OrganizationContextType {
    organization: Organization | null;
    isLoading: boolean;
    refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
    isLoading: true,
    refreshOrganization: async () => { }
});

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: authUser } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrganization = async () => {
        try {
            if (!authUser) {
                setOrganization(null);
                setIsLoading(false);
                return;
            }

            // Get user's profile with organization data
            // Get active organization for the user
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select(`
                  org_id,
                  organizations (*)
                `)
                .eq('user_id', authUser.id)
                .eq('is_active', true)
                .maybeSingle();

            if (profileError) {
                console.error('Error fetching organization:', profileError);
                setOrganization(null);
                setIsLoading(false);
                return;
            }

            if (profile?.organizations) {
                setOrganization(profile.organizations as any);
            } else {
                // Fallback to first profile if none active
                const { data: firstProfile } = await supabase
                    .from('profiles')
                    .select('organizations(*)')
                    .eq('user_id', authUser.id)
                    .limit(1)
                    .maybeSingle();
                setOrganization((firstProfile as any)?.organizations || null);
            }
        } catch (error) {
            console.error('Error in fetchOrganization:', error);
            setOrganization(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganization();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                fetchOrganization();
            } else if (event === 'SIGNED_OUT') {
                setOrganization(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [authUser?.id, authUser?.orgId]); // Refresh when user or org selection changes

    return (
        <OrganizationContext.Provider
            value={{
                organization,
                isLoading,
                refreshOrganization: fetchOrganization
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};

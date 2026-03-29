export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            activities: {
                Row: {
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    entity_id: string
                    entity_type: string
                    id: string
                    kind: string
                    org_id: string | null
                    title: string
                }
                Insert: {
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    entity_id: string
                    entity_type: string
                    id?: string
                    kind: string
                    org_id?: string | null
                    title: string
                }
                Update: {
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    entity_id?: string
                    entity_type?: string
                    id?: string
                    kind?: string
                    org_id?: string | null
                    title?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "activities_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activities_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            appointments: {
                Row: {
                    branch_id: string | null
                    created_at: string | null
                    customer_id: string | null
                    customer_name: string | null
                    end_time: string
                    id: string
                    notes: string | null
                    org_id: string | null
                    resource_id: string | null
                    start_time: string
                    status: string | null
                    title: string
                    type: string | null
                }
                Insert: {
                    branch_id?: string | null
                    created_at?: string | null
                    customer_id?: string | null
                    customer_name?: string | null
                    end_time: string
                    id?: string
                    notes?: string | null
                    org_id?: string | null
                    resource_id?: string | null
                    start_time: string
                    status?: string | null
                    title: string
                    type?: string | null
                }
                Update: {
                    branch_id?: string | null
                    created_at?: string | null
                    customer_id?: string | null
                    customer_name?: string | null
                    end_time?: string
                    id?: string
                    notes?: string | null
                    org_id?: string | null
                    resource_id?: string | null
                    start_time?: string
                    status?: string | null
                    title?: string
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_branch_id_fkey"
                        columns: ["branch_id"]
                        isOneToOne: false
                        referencedRelation: "branches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            audit_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    id: string
                    ip_address: string | null
                    new_values: Json | null
                    old_values: Json | null
                    org_id: string | null
                    resource_id: string | null
                    resource_type: string
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    id?: string
                    ip_address?: string | null
                    new_values?: Json | null
                    old_values?: Json | null
                    org_id?: string | null
                    resource_id?: string | null
                    resource_type: string
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    id?: string
                    ip_address?: string | null
                    new_values?: Json | null
                    old_values?: Json | null
                    org_id?: string | null
                    resource_id?: string | null
                    resource_type?: string
                    user_agent?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "audit_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            branches: {
                Row: {
                    created_at: string | null
                    id: string
                    location: string
                    name: string
                    org_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    location: string
                    name: string
                    org_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    location?: string
                    name?: string
                    org_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "branches_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            campaigns: {
                Row: {
                    branch_id: string | null
                    channel: string
                    created_at: string | null
                    id: string
                    leads_generated: number | null
                    name: string
                    org_id: string | null
                    revenue_generated: number | null
                    spend: number | null
                    status: string
                }
                Insert: {
                    branch_id?: string | null
                    channel: string
                    created_at?: string | null
                    id?: string
                    leads_generated?: number | null
                    name: string
                    org_id?: string | null
                    revenue_generated?: number | null
                    spend?: number | null
                    status?: string
                }
                Update: {
                    branch_id?: string | null
                    channel?: string
                    created_at?: string | null
                    id?: string
                    leads_generated?: number | null
                    name?: string
                    org_id?: string | null
                    revenue_generated?: number | null
                    spend?: number | null
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "campaigns_branch_id_fkey"
                        columns: ["branch_id"]
                        isOneToOne: false
                        referencedRelation: "branches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "campaigns_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            customers: {
                Row: {
                    branch_id: string | null
                    cars_owned: Json | null
                    created_at: string | null
                    email: string | null
                    id: string
                    last_service_at: string | null
                    location: string | null
                    ltv: number | null
                    name: string
                    next_service_due_at: string | null
                    org_id: string | null
                    phone: string
                    referrals: number | null
                }
                Insert: {
                    branch_id?: string | null
                    cars_owned?: Json | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    last_service_at?: string | null
                    location?: string | null
                    ltv?: number | null
                    name: string
                    next_service_due_at?: string | null
                    org_id?: string | null
                    phone: string
                    referrals?: number | null
                }
                Update: {
                    branch_id?: string | null
                    cars_owned?: Json | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    last_service_at?: string | null
                    location?: string | null
                    ltv?: number | null
                    name?: string
                    next_service_due_at?: string | null
                    org_id?: string | null
                    phone?: string
                    referrals?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "customers_branch_id_fkey"
                        columns: ["branch_id"]
                        isOneToOne: false
                        referencedRelation: "branches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "customers_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            invoice_items: {
                Row: {
                    description: string
                    id: string
                    invoice_id: string | null
                    org_id: string | null
                    quantity: number
                    total: number
                    type: string | null
                    unit_price: number
                }
                Insert: {
                    description: string
                    id?: string
                    invoice_id?: string | null
                    org_id?: string | null
                    quantity: number
                    total: number
                    type?: string | null
                    unit_price: number
                }
                Update: {
                    description?: string
                    id?: string
                    invoice_id?: string | null
                    org_id?: string | null
                    quantity?: number
                    total?: number
                    type?: string | null
                    unit_price?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "invoice_items_invoice_id_fkey"
                        columns: ["invoice_id"]
                        isOneToOne: false
                        referencedRelation: "invoices"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoice_items_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            invoices: {
                Row: {
                    created_at: string | null
                    customer_id: string | null
                    date: string | null
                    due_date: string | null
                    id: string
                    org_id: string | null
                    status: string | null
                    subtotal: number
                    tax: number
                    total: number
                    type: string | null
                }
                Insert: {
                    created_at?: string | null
                    customer_id?: string | null
                    date?: string | null
                    due_date?: string | null
                    id?: string
                    org_id?: string | null
                    status?: string | null
                    subtotal: number
                    tax: number
                    total: number
                    type?: string | null
                }
                Update: {
                    created_at?: string | null
                    customer_id?: string | null
                    date?: string | null
                    due_date?: string | null
                    id?: string
                    org_id?: string | null
                    status?: string | null
                    subtotal?: number
                    tax?: number
                    total?: number
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "invoices_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            leads: {
                Row: {
                    address: string | null
                    ai_score: number | null
                    booking_date: string | null
                    branch_id: string | null
                    budget: number | null
                    created_at: string | null
                    delivery_date: string | null
                    email: string | null
                    exchange_details: Json | null
                    id: string
                    model_interest: string | null
                    name: string
                    next_follow_up_date: string | null
                    org_id: string | null
                    owner_id: string | null
                    phone: string
                    quotation_issued: boolean | null
                    remarks: string | null
                    source: string
                    status: string
                    temperature: string | null
                    test_drive_date: string | null
                    updated_at: string | null
                    vehicle_color: string | null
                }
                Insert: {
                    address?: string | null
                    ai_score?: number | null
                    booking_date?: string | null
                    branch_id?: string | null
                    budget?: number | null
                    created_at?: string | null
                    delivery_date?: string | null
                    email?: string | null
                    exchange_details?: Json | null
                    id?: string
                    model_interest?: string | null
                    name: string
                    next_follow_up_date?: string | null
                    org_id?: string | null
                    owner_id?: string | null
                    phone: string
                    quotation_issued?: boolean | null
                    remarks?: string | null
                    source: string
                    status?: string
                    temperature?: string | null
                    test_drive_date?: string | null
                    updated_at?: string | null
                    vehicle_color?: string | null
                }
                Update: {
                    address?: string | null
                    ai_score?: number | null
                    booking_date?: string | null
                    branch_id?: string | null
                    budget?: number | null
                    created_at?: string | null
                    delivery_date?: string | null
                    email?: string | null
                    exchange_details?: Json | null
                    id?: string
                    model_interest?: string | null
                    name?: string
                    next_follow_up_date?: string | null
                    org_id?: string | null
                    owner_id?: string | null
                    phone?: string
                    quotation_issued?: boolean | null
                    remarks?: string | null
                    source?: string
                    status?: string
                    temperature?: string | null
                    test_drive_date?: string | null
                    updated_at?: string | null
                    vehicle_color?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "leads_branch_id_fkey"
                        columns: ["branch_id"]
                        isOneToOne: false
                        referencedRelation: "branches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "leads_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "leads_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            organization_invites: {
                Row: {
                    accepted_at: string | null
                    created_at: string | null
                    email: string
                    expires_at: string
                    id: string
                    invited_by: string | null
                    org_id: string
                    role: string | null
                    token: string
                }
                Insert: {
                    accepted_at?: string | null
                    created_at?: string | null
                    email: string
                    expires_at: string
                    id?: string
                    invited_by?: string | null
                    org_id: string
                    role?: string | null
                    token: string
                }
                Update: {
                    accepted_at?: string | null
                    created_at?: string | null
                    email?: string
                    expires_at?: string
                    id?: string
                    invited_by?: string | null
                    org_id?: string
                    role?: string | null
                    token?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "organization_invites_invited_by_fkey"
                        columns: ["invited_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "organization_invites_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            organizations: {
                Row: {
                    address: string | null
                    created_at: string | null
                    domain: string | null
                    email: string | null
                    id: string
                    logo_url: string | null
                    max_branches: number | null
                    max_users: number | null
                    name: string
                    phone: string | null
                    settings: Json | null
                    slug: string
                    subscription_status: string | null
                    subscription_tier: string | null
                    trial_ends_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string | null
                    domain?: string | null
                    email?: string | null
                    id?: string
                    logo_url?: string | null
                    max_branches?: number | null
                    max_users?: number | null
                    name: string
                    phone?: string | null
                    settings?: Json | null
                    slug: string
                    subscription_status?: string | null
                    subscription_tier?: string | null
                    trial_ends_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string | null
                    domain?: string | null
                    email?: string | null
                    id?: string
                    logo_url?: string | null
                    max_branches?: number | null
                    max_users?: number | null
                    name?: string
                    phone?: string | null
                    settings?: Json | null
                    slug?: string
                    subscription_status?: string | null
                    subscription_tier?: string | null
                    trial_ends_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            parts: {
                Row: {
                    bin_location: string | null
                    category: string | null
                    cost: number
                    created_at: string | null
                    description: string | null
                    id: string
                    min_stock_level: number | null
                    name: string
                    org_id: string | null
                    price: number
                    sku: string
                    status: string | null
                    stock: number | null
                    supplier: string | null
                }
                Insert: {
                    bin_location?: string | null
                    category?: string | null
                    cost: number
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    min_stock_level?: number | null
                    name: string
                    org_id?: string | null
                    price: number
                    sku: string
                    status?: string | null
                    stock?: number | null
                    supplier?: string | null
                }
                Update: {
                    bin_location?: string | null
                    category?: string | null
                    cost?: number
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    min_stock_level?: number | null
                    name?: string
                    org_id?: string | null
                    price?: number
                    sku?: string
                    status?: string | null
                    stock?: number | null
                    supplier?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "parts_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            permissions: {
                Row: {
                    action: string
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    resource: string
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    resource: string
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    resource?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    branch_id: string | null
                    created_at: string | null
                    department: string | null
                    email: string
                    id: string
                    name: string
                    org_id: string | null
                    role: string
                    status: string | null
                    user_id: string | null
                    is_active: boolean
                }
                Insert: {
                    avatar_url?: string | null
                    branch_id?: string | null
                    created_at?: string | null
                    department?: string | null
                    email: string
                    id: string
                    name: string
                    org_id?: string | null
                    role?: string
                    status?: string | null
                    user_id?: string | null
                    is_active?: boolean
                }
                Update: {
                    avatar_url?: string | null
                    branch_id?: string | null
                    created_at?: string | null
                    department?: string | null
                    email?: string
                    id?: string
                    name?: string
                    org_id?: string | null
                    role?: string
                    status?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            quotations: {
                Row: {
                    bank_id: string | null
                    created_at: string | null
                    date: string | null
                    discount: number | null
                    final_price: number
                    id: string
                    lead_id: string | null
                    price: number
                    status: string | null
                    valid_until: string | null
                    vehicle_color: string | null
                    vehicle_model: string
                }
                Insert: {
                    bank_id?: string | null
                    created_at?: string | null
                    date?: string | null
                    discount?: number | null
                    final_price: number
                    id?: string
                    lead_id?: string | null
                    price: number
                    status?: string | null
                    valid_until?: string | null
                    vehicle_color?: string | null
                    vehicle_model: string
                }
                Update: {
                    bank_id?: string | null
                    created_at?: string | null
                    date?: string | null
                    discount?: number | null
                    final_price?: number
                    id?: string
                    lead_id?: string | null
                    price: number
                    status?: string | null
                    valid_until?: string | null
                    vehicle_color?: string | null
                    vehicle_model?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "quotations_lead_id_fkey"
                        columns: ["lead_id"]
                        isOneToOne: false
                        referencedRelation: "leads"
                        referencedColumns: ["id"]
                    },
                ]
            }
            role_permissions: {
                Row: {
                    created_at: string | null
                    id: string
                    permission_id: string | null
                    role: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    permission_id?: string | null
                    role: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    permission_id?: string | null
                    role?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "role_permissions_permission_id_fkey"
                        columns: ["permission_id"]
                        isOneToOne: false
                        referencedRelation: "permissions"
                        referencedColumns: ["id"]
                    },
                ]
            }
            service_jobs: {
                Row: {
                    actual_cost: number | null
                    branch_id: string | null
                    cost_estimate: number | null
                    created_at: string | null
                    customer_id: string | null
                    id: string
                    org_id: string | null
                    promised_at: string | null
                    reg_number: string
                    status: string | null
                    technician_id: string | null
                    type: string | null
                    vehicle_model: string
                }
                Insert: {
                    actual_cost?: number | null
                    branch_id?: string | null
                    cost_estimate?: number | null
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    org_id?: string | null
                    promised_at?: string | null
                    reg_number: string
                    status?: string | null
                    technician_id?: string | null
                    type?: string | null
                    vehicle_model: string
                }
                Update: {
                    actual_cost?: number | null
                    branch_id?: string | null
                    cost_estimate?: number | null
                    created_at?: string | null
                    customer_id?: string | null
                    id?: string
                    org_id?: string | null
                    promised_at?: string | null
                    reg_number?: string
                    status?: string | null
                    technician_id?: string | null
                    type?: string | null
                    vehicle_model?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "service_jobs_branch_id_fkey"
                        columns: ["branch_id"]
                        isOneToOne: false
                        referencedRelation: "branches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "service_jobs_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "service_jobs_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "service_jobs_technician_id_fkey"
                        columns: ["technician_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            subscriptions: {
                Row: {
                    created_at: string | null
                    current_period_end: string | null
                    current_period_start: string | null
                    id: string
                    org_id: string
                    plan: string
                    status: string | null
                    stripe_customer_id: string | null
                    stripe_subscription_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    current_period_end?: string | null
                    current_period_start?: string | null
                    id?: string
                    org_id: string
                    plan: string
                    status?: string | null
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    current_period_end?: string | null
                    current_period_start?: string | null
                    id?: string
                    org_id?: string
                    plan?: string
                    status?: string | null
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            usage_metrics: {
                Row: {
                    id: string
                    metric_type: string
                    org_id: string
                    recorded_at: string | null
                    value: number
                }
                Insert: {
                    id?: string
                    metric_type: string
                    org_id: string
                    recorded_at?: string | null
                    value?: number
                }
                Update: {
                    id?: string
                    metric_type?: string
                    org_id?: string
                    recorded_at?: string | null
                    value?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "usage_metrics_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_activity: {
                Row: {
                    activity_type: string
                    created_at: string | null
                    description: string | null
                    id: string
                    metadata: Json | null
                    org_id: string | null
                    user_id: string | null
                }
                Insert: {
                    activity_type: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    metadata?: Json | null
                    org_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    activity_type?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    metadata?: Json | null
                    org_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_activity_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_activity_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            vehicles: {
                Row: {
                    branch_id: string | null
                    color: string
                    cost: number
                    created_at: string | null
                    fuel_type: string
                    id: string
                    image_url: string | null
                    model: string
                    org_id: string | null
                    price: number
                    specifications: Json | null
                    status: string
                    variant: string
                    vin: string
                    year: number
                }
                Insert: {
                    branch_id?: string | null
                    color: string
                    cost: number
                    created_at?: string | null
                    fuel_type: string
                    id?: string
                    image_url?: string | null
                    model: string
                    org_id?: string | null
                    price: number
                    specifications?: Json | null
                    status?: string
                    variant: string
                    vin: string
                    year: number
                }
                Update: {
                    branch_id?: string | null
                    color?: string
                    cost?: number
                    created_at?: string | null
                    fuel_type?: string
                    id?: string
                    image_url?: string | null
                    model?: string
                    org_id?: string | null
                    price?: number
                    specifications?: Json | null
                    status?: string
                    variant?: string
                    vin?: string
                    year?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "vehicles_branch_id_fkey"
                        columns: ["branch_id"]
                        isOneToOne: false
                        referencedRelation: "branches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "vehicles_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            has_permission: {
                Args: {
                    required_permission: string
                }
                Returns: boolean
            }
            has_role: {
                Args: {
                    required_role: string
                }
                Returns: boolean
            }
            set_active_org: {
                Args: {
                    target_org_id: string
                }
                Returns: undefined
            }
            user_org_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

type SchemaOf<S extends keyof Database> = Database[S] extends {
    Tables: Record<string, unknown>
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: Record<string, unknown>
} ? Database[S] : never

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (SchemaOf<PublicTableNameOrOptions["schema"]>["Tables"] &
        SchemaOf<PublicTableNameOrOptions["schema"]>["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (SchemaOf<PublicTableNameOrOptions["schema"]>["Tables"] &
        SchemaOf<PublicTableNameOrOptions["schema"]>["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof SchemaOf<PublicTableNameOrOptions["schema"]>["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? SchemaOf<PublicTableNameOrOptions["schema"]>["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof SchemaOf<PublicTableNameOrOptions["schema"]>["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? SchemaOf<PublicTableNameOrOptions["schema"]>["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof SchemaOf<PublicEnumNameOrOptions["schema"]>["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? SchemaOf<PublicEnumNameOrOptions["schema"]>["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { Lead, Vehicle, ServiceJob, Campaign, DashboardExceptions, Customer, Invoice, Part, Appointment, User, Activity } from './types';
import * as MockData from './mockData';

// Re-export supabase for direct use
export { supabase };

// Helper to check if mock data mode is enabled
const isMockDataEnabled = () => {
  return localStorage.getItem('useMockData') === 'true';
};

export const api = {
  dashboard: {
    getExceptions: async (): Promise<DashboardExceptions> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_DASHBOARD_EXCEPTIONS;
      }

      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: overdueFollowups },
        { count: stuckLeads },
        { count: agedInventory },
        { count: overdueJobs },
        { count: lowStockParts },
        { count: pendingInvoices }
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).lt('next_follow_up_date', now.toISOString()).neq('status', 'Lost').neq('status', 'Delivered'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'Proposal').lt('updated_at', twoDaysAgo),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'In Stock').lt('created_at', sixtyDaysAgo),
        supabase.from('service_jobs').select('*', { count: 'exact', head: true }).lt('promised_at', now.toISOString()).neq('status', 'Ready').neq('status', 'Delivered'),
        supabase.from('parts').select('*', { count: 'exact', head: true }).or('status.eq.Low Stock,status.eq.Out of Stock'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).neq('status', 'Paid').neq('status', 'Void')
      ]);

      return {
        overdueFollowups: overdueFollowups || 0,
        stuckLeads: stuckLeads || 0,
        agedInventory: agedInventory || 0,
        overdueJobs: overdueJobs || 0,
        lowStockParts: lowStockParts || 0,
        pendingInvoices: pendingInvoices || 0
      };
    }
  },
  leads: {
    list: async (): Promise<Lead[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_LEADS;
      }

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        email: d.email || undefined,
        address: d.address || undefined,
        source: d.source,
        modelInterest: d.model_interest || '',
        vehicleColor: d.vehicle_color || undefined,
        status: d.status,
        temperature: d.temperature as any,
        aiScore: d.ai_score || 0,
        ownerId: d.owner_id,
        branchId: d.branch_id || '',
        createdAt: d.created_at || '',
        updatedAt: d.updated_at || '',
        budget: Number(d.budget) || 0,
        quotationIssued: d.quotation_issued || false,
        exchange: typeof d.exchange_details === 'object' ? d.exchange_details as any : { hasExchange: false },
        notes: [],
        testDriveDate: d.test_drive_date || undefined,
        nextFollowUpDate: d.next_follow_up_date || undefined,
        bookingDate: d.booking_date || undefined,
        deliveryDate: d.delivery_date || undefined,
        remarks: d.remarks || undefined,
      }));
    },
    create: async (lead: Partial<Lead>): Promise<Lead> => {
      if (isMockDataEnabled()) {
        const newLead: Lead = {
          id: `mock-${Date.now()}`,
          name: lead.name || '',
          phone: lead.phone || '',
          email: lead.email,
          address: lead.address,
          source: lead.source || 'Walk-in',
          modelInterest: lead.modelInterest || '',
          vehicleColor: lead.vehicleColor,
          budget: lead.budget || 0,
          status: lead.status || 'New',
          temperature: lead.temperature || 'Warm',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          aiScore: 50,
          ownerId: lead.ownerId || null,
          branchId: lead.branchId || 'b1',
          quotationIssued: false,
          exchange: lead.exchange || { hasExchange: false },
          remarks: lead.remarks,
          notes: []
        };
        MockData.MOCK_LEADS.unshift(newLead);
        return newLead;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          name: lead.name || '',
          phone: lead.phone || '',
          email: lead.email || null,
          address: lead.address || null,
          source: lead.source || 'Walk-in',
          model_interest: lead.modelInterest || '',
          vehicle_color: lead.vehicleColor || null,
          budget: lead.budget || 0,
          status: lead.status || 'New',
          temperature: lead.temperature || 'Warm',
          owner_id: lead.ownerId || null,
          quotation_issued: false,
          exchange_details: lead.exchange || { hasExchange: false },
          remarks: lead.remarks || null,
          test_drive_date: lead.testDriveDate || null,
          next_follow_up_date: lead.nextFollowUpDate || null,
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data as any;
    },
    update: async (id: string, patch: Partial<Lead>): Promise<Lead> => {
      const dbPatch: any = {};
      const map: Partial<Record<keyof Lead, string>> = {
        name: 'name', phone: 'phone', email: 'email', address: 'address',
        source: 'source', modelInterest: 'model_interest', vehicleColor: 'vehicle_color',
        status: 'status', temperature: 'temperature', budget: 'budget', quotationIssued: 'quotation_issued',
        exchange: 'exchange_details',
        testDriveDate: 'test_drive_date', nextFollowUpDate: 'next_follow_up_date',
        bookingDate: 'booking_date', deliveryDate: 'delivery_date', remarks: 'remarks'
      };

      (Object.keys(patch) as Array<keyof Lead>).forEach(key => {
        const dbKey = map[key];
        if (dbKey && patch[key] !== undefined) {
          dbPatch[dbKey] = patch[key];
        }
      });

      const { data, error } = await supabase
        .from('leads')
        .update(dbPatch)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) throw error || new Error('Update failed');
      return data as any;
    }
  },
  inventory: {
    list: async (): Promise<Vehicle[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_VEHICLES;
      }

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(v => {
        const createdAt = new Date(v.created_at || Date.now());
        const daysInStock = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        let agingBucket: Vehicle['agingBucket'] = '0-30';
        if (daysInStock > 90) agingBucket = '90+';
        else if (daysInStock > 60) agingBucket = '61-90';
        else if (daysInStock > 30) agingBucket = '31-60';

        return {
          id: v.id,
          model: v.model,
          variant: v.variant,
          year: v.year,
          color: v.color,
          vin: v.vin,
          price: v.price,
          cost: v.cost,
          status: v.status as any,
          branchId: v.branch_id || '',
          daysInStock,
          fuelType: v.fuel_type as any,
          image: v.image_url || '',
          specifications: v.specifications as any || [],
          availableColors: v.available_colors as any || [],
          agingBucket
        };
      });
    },
    create: async (vehicle: Partial<Vehicle>): Promise<Vehicle> => {
      if (isMockDataEnabled()) {
        // Mock mode: add to mock data array and return
        const newVehicle: Vehicle = {
          id: `mock-${Date.now()}`,
          model: vehicle.model || '',
          variant: vehicle.variant || '',
          year: vehicle.year || 2024,
          color: vehicle.color || '',
          vin: vehicle.vin || `VIN-${Date.now()}`,
          price: vehicle.price || 0,
          cost: vehicle.cost || 0,
          status: vehicle.status || 'In Stock',
          fuelType: vehicle.fuelType || 'Petrol',
          image: vehicle.image || '',
          specifications: vehicle.specifications || [],
          availableColors: vehicle.availableColors || [],
          branchId: vehicle.branchId || '',
          daysInStock: 0,
          agingBucket: '0-30'
        };
        MockData.MOCK_VEHICLES.push(newVehicle);
        return newVehicle;
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          model: vehicle.model || '',
          variant: vehicle.variant || '',
          year: vehicle.year || 2024,
          color: vehicle.color || '',
          vin: vehicle.vin || '',
          price: vehicle.price || 0,
          cost: vehicle.cost || 0,
          status: vehicle.status || 'In Stock',
          fuel_type: vehicle.fuelType || 'Petrol',
          image_url: vehicle.image || '',
          specifications: (vehicle.specifications || []) as any,
          available_colors: (vehicle.availableColors || []) as any
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data as any;
    },
    update: async (id: string, patch: Partial<Vehicle>): Promise<Vehicle> => {
      if (isMockDataEnabled()) {
        // Mock mode: update in mock data array
        const idx = MockData.MOCK_VEHICLES.findIndex(v => v.id === id);
        if (idx !== -1) {
          MockData.MOCK_VEHICLES[idx] = { ...MockData.MOCK_VEHICLES[idx], ...patch };
          return MockData.MOCK_VEHICLES[idx];
        }
        throw new Error('Vehicle not found in mock data');
      }

      const dbPatch: any = {};
      // Use hasOwnProperty check instead of truthy check to allow updating to empty/zero values
      if (patch.hasOwnProperty('model')) dbPatch.model = patch.model;
      if (patch.hasOwnProperty('variant')) dbPatch.variant = patch.variant;
      if (patch.hasOwnProperty('year')) dbPatch.year = patch.year;
      if (patch.hasOwnProperty('color')) dbPatch.color = patch.color;
      if (patch.hasOwnProperty('vin')) dbPatch.vin = patch.vin;
      if (patch.hasOwnProperty('price')) dbPatch.price = patch.price;
      if (patch.hasOwnProperty('cost')) dbPatch.cost = patch.cost;
      if (patch.hasOwnProperty('status')) dbPatch.status = patch.status;
      if (patch.hasOwnProperty('fuelType')) dbPatch.fuel_type = patch.fuelType;
      if (patch.hasOwnProperty('image')) dbPatch.image_url = patch.image;
      if (patch.hasOwnProperty('specifications')) dbPatch.specifications = patch.specifications;
      if (patch.hasOwnProperty('availableColors')) dbPatch.available_colors = patch.availableColors;

      const { data, error } = await supabase
        .from('vehicles')
        .update(dbPatch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as any;
    },
    delete: async (id: string): Promise<void> => {
      if (isMockDataEnabled()) {
        // Mock mode: remove from mock data array
        const idx = MockData.MOCK_VEHICLES.findIndex(v => v.id === id);
        if (idx !== -1) {
          MockData.MOCK_VEHICLES.splice(idx, 1);
        }
        return;
      }

      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    }
  },
  service: {
    list: async (): Promise<ServiceJob[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_SERVICE_JOBS;
      }

      const { data, error } = await supabase
        .from('service_jobs')
        .select('*, customers(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(j => ({
        id: j.id,
        customerId: j.customer_id || '',
        // @ts-ignore
        customerName: j.customers?.name || 'Unknown',
        vehicleModel: j.vehicle_model,
        regNumber: j.reg_number,
        type: j.type as any,
        status: j.status as any,
        technicianId: j.technician_id,
        branchId: j.branch_id || '',
        createdAt: j.created_at || '',
        promisedAt: j.promised_at || '',
        costEstimate: j.cost_estimate || 0,
        actualCost: j.actual_cost || 0,
        isOverdue: j.promised_at ? new Date(j.promised_at) < new Date() && j.status !== 'Ready' && j.status !== 'Delivered' : false,
        notes: []
      }));
    },
    get: async (id: string): Promise<ServiceJob | null> => {
      const { data, error } = await supabase
        .from('service_jobs')
        .select('*, customers(name)')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      const d = data as any;

      return {
        id: d.id,
        customerId: d.customer_id || '',
        // @ts-ignore
        customerName: d.customers?.name || 'Unknown',
        vehicleModel: d.vehicle_model,
        regNumber: d.reg_number,
        type: d.type as any,
        status: d.status as any,
        technicianId: d.technician_id,
        branchId: d.branch_id || '',
        createdAt: d.created_at || '',
        promisedAt: d.promised_at || '',
        costEstimate: d.cost_estimate || 0,
        actualCost: d.actual_cost || 0,
        isOverdue: d.promised_at ? new Date(d.promised_at) < new Date() && d.status !== 'Ready' && d.status !== 'Delivered' : false,
        notes: []
      };
    },
    create: async (job: Partial<ServiceJob>): Promise<ServiceJob> => {
      if (isMockDataEnabled()) {
        const newJob: ServiceJob = {
          id: `JOB-${Date.now()}`,
          customerId: job.customerId || '',
          customerName: job.customerName || '',
          vehicleModel: job.vehicleModel || '',
          regNumber: job.regNumber || '',
          type: job.type || 'Repair',
          status: 'Queued',
          technicianId: job.technicianId || null,
          branchId: job.branchId || 'b1',
          createdAt: new Date().toISOString(),
          promisedAt: job.promisedAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          costEstimate: job.costEstimate || 0,
          actualCost: 0,
          isOverdue: false,
          notes: []
        };
        MockData.MOCK_SERVICE_JOBS.unshift(newJob);
        return newJob;
      }

      const { data, error } = await supabase
        .from('service_jobs')
        .insert([{
          customer_id: job.customerId || null,
          vehicle_model: job.vehicleModel || '',
          reg_number: job.regNumber || '',
          type: job.type || 'Repair',
          status: 'Queued',
          technician_id: job.technicianId || null,
          promised_at: job.promisedAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          cost_estimate: job.costEstimate || 0,
          actual_cost: 0,
        } as any])
        .select('*, customers(name)')
        .single();

      if (error) throw error;
      const d = data as any;
      return {
        id: d.id,
        customerId: d.customer_id || '',
        customerName: d.customers?.name || job.customerName || 'Unknown',
        vehicleModel: d.vehicle_model,
        regNumber: d.reg_number,
        type: d.type,
        status: d.status,
        technicianId: d.technician_id,
        branchId: d.branch_id || '',
        createdAt: d.created_at || '',
        promisedAt: d.promised_at || '',
        costEstimate: d.cost_estimate || 0,
        actualCost: d.actual_cost || 0,
        isOverdue: false,
        notes: []
      };
    }
  },
  marketing: {
    listCampaigns: async (): Promise<Campaign[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_CAMPAIGNS;
      }
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(c => ({
        id: c.id,
        name: c.name,
        channel: c.channel as any,
        status: c.status as any,
        spend: c.spend || 0,
        leadsGenerated: c.leads_generated || 0,
        revenueGenerated: c.revenue_generated || 0,
        conversionRate: c.leads_generated && c.spend ? (c.leads_generated / (c.spend / 1000)) : 0,
        roi: 0
      }));
    }
  },
  customers: {
    list: async (): Promise<Customer[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_CUSTOMERS;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;

      return ((data as any[]) || []).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email || '',
        companyName: c.company_name || undefined,
        panNumber: c.pan_number || undefined,
        branchId: c.branch_id || '',
        location: c.location || '',
        ltv: c.ltv || 0,
        lastServiceAt: c.last_service_at || null,
        nextServiceDueAt: c.next_service_due_at || null,
        carsOwned: (c.cars_owned || []) as any,
        referrals: c.referrals || 0
      }));
    },
    create: async (customer: Partial<Customer>): Promise<Customer> => {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          company_name: customer.companyName || '',
          pan_number: customer.panNumber || '',
          location: customer.location || '',
          branch_id: customer.branchId || '',
          cars_owned: (customer.carsOwned || []) as any
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data as any;
    }
  },
  finance: {
    listInvoices: async (): Promise<Invoice[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_INVOICES;
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*, customers(name), invoice_items(*)')
        .order('date', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(i => ({
        id: i.id,
        customerId: i.customer_id || '',
        customerName: i.customers?.name || 'Unknown',
        date: i.date || '',
        dueDate: i.due_date || '',
        status: i.status as any,
        items: (i.invoice_items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total,
          type: item.type as any
        })),
        subtotal: i.subtotal,
        tax: i.tax,
        total: i.total,
        type: i.type as any
      }));
    }
  },
  parts: {
    list: async (): Promise<Part[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_PARTS;
      }
      const { data, error } = await supabase.from('parts').select('*');
      if (error) throw error;
      return ((data as any[]) || []).map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description || '',
        category: p.category as any,
        price: p.price,
        cost: p.cost,
        stock: p.stock || 0,
        minStockLevel: p.min_stock_level || 0,
        binLocation: p.bin_location || '',
        supplier: p.supplier || '',
        status: p.status as any
      }));
    },
    updateStock: async (id: string, newStock: number): Promise<void> => {
      if (isMockDataEnabled()) {
        const part = MockData.MOCK_PARTS.find(p => p.id === id);
        if (part) part.stock = newStock;
        return;
      }
      const { error } = await supabase
        .from('parts')
        .update({ stock: newStock })
        .eq('id', id);
      if (error) throw error;
    }
  },
  calendar: {
    listAppointments: async (): Promise<Appointment[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_APPOINTMENTS;
      }
      const { data, error } = await supabase.from('appointments').select('*');
      if (error) throw error;
      return ((data as any[]) || []).map(a => ({
        id: a.id,
        title: a.title,
        start: a.start_time,
        end: a.end_time,
        type: a.type as any,
        resourceId: a.resource_id || undefined,
        customerId: a.customer_id || undefined,
        customerName: a.customer_name || undefined,
        status: a.status as any,
        notes: a.notes || undefined
      }));
    },
    create: async (appointment: Partial<Appointment>): Promise<Appointment | null> => {
      if (isMockDataEnabled()) {
        const newAppt: Appointment = {
          id: `appt-${Date.now()}`,
          title: appointment.title || '',
          start: appointment.start || new Date().toISOString(),
          end: appointment.end || new Date().toISOString(),
          type: appointment.type || 'Meeting',
          customerId: appointment.customerId,
          customerName: appointment.customerName,
          status: 'Confirmed',
          notes: appointment.notes
        };
        MockData.MOCK_APPOINTMENTS.unshift(newAppt);
        return newAppt;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          title: appointment.title || '',
          start_time: appointment.start,
          end_time: appointment.end,
          type: appointment.type || 'Meeting',
          resource_id: appointment.resourceId || null,
          customer_id: appointment.customerId || null,
          customer_name: appointment.customerName || null,
          status: 'Confirmed',
          notes: appointment.notes || null
        } as any])
        .select()
        .single();

      if (error) throw error;
      const d = data as any;
      return {
        id: d.id,
        title: d.title,
        start: d.start_time,
        end: d.end_time,
        type: d.type,
        resourceId: d.resource_id || undefined,
        customerId: d.customer_id || undefined,
        customerName: d.customer_name || undefined,
        status: d.status,
        notes: d.notes || undefined
      };
    }
  },
  users: {
    list: async (): Promise<User[]> => {
      if (isMockDataEnabled()) {
        return MockData.MOCK_USERS;
      }
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return ((data as any[]) || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as any,
        branchId: u.branch_id || '',
        avatar: u.avatar_url || undefined,
        status: u.status as any
      }));
    }
  },
  activities: {
    listByEntity: async (entityId: string, entityType: string): Promise<Activity[]> => {
      if (isMockDataEnabled()) {
        return [];
      }
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        entityId: d.entity_id,
        entityType: d.entity_type as any,
        kind: d.kind as any,
        title: d.title,
        description: d.description || '',
        createdAt: d.created_at,
        createdBy: d.created_by,
      }));
    },
    create: async (activity: Partial<Activity>): Promise<Activity> => {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          entity_id: activity.entityId,
          entity_type: activity.entityType,
          kind: activity.kind,
          title: activity.title,
          description: activity.description,
          created_by: activity.createdBy
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data as any;
    }
  }
};

// React Query Hooks
export const useDashboardExceptions = () => useQuery({ queryKey: ['dashboard', 'exceptions'], queryFn: api.dashboard.getExceptions });
export const useLeads = () => useQuery({ queryKey: ['leads'], queryFn: api.leads.list });
export const useInventory = () => useQuery({ queryKey: ['inventory'], queryFn: api.inventory.list });
export const useServiceJobs = () => useQuery({ queryKey: ['service'], queryFn: api.service.list });
export const useServiceJob = (id?: string) => useQuery({
  queryKey: ['service', id],
  queryFn: () => (id ? api.service.get(id) : null),
  enabled: !!id
});
export const useCampaigns = () => useQuery({ queryKey: ['campaigns'], queryFn: api.marketing.listCampaigns });
export const useCustomers = () => useQuery({ queryKey: ['customers'], queryFn: api.customers.list });
export const useInvoices = () => useQuery({ queryKey: ['invoices'], queryFn: api.finance.listInvoices });
export const useParts = () => useQuery({ queryKey: ['parts'], queryFn: api.parts.list });
export const useAppointments = () => useQuery({ queryKey: ['appointments'], queryFn: api.calendar.listAppointments });
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: api.users.list });

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string, patch: Partial<Lead> }) => api.leads.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicle: Partial<Vehicle>) => api.inventory.create(vehicle),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string, patch: Partial<Vehicle> }) => api.inventory.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.inventory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customer: Partial<Customer>) => api.customers.create(customer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lead: Partial<Lead>) => api.leads.create(lead),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  });
};

export const useCreateServiceJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (job: Partial<ServiceJob>) => api.service.create(job),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service'] })
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointment: Partial<Appointment>) => api.calendar.create(appointment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] })
  });
};

export const useUpdatePartStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStock }: { id: string, newStock: number }) => api.parts.updateStock(id, newStock),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parts'] })
  });
};

export const useActivities = (entityId: string, entityType: string) => useQuery({
  queryKey: ['activities', entityId, entityType],
  queryFn: () => api.activities.listByEntity(entityId, entityType),
  enabled: !!entityId && !!entityType
});

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activity: Partial<Activity>) => api.activities.create(activity),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.entityId, variables.entityType] });
    }
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { Lead, Vehicle, ServiceJob, Campaign, DashboardExceptions, Customer, Invoice, Part, Appointment, User, Activity } from './types';
import { normalizeRole, useAuthStore } from './lib/store';

// Re-export supabase for direct use
export { supabase };

export const api = {
  dashboard: {
    getExceptions: async (): Promise<DashboardExceptions> => {
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
      const { data, error } = await supabase
        .from('leads')
        .select('*, ownerNode:profiles!owner_id(name)')
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
        ownerName: d.ownerNode?.name || undefined,
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
        bookingDate: 'booking_date', deliveryDate: 'delivery_date', remarks: 'remarks',
        ownerId: 'owner_id'
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
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, sale_records(id, current_state, customers(name))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(v => {
        const createdAt = new Date(v.created_at || Date.now());
        const daysInStock = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        let agingBucket: Vehicle['agingBucket'] = '0-30';
        if (daysInStock > 90) agingBucket = '90+';
        else if (daysInStock > 60) agingBucket = '61-90';
        else if (daysInStock > 30) agingBucket = '31-60';

        const activeSale = v.sale_records?.find((sr: any) => sr.current_state !== 'DELIVERED');
        const reservedFor = activeSale?.customers?.name || undefined;

        return {
          id: v.id,
          orgId: v.org_id || null,
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
          agingBucket,
          createdAt: v.created_at || '',
          proformaInvoiceNo: v.proforma_invoice_no || '',
          lcNo: v.lc_no || '',
          motorNo: v.motor_no || '',
          registrationNo: v.registration_no || '',
                  piId: v.pi_id || null,
          lcId: v.lc_id || null,
          vehicleState: v.vehicle_state || 'IN_STOCK',
          expectedDeliveryDate: v.expected_delivery_date || null,
          grnNumber: v.grn_number || null,
          chassisNo: v.chassis_no || null,
          reservedFor
        };
      });
    },
    create: async (vehicle: Partial<Vehicle>): Promise<Vehicle> => {
      const userOrgId = useAuthStore.getState().user?.orgId;

      const insertPayload: any = {
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
        available_colors: (vehicle.availableColors || []) as any,
        proforma_invoice_no: vehicle.proformaInvoiceNo || '',
        lc_no: vehicle.lcNo || '',
        motor_no: vehicle.motorNo || '',
        registration_no: vehicle.registrationNo || '',
        pi_id: vehicle.piId || null,
        lc_id: vehicle.lcId || null,
        vehicle_state: vehicle.vehicleState || 'IN_STOCK',
        expected_delivery_date: vehicle.expectedDeliveryDate || null,
        grn_number: vehicle.grnNumber || null,
        chassis_no: vehicle.chassisNo || null,
        org_id: userOrgId || null
      };

      if (vehicle.createdAt) {
        insertPayload.created_at = vehicle.createdAt;
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;
      return data as any;
    },
    update: async (id: string, patch: Partial<Vehicle>): Promise<Vehicle> => {
      const dbPatch: any = {};
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
      if (patch.hasOwnProperty('proformaInvoiceNo')) dbPatch.proforma_invoice_no = patch.proformaInvoiceNo;
      if (patch.hasOwnProperty('lcNo')) dbPatch.lc_no = patch.lcNo;
      if (patch.hasOwnProperty('motorNo')) dbPatch.motor_no = patch.motorNo;
      if (patch.hasOwnProperty('registrationNo')) dbPatch.registration_no = patch.registrationNo;
      if (patch.hasOwnProperty('createdAt')) dbPatch.created_at = patch.createdAt;
      if (patch.hasOwnProperty('piId')) dbPatch.pi_id = patch.piId;
      if (patch.hasOwnProperty('lcId')) dbPatch.lc_id = patch.lcId;
      if (patch.hasOwnProperty('vehicleState')) dbPatch.vehicle_state = patch.vehicleState;
      if (patch.hasOwnProperty('expectedDeliveryDate')) dbPatch.expected_delivery_date = patch.expectedDeliveryDate;
      if (patch.hasOwnProperty('grnNumber')) dbPatch.grn_number = patch.grnNumber;
      if (patch.hasOwnProperty('chassisNo')) dbPatch.chassis_no = patch.chassisNo;

      const cleanPatch = Object.fromEntries(
        Object.entries(dbPatch).filter(([_, v]) => v !== undefined)
      );

      const { data, error } = await supabase
        .from('vehicles')
        .update(cleanPatch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as any;
    },
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    }
  },
  service: {
    list: async (): Promise<ServiceJob[]> => {
      const { data, error } = await supabase
        .from('service_jobs')
        .select('*, customers(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map(j => ({
        id: j.id,
        customerId: j.customer_id || '',
        customerName: (j as any).customers?.name || 'Unknown',
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
      const isValidUUID = (uuidStr: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuidStr);
      const validBranchId = customer.branchId && isValidUUID(customer.branchId) ? customer.branchId : null;

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customer.name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          location: customer.location || '',
          branch_id: validBranchId,
          cars_owned: (customer.carsOwned || []) as any,
          org_id: useAuthStore.getState().user?.orgId || null
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data as any;
    },
    update: async (id: string, patch: Partial<Customer>): Promise<Customer> => {
      const dbPatch: any = {};
      if (patch.hasOwnProperty('name')) dbPatch.name = patch.name;
      if (patch.hasOwnProperty('phone')) dbPatch.phone = patch.phone;
      if (patch.hasOwnProperty('email')) dbPatch.email = patch.email;
      if (patch.hasOwnProperty('location')) dbPatch.location = patch.location;
      if (patch.hasOwnProperty('ltv')) dbPatch.ltv = patch.ltv;
      if (patch.hasOwnProperty('carsOwned')) dbPatch.cars_owned = patch.carsOwned;
      if (patch.hasOwnProperty('referrals')) dbPatch.referrals = patch.referrals;

      const { data, error } = await supabase
        .from('customers')
        .update(dbPatch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as any;
    }
  },
  finance: {
    listInvoices: async (): Promise<Invoice[]> => {
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
      const { error } = await supabase
        .from('parts')
        .update({ stock: newStock })
        .eq('id', id);
      if (error) throw error;
    }
  },
  calendar: {
    listAppointments: async (): Promise<Appointment[]> => {
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
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return ((data as any[]) || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: normalizeRole(u.role),
        branchId: u.branch_id || '',
        avatar: u.avatar_url || undefined,
        status: u.status as any
      }));
    }
  },
  activities: {
    listByEntity: async (entityId: string, entityType: string): Promise<Activity[]> => {
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
      let orgId = activity.orgId;

      if (!orgId) {
        const session = (await supabase.auth.getSession()).data.session;
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .or(`user_id.eq.${session.user.id},id.eq.${session.user.id}`)
            .eq('is_active', true)
            .maybeSingle();
          if (profile) orgId = profile.org_id;
        }
      }

      const { data, error } = await supabase
        .from('activities')
        .insert([{
          entity_id: activity.entityId,
          entity_type: activity.entityType,
          kind: activity.kind,
          title: activity.title,
          description: activity.description,
          created_by: activity.createdBy,
          org_id: orgId || undefined
        } as any])
        .select()
        .single();

    }
  },
  procurement: {
    listPIs: async (): Promise<any[]> => {
      const { data, error } = await (supabase as any)
        .from('proforma_invoices')
        .select('*, letters_of_credit(*), vehicles(id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data as any[]) || []).map(pi => ({
        id: pi.id,
        piNumber: pi.pi_number,
        supplier: pi.supplier,
        issueDate: pi.issue_date,
        totalAmount: Number(pi.total_amount),
        currency: pi.currency,
        notes: pi.notes,
        units: pi.units ?? 1,
        linkedVehicleCount: (pi.vehicles || []).length,
        lc: pi.letters_of_credit?.[0] ? {
          id: pi.letters_of_credit[0].id,
          lcNumber: pi.letters_of_credit[0].lc_number,
          piId: pi.letters_of_credit[0].pi_id,
          bankName: pi.letters_of_credit[0].bank_name,
          bankBranch: pi.letters_of_credit[0].bank_branch,
          openingDate: pi.letters_of_credit[0].opening_date,
          expiryDate: pi.letters_of_credit[0].expiry_date,
          amount: Number(pi.letters_of_credit[0].amount),
          currency: pi.letters_of_credit[0].currency,
          targetCycleDays: pi.letters_of_credit[0].target_cycle_days
        } : undefined
      }));
    },
    createPI: async (pi: any): Promise<any> => {
      const orgId = useAuthStore.getState().user?.orgId;
      const { data, error } = await (supabase as any)
        .from('proforma_invoices')
        .insert([{
          pi_number: pi.piNumber,
          supplier: pi.supplier || 'MAW',
          issue_date: pi.issueDate,
          total_amount: pi.totalAmount || 0,
          currency: pi.currency || 'NPR',
          notes: pi.notes || null,
          units: pi.units || 1,
          org_id: orgId || null
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    createLC: async (lc: any): Promise<any> => {
      const orgId = useAuthStore.getState().user?.orgId;
      const { data, error } = await supabase
        .from('letters_of_credit')
        .insert([{
          lc_number: lc.lcNumber,
          pi_id: lc.piId,
          bank_name: lc.bankName,
          bank_branch: lc.bankBranch || null,
          opening_date: lc.openingDate,
          expiry_date: lc.expiryDate || null,
          amount: lc.amount || 0,
          currency: lc.currency || 'NPR',
          target_cycle_days: lc.targetCycleDays || 90,
          org_id: orgId || null
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
  deals: {
    listSaleRecords: async (): Promise<any[]> => {
      const { data, error } = await (supabase as any)
        .from('sale_records')
        .select('*, customers(*), vehicles(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        customerId: r.customer_id,
        vehicleId: r.vehicle_id,
        currentState: r.current_state,
        paymentType: r.payment_type,
        bookingAmount: Number(r.booking_amount),
        salePrice: Number(r.sale_price),
        bookingDate: r.booking_date,
        allocationDate: r.allocation_date,
        bankName: r.bank_name,
        bankBranch: r.bank_branch,
        rmName: r.rm_name,
        rmPhone: r.rm_phone,
        approvedLoan: r.approved_loan ? Number(r.approved_loan) : undefined,
        insuranceActivatedAt: r.insurance_activated_at,
        insuranceEndorsedAt: r.insurance_endorsed_at,
        insurancePolicyNo: r.insurance_policy_no,
        dotmRep: r.dotm_rep,
        registrationNo: r.registration_no,
        registeredAt: r.registered_at,
        registeredUnder: r.registered_under,
        disbursementRequestedAt: r.disbursement_requested_at,
        disbursementReceivedAt: r.disbursement_received_at,
        disbursementAmount: r.disbursement_amount ? Number(r.disbursement_amount) : undefined,
        readyForDeliveryAt: r.ready_for_delivery_at,
        deliveredAt: r.delivered_at,
        customer: r.customers,
        vehicle: r.vehicles ? {
          id: (r.vehicles as any).id,
          model: (r.vehicles as any).model,
          variant: (r.vehicles as any).variant,
          vin: (r.vehicles as any).vin,
          color: (r.vehicles as any).color,
          price: (r.vehicles as any).price,
          status: (r.vehicles as any).status,
          vehicleState: (r.vehicles as any).vehicle_state,
          motorNo: (r.vehicles as any).motor_no,
          registrationNo: (r.vehicles as any).registration_no
        } : undefined
      }));
    },
    createSaleRecord: async (record: any): Promise<any> => {
      const orgId = useAuthStore.getState().user?.orgId;
      const creatorId = useAuthStore.getState().user?.id;
      const payload: any = {
        customer_id: record.customerId,
        current_state: record.currentState || 'BOOKED',
        payment_type: record.paymentType || null,
        booking_amount: record.bookingAmount || 0,
        sale_price: record.salePrice || 0,
        booking_date: record.bookingDate || new Date().toISOString().split('T')[0],
        org_id: orgId || null,
        created_by: creatorId || null
      };
      // Only include vehicle_id if provided (nullable field — booking can exist without a vehicle)
      if (record.vehicleId) {
        payload.vehicle_id = record.vehicleId;
      }
      const { data, error } = await (supabase as any)
        .from('sale_records')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    updateSaleRecord: async (id: string, patch: any): Promise<any> => {
      const dbPatch: any = {};
      const fields = [
        'vehicleId', 'currentState', 'paymentType', 'bookingAmount', 'salePrice',
        'bookingDate', 'allocationDate', 'bankName', 'bankBranch',
        'rmName', 'rmPhone', 'approvedLoan', 'insuranceActivatedAt',
        'insuranceEndorsedAt', 'insurancePolicyNo', 'dotmRep',
        'registrationNo', 'registeredAt', 'registeredUnder',
        'disbursementRequestedAt', 'disbursementReceivedAt',
        'disbursementAmount', 'readyForDeliveryAt', 'deliveredAt'
      ];
      
      fields.forEach(f => {
        if (patch[f] !== undefined) {
          const dbKey = f.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          dbPatch[dbKey] = patch[f];
        }
      });

      const { data, error } = await (supabase as any)
        .from('sale_records')
        .update(dbPatch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    transitionState: async (params: { entityId: string, entityType: 'VEHICLE' | 'SALE', fromState: string, toState: string, notes?: string, metadata?: any }): Promise<any> => {
      const orgId = useAuthStore.getState().user?.orgId;
      const profileId = useAuthStore.getState().user?.id;

      // 1. Insert Deal Step audit log
      const { error: auditError } = await (supabase as any)
        .from('deal_steps')
        .insert([{
          entity_type: params.entityType,
          entity_id: params.entityId,
          from_state: params.fromState,
          to_state: params.toState,
          performed_by: profileId || null,
          notes: params.notes || null,
          metadata: params.metadata || {},
          org_id: orgId || null
        }]);
      if (auditError) throw auditError;

      // 2. Perform conditional side-effects / updates
      if (params.entityType === 'VEHICLE') {
        const { error: vError } = await (supabase as any)
          .from('vehicles')
          .update({ vehicle_state: params.toState })
          .eq('id', params.entityId);
        if (vError) throw vError;
      } else if (params.entityType === 'SALE') {
        const { error: sError } = await (supabase as any)
          .from('sale_records')
          .update({ current_state: params.toState })
          .eq('id', params.entityId);
        if (sError) throw sError;
      }

      return { success: true };
    },
    listDealSteps: async (entityId: string): Promise<any[]> => {
      const { data, error } = await (supabase as any)
        .from('deal_steps')
        .select('*, profiles(name)')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ((data as any) || []).map((step: any) => ({
        id: step.id,
        entityType: step.entity_type,
        entityId: step.entity_id,
        fromState: step.from_state,
        toState: step.to_state,
        performedBy: step.profiles?.name || step.performed_by,
        metadata: step.metadata,
        notes: step.notes,
        createdAt: step.created_at
      }));
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

export const useProformaInvoices = () => useQuery({ queryKey: ['proforma_invoices'], queryFn: api.procurement.listPIs });
export const useSaleRecords = () => useQuery({ queryKey: ['sale_records'], queryFn: api.deals.listSaleRecords });
export const useDealSteps = (entityId: string) => useQuery({
  queryKey: ['deal_steps', entityId],
  queryFn: () => api.deals.listDealSteps(entityId),
  enabled: !!entityId
});

export const useCreatePI = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pi: any) => api.procurement.createPI(pi),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proforma_invoices'] })
  });
};

export const useCreateLC = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lc: any) => api.procurement.createLC(lc),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proforma_invoices'] })
  });
};

export const useCreateSaleRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (record: any) => api.deals.createSaleRecord(record),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sale_records'] })
  });
};

export const useUpdateSaleRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string, patch: any }) => api.deals.updateSaleRecord(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sale_records'] })
  });
};

export const useTransitionState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { entityId: string, entityType: 'VEHICLE' | 'SALE', fromState: string, toState: string, notes?: string, metadata?: any }) =>
      api.deals.transitionState(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deal_steps', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['sale_records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });
};

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

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string, patch: Partial<Customer> }) => api.customers.update(id, patch),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] })
  });
};


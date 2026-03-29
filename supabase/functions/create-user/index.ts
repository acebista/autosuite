import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map PascalCase roles to DB lowercase roles
const ROLE_MAP: Record<string, string> = {
  'SuperAdmin': 'super_admin',
  'Admin': 'admin',
  'SalesManager': 'sales',
  'SalesRep': 'sales',
  'ServiceAdvisor': 'service',
  'Technician': 'service',
  'Finance': 'finance',
  'Marketing': 'admin',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user: caller }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    ).auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller has permission via profiles table
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, org_id')
      .eq('id', caller.id)
      .single();

    if (profileError || !['admin', 'super_admin'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, password, name, role: rawRole, department, id, action } = await req.json();

    // Support Password Reset / Update
    if (action === 'update_password' && id) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password
      });
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: Create User
    // Map the role to DB-friendly lowercase
    const dbRole = ROLE_MAP[rawRole] || rawRole?.toLowerCase() || 'user';

    // 1. Check if user already exists in auth
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find((u: any) => u.email === email);
    
    let adminUserId: string;

    if (existingUser) {
      // Re-use existing auth account
      adminUserId = existingUser.id;
      // Update password if provided
      if (password) {
        await supabaseAdmin.auth.admin.updateUserById(adminUserId, { password: password });
      }
    } else {
      // Create new auth user
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: dbRole,
          org_id: callerProfile.org_id,
          department: department || '',
        },
      });
      if (createError) throw createError;
      adminUserId = userData.user.id;
    }

    // 2. Upsert profile — link this user to the NEW org
    // First deactivate any old profiles for this user
    await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .or(`id.eq."${adminUserId}",user_id.eq."${adminUserId}"`);

    // Create fresh profile
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminUserId,
        user_id: adminUserId,
        email,
        name,
        role: dbRole,
        org_id: callerProfile.org_id,
        department: department || '',
        status: 'Active',
        is_active: true
      });

    if (profileUpdateError) throw profileUpdateError;

    return new Response(JSON.stringify({ success: true, user_id: adminUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('create-user error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

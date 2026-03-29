import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get the auth header from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    ).auth.getUser(token);

    if (authError || !caller) {
      console.error('Auth error or user not found:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify super_admin role
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .or(`id.eq."${caller.id}",user_id.eq."${caller.id}"`)
      .limit(1)
      .single();

    if (profileError || callerProfile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Permission denied. SuperAdmin role required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orgName, adminEmail, adminPassword, adminName } = await req.json();

    // 1. Create Organization
    const slugValue = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: orgName,
        slug: slugValue,
        subscription_status: 'active',
        subscription_tier: 'professional', // Fixed: was 'Pro'
        max_users: 10,
        max_branches: 3
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // 2. Get or create admin auth user
    // We use listUsers to check existence
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = usersData?.users?.find(u => u.email === adminEmail);

    let adminUserId: string;
    if (foundUser) {
      adminUserId = foundUser.id;
      if (adminPassword) {
        await supabaseAdmin.auth.admin.updateUserById(adminUserId, { password: adminPassword });
      }
    } else {
      const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName, role: 'admin', org_id: orgData.id },
      });
      if (adminError) throw adminError;
      adminUserId = adminData.user.id;
    }

    // 3. Upsert profile
    await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .or(`id.eq."${adminUserId}",user_id.eq."${adminUserId}"`);

    const { error: profileUpsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminUserId,
        user_id: adminUserId,
        email: adminEmail,
        name: adminName,
        role: 'admin',
        org_id: orgData.id,
        status: 'Active',
        is_active: true,
      });

    if (profileUpsertError) throw profileUpsertError;

    return new Response(JSON.stringify({ success: true, org_id: orgData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('create-organization error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

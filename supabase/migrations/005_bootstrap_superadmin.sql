-- Migration: Create SuperAdmin danktherapy@gmail.com
-- Note: This is a manual migration for bootstrapping the first SuperAdmin.

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- 1. Create the user in auth.users if they don't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'danktherapy@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'danktherapy@gmail.com',
      crypt('Sachu123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Dank Therapy Admin","role":"super_admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'danktherapy@gmail.com';
  END IF;

  -- 2. Ensure the profile exists and has the correct role for THIS organization
  INSERT INTO public.profiles (id, email, name, role, org_id, status)
  VALUES (
    new_user_id,
    'danktherapy@gmail.com',
    'Dank Therapy Admin',
    'super_admin',
    'tjjxrfiorfboknnaxevz',
    'Active'
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = 'super_admin',
    org_id = 'tjjxrfiorfboknnaxevz',
    status = 'Active';

END $$;

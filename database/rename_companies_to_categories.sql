-- ============================================
-- Rename companies -> categories
-- Run this in the autovet-app-pwa Supabase SQL Editor
-- ============================================

-- 1. Rename the table
ALTER TABLE public.companies RENAME TO categories;

-- 2. Rename the foreign key column in users
ALTER TABLE public.users RENAME COLUMN company_id TO category_id;

-- 3. Rename indexes
ALTER INDEX idx_companies_subdomain RENAME TO idx_categories_subdomain;
ALTER INDEX idx_users_company_id RENAME TO idx_users_category_id;

-- 4. Drop old RPC functions
DROP FUNCTION IF EXISTS public.get_company_id_by_tenant(TEXT);
DROP FUNCTION IF EXISTS public.verify_user_company_access(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.save_user_data_with_company(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.save_user_data(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_user_by_phone(TEXT);

-- 5. Recreate RPC functions with new names

CREATE OR REPLACE FUNCTION public.get_category_id_by_tenant(p_tenant TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id UUID;
BEGIN
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE subdomain = p_tenant;
  RETURN v_category_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_user_category_access(
  p_phone TEXT,
  p_tenant TEXT
)
RETURNS TABLE(
  can_access BOOLEAN,
  pin TEXT,
  access_level INTEGER,
  category_name TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id UUID;
  v_category_name TEXT;
BEGIN
  SELECT c.id, c.name INTO v_category_id, v_category_name
  FROM public.categories c
  WHERE c.subdomain = CASE WHEN p_tenant = '' THEN 'auto' ELSE p_tenant END;

  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT
      false::BOOLEAN, ''::TEXT, 0::INTEGER, ''::TEXT,
      'Category not found for this tenant'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    true::BOOLEAN AS can_access,
    u.pin::TEXT AS pin,
    u.access_level::INTEGER AS access_level,
    v_category_name::TEXT AS category_name,
    ''::TEXT AS error_message
  FROM public.users u
  WHERE u.phone_number = p_phone
    AND u.category_id = v_category_id
    AND u.active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false::BOOLEAN, ''::TEXT, 0::INTEGER, v_category_name::TEXT,
      'User not found in this category. Please contact your administrator.'::TEXT;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_user_data_with_category(
  p_phone_number TEXT,
  p_tenant TEXT,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT '',
  p_pin TEXT DEFAULT '000000'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id UUID;
  v_user_id UUID;
  v_firstname TEXT;
  v_lastname TEXT;
  v_name_parts TEXT[];
BEGIN
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE subdomain = CASE WHEN p_tenant = '' THEN 'auto' ELSE p_tenant END;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category not found for tenant: %', p_tenant;
  END IF;

  IF p_name IS NOT NULL AND p_name != '' THEN
    v_name_parts := string_to_array(trim(p_name), ' ');
    v_firstname := v_name_parts[1];
    v_lastname := CASE
      WHEN array_length(v_name_parts, 1) > 1
      THEN array_to_string(v_name_parts[2:], ' ')
      ELSE ''
    END;
  ELSE
    v_firstname := '';
    v_lastname := '';
  END IF;

  INSERT INTO public.users (phone_number, category_id, firstname, lastname, email, home_address, pin, updated_at)
  VALUES (p_phone_number, v_category_id, v_firstname, v_lastname, COALESCE(p_email, ''), p_address, p_pin, now())
  ON CONFLICT (phone_number, category_id)
  DO UPDATE SET
    firstname = CASE WHEN v_firstname != '' THEN v_firstname ELSE users.firstname END,
    lastname = CASE WHEN v_lastname != '' THEN v_lastname ELSE users.lastname END,
    email = CASE WHEN p_email IS NOT NULL THEN p_email ELSE users.email END,
    home_address = CASE WHEN p_address != '' THEN p_address ELSE users.home_address END,
    pin = CASE WHEN p_pin != '000000' THEN p_pin ELSE users.pin END,
    updated_at = now()
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_user_data(
  p_phone TEXT,
  p_first TEXT,
  p_last TEXT,
  p_address TEXT,
  p_pin TEXT,
  p_active BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_category_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE subdomain = 'auto';

  INSERT INTO public.users (phone_number, category_id, firstname, lastname, home_address, pin, active, updated_at)
  VALUES (p_phone, v_category_id, p_first, p_last, p_address, p_pin, p_active, now())
  ON CONFLICT (phone_number, category_id)
  DO UPDATE SET
    firstname = CASE WHEN p_first != '' THEN p_first ELSE users.firstname END,
    lastname = CASE WHEN p_last != '' THEN p_last ELSE users.lastname END,
    home_address = CASE WHEN p_address != '' THEN p_address ELSE users.home_address END,
    pin = CASE WHEN p_pin != '000000' THEN p_pin ELSE users.pin END,
    active = p_active,
    updated_at = now()
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_by_phone(p_phone TEXT)
RETURNS TABLE(
  id UUID,
  phone_number TEXT,
  firstname TEXT,
  lastname TEXT,
  home_address TEXT,
  email TEXT,
  pin TEXT,
  access_level INTEGER,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id, u.phone_number, u.firstname, u.lastname,
    u.home_address, u.email, u.pin, u.access_level,
    u.active, u.created_at, u.updated_at
  FROM public.users u
  WHERE u.phone_number = p_phone;
END;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_category_id_by_tenant(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_user_category_access(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.save_user_data_with_category(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.save_user_data(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_phone(TEXT) TO anon;

-- 7. Update RLS policy names (cosmetic, policies still work after table rename)
-- Drop and recreate with new names
DROP POLICY IF EXISTS "Allow anonymous read on companies" ON public.categories;
CREATE POLICY "Allow anonymous read on categories"
  ON public.categories FOR SELECT TO anon USING (true);

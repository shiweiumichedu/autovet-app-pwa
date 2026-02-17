-- ============================================
-- AutoVet App - Supabase Database Schema
-- Run this in the autovet-app-pwa Supabase project
-- ============================================

-- 1. Categories table (tenants)
CREATE TABLE public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  subdomain     TEXT UNIQUE NOT NULL,  -- 'auto', 'garage', 'house'
  website_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default tenants
INSERT INTO public.categories (name, subdomain) VALUES
  ('AutoVet', 'auto'),
  ('AutoVet Garage', 'garage'),
  ('AutoVet House', 'house');

-- 2. User status enum
CREATE TYPE public.user_status_enum AS ENUM ('current', 'active', 'inactive');

-- 3. Users table
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  TEXT NOT NULL,
  category_id   UUID NOT NULL REFERENCES public.categories(id),
  firstname     TEXT NOT NULL DEFAULT '',
  lastname      TEXT NOT NULL DEFAULT '',
  home_address  TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  pin           TEXT NOT NULL DEFAULT '000000',
  access_level  INTEGER NOT NULL DEFAULT 2,
  status        user_status_enum NOT NULL DEFAULT 'active',
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone_number, category_id)
);

-- 4. PIN Requests table
CREATE TABLE public.pin_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  tenant        TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_phone_number ON public.users(phone_number);
CREATE INDEX idx_users_category_id ON public.users(category_id);
CREATE INDEX idx_categories_subdomain ON public.categories(subdomain);
CREATE INDEX idx_pin_requests_phone ON public.pin_requests(phone_number);
CREATE INDEX idx_pin_requests_status ON public.pin_requests(status);
CREATE INDEX idx_pin_requests_tenant ON public.pin_requests(tenant);

-- 5. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read on categories (needed for tenant detection)
CREATE POLICY "Allow anonymous read on categories"
  ON public.categories FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous read on users (needed for login flow via RPC)
CREATE POLICY "Allow anonymous read on users"
  ON public.users FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous insert/update on users (needed for registration via RPC)
CREATE POLICY "Allow anonymous insert on users"
  ON public.users FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on users"
  ON public.users FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous delete on users"
  ON public.users FOR DELETE
  TO anon
  USING (true);

-- PIN Requests RLS policies
CREATE POLICY "Allow anonymous insert on pin_requests"
  ON public.pin_requests FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous read on pin_requests"
  ON public.pin_requests FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update on pin_requests"
  ON public.pin_requests FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous delete on pin_requests"
  ON public.pin_requests FOR DELETE
  TO anon
  USING (true);

-- ============================================
-- RPC Functions
-- ============================================

-- 4. get_category_id_by_tenant: Look up category ID from subdomain
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

-- 5. verify_user_category_access: Verify user can access a tenant and return PIN
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
  -- Get category for this tenant
  SELECT c.id, c.name INTO v_category_id, v_category_name
  FROM public.categories c
  WHERE c.subdomain = CASE WHEN p_tenant = '' THEN 'auto' ELSE p_tenant END;

  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      ''::TEXT,
      0::INTEGER,
      ''::TEXT,
      'Category not found for this tenant'::TEXT;
    RETURN;
  END IF;

  -- Check if user exists in this category
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

  -- If no rows returned, user not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      ''::TEXT,
      0::INTEGER,
      v_category_name::TEXT,
      'User not found in this category. Please contact your administrator.'::TEXT;
  END IF;
END;
$$;

-- 6. save_user_data_with_category: Upsert user for a specific tenant
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
  -- Get category ID
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE subdomain = CASE WHEN p_tenant = '' THEN 'auto' ELSE p_tenant END;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category not found for tenant: %', p_tenant;
  END IF;

  -- Parse name into first/last
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

  -- Upsert user
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

-- 7. save_user_data: Legacy fallback (no tenant)
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
  -- Default to 'auto' category
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

-- 8. get_user_by_phone: Get user(s) by phone number
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

-- 9. update_user_status: Update a user's status enum
CREATE OR REPLACE FUNCTION public.update_user_status(
  p_phone TEXT,
  p_status user_status_enum
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET
    status = p_status,
    active = (p_status = 'current' OR p_status = 'active'),
    updated_at = now()
  WHERE phone_number = p_phone;

  RETURN FOUND;
END;
$$;

-- 10. delete_user_completely: Delete user and their pin_requests
CREATE OR REPLACE FUNCTION public.delete_user_completely(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone TEXT;
BEGIN
  SELECT phone_number INTO v_phone
  FROM public.users
  WHERE id = p_user_id;

  IF v_phone IS NULL THEN
    RETURN false;
  END IF;

  DELETE FROM public.pin_requests WHERE phone_number = v_phone;
  DELETE FROM public.users WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- 11. get_pending_pin_requests: Get pending PIN requests for a tenant
CREATE OR REPLACE FUNCTION public.get_pending_pin_requests(p_tenant TEXT)
RETURNS TABLE(
  id UUID,
  phone_number TEXT,
  status TEXT,
  tenant TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.phone_number,
    pr.status,
    pr.tenant,
    pr.created_at
  FROM public.pin_requests pr
  WHERE pr.status = 'pending'
    AND (p_tenant IS NULL OR p_tenant = '' OR pr.tenant = p_tenant)
  ORDER BY pr.created_at DESC;
END;
$$;

-- 12. update_pin_request_status: Update a PIN request's status
CREATE OR REPLACE FUNCTION public.update_pin_request_status(
  p_request_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.pin_requests
  SET status = p_status
  WHERE id = p_request_id;

  RETURN FOUND;
END;
$$;

-- 13. create_pin_request: Create a new PIN request from login screen
CREATE OR REPLACE FUNCTION public.create_pin_request(
  p_phone TEXT,
  p_tenant TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO public.pin_requests (phone_number, status, tenant)
  VALUES (p_phone, 'pending', COALESCE(p_tenant, ''))
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- 14. update_user_pin: Update a user's PIN
CREATE OR REPLACE FUNCTION public.update_user_pin(
  p_phone TEXT,
  p_new_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET pin = p_new_pin, updated_at = now()
  WHERE phone_number = p_phone;

  RETURN FOUND;
END;
$$;

-- Grant execute permissions to anonymous users
GRANT EXECUTE ON FUNCTION public.get_category_id_by_tenant(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_user_category_access(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.save_user_data_with_category(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.save_user_data(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_phone(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_status(TEXT, user_status_enum) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_pending_pin_requests(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_pin_request_status(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_pin_request(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_pin(TEXT, TEXT) TO anon;

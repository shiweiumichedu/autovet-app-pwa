-- ============================================
-- AutoVet App - Admin Features Migration
-- Run this in the Supabase SQL Editor for existing databases
-- ============================================

-- 1. Create user_status_enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
    CREATE TYPE public.user_status_enum AS ENUM ('current', 'active', 'inactive');
  END IF;
END
$$;

-- 2. Add status column to users table (migrate from active boolean)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN status user_status_enum NOT NULL DEFAULT 'active';

    -- Migrate existing data: active=true -> 'active', active=false -> 'inactive'
    UPDATE public.users SET status = CASE
      WHEN active = true THEN 'active'::user_status_enum
      ELSE 'inactive'::user_status_enum
    END;
  END IF;
END
$$;

-- 3. Create pin_requests table
CREATE TABLE IF NOT EXISTS public.pin_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  tenant        TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pin_requests_phone ON public.pin_requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_pin_requests_status ON public.pin_requests(status);
CREATE INDEX IF NOT EXISTS idx_pin_requests_tenant ON public.pin_requests(tenant);

-- 4. Enable RLS on pin_requests
ALTER TABLE public.pin_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (for login screen PIN requests)
CREATE POLICY "Allow anonymous insert on pin_requests"
  ON public.pin_requests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous read on pin_requests (admin reads via RPC, but RLS needed for direct queries)
CREATE POLICY "Allow anonymous read on pin_requests"
  ON public.pin_requests FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous update on pin_requests (admin updates status via RPC)
CREATE POLICY "Allow anonymous update on pin_requests"
  ON public.pin_requests FOR UPDATE
  TO anon
  USING (true);

-- Allow anonymous delete on pin_requests
CREATE POLICY "Allow anonymous delete on pin_requests"
  ON public.pin_requests FOR DELETE
  TO anon
  USING (true);

-- ============================================
-- RPC Functions
-- ============================================

-- 5. update_user_status: Update a user's status enum
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

-- 6. delete_user_completely: Delete user and their pin_requests
CREATE OR REPLACE FUNCTION public.delete_user_completely(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone TEXT;
BEGIN
  -- Get user's phone number
  SELECT phone_number INTO v_phone
  FROM public.users
  WHERE id = p_user_id;

  IF v_phone IS NULL THEN
    RETURN false;
  END IF;

  -- Delete pin_requests for this phone number
  DELETE FROM public.pin_requests WHERE phone_number = v_phone;

  -- Delete the user
  DELETE FROM public.users WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- 7. get_pending_pin_requests: Get pending PIN requests for a tenant
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

-- 8. update_pin_request_status: Update a PIN request's status
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

-- 9. create_pin_request: Create a new PIN request from login screen
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

-- 10. update_user_pin: Update a user's PIN
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

-- ============================================
-- Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.update_user_status(TEXT, user_status_enum) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_pending_pin_requests(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_pin_request_status(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_pin_request(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_pin(TEXT, TEXT) TO anon;

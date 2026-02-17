-- ============================================
-- AutoVet App - Checklist Config Migration
-- Adds: expanded checklist items, user preferences table, RPCs, updated create_inspection
-- Run this AFTER add_inspection_tables.sql in the Supabase SQL editor
-- ============================================

-- ============================================
-- 1. Expand seed data: ~10 items per step
-- ============================================

UPDATE public.inspection_step_templates
SET checklist_items = '["Tire tread depth", "Tire pressure", "Wheel condition", "Spare tire", "Alignment (visual)", "Sidewall damage", "Lug nut condition", "Tire age/DOT date", "Wheel bearing noise", "Brake pad thickness"]'
WHERE step_number = 2;

UPDATE public.inspection_step_templates
SET checklist_items = '["Paint condition", "Body panels aligned", "Glass/windshield", "Lights working", "Rust/corrosion", "Door hinges/seals", "Mirror condition", "Wiper blades", "Antenna/trim", "Bumper damage"]'
WHERE step_number = 3;

UPDATE public.inspection_step_templates
SET checklist_items = '["Seats condition", "Dashboard/gauges", "AC/Heating", "Electronics/infotainment", "Odors", "Seatbelts working", "Window regulators", "Door locks", "Headliner", "Floor mats/carpet"]'
WHERE step_number = 4;

UPDATE public.inspection_step_templates
SET checklist_items = '["Oil level/condition", "Coolant level", "Belt condition", "Battery", "Leaks", "Hose condition", "Air filter", "Power steering fluid", "Brake fluid", "Wiring/connectors"]'
WHERE step_number = 5;

UPDATE public.inspection_step_templates
SET checklist_items = '["Trunk space/liner", "Undercarriage rust", "Exhaust system", "Suspension visible", "Frame damage", "CV boots/axles", "Oil pan condition", "Catalytic converter", "Spare tire/jack", "Shock absorbers"]'
WHERE step_number = 6;

UPDATE public.inspection_step_templates
SET checklist_items = '["Engine start", "Idle smooth", "Acceleration", "Braking", "Steering", "Transmission shifts", "Noises", "Vibrations at speed", "Pulling to side", "Cruise control", "Hill start", "Reverse gear"]'
WHERE step_number = 7;

-- ============================================
-- 2. New table: user_checklist_preferences
-- ============================================

CREATE TABLE public.user_checklist_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  item_name   TEXT NOT NULL,
  weight      INTEGER NOT NULL DEFAULT 1,  -- 0=Not Important, 1=Important, 2=Very Important
  UNIQUE(user_id, step_number, item_name)
);

CREATE INDEX idx_user_checklist_prefs_user ON public.user_checklist_preferences(user_id);

-- RLS: full access for anon (matches existing pattern)
ALTER TABLE public.user_checklist_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select on user_checklist_preferences"
  ON public.user_checklist_preferences FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert on user_checklist_preferences"
  ON public.user_checklist_preferences FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update on user_checklist_preferences"
  ON public.user_checklist_preferences FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous delete on user_checklist_preferences"
  ON public.user_checklist_preferences FOR DELETE TO anon USING (true);

-- ============================================
-- 3. RPC: get_user_checklist_preferences
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_checklist_preferences(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'step_number', ucp.step_number,
      'item_name', ucp.item_name,
      'weight', ucp.weight
    )
  ), '[]'::json) INTO v_result
  FROM public.user_checklist_preferences ucp
  WHERE ucp.user_id = p_user_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_checklist_preferences(UUID) TO anon;

-- ============================================
-- 4. RPC: save_user_checklist_preferences
-- ============================================

CREATE OR REPLACE FUNCTION public.save_user_checklist_preferences(
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete existing preferences for this user
  DELETE FROM public.user_checklist_preferences WHERE user_id = p_user_id;

  -- Bulk insert new preferences
  INSERT INTO public.user_checklist_preferences (user_id, step_number, item_name, weight)
  SELECT
    p_user_id,
    (pref->>'step_number')::INTEGER,
    pref->>'item_name',
    (pref->>'weight')::INTEGER
  FROM jsonb_array_elements(p_preferences) AS pref;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_user_checklist_preferences(UUID, JSONB) TO anon;

-- ============================================
-- 5. Update create_inspection to use weights
-- ============================================

CREATE OR REPLACE FUNCTION public.create_inspection(
  p_user_id UUID,
  p_category_id UUID,
  p_vehicle_year INTEGER DEFAULT NULL,
  p_vehicle_make TEXT DEFAULT '',
  p_vehicle_model TEXT DEFAULT '',
  p_vehicle_trim TEXT DEFAULT '',
  p_vehicle_mileage INTEGER DEFAULT NULL,
  p_vehicle_vin TEXT DEFAULT '',
  p_vehicle_color TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inspection_id UUID;
  v_template RECORD;
  v_has_prefs BOOLEAN;
BEGIN
  -- Check if user has any checklist preferences
  SELECT EXISTS(
    SELECT 1 FROM public.user_checklist_preferences WHERE user_id = p_user_id
  ) INTO v_has_prefs;

  -- Create the inspection
  INSERT INTO public.inspections (
    user_id, category_id, vehicle_year, vehicle_make, vehicle_model,
    vehicle_trim, vehicle_mileage, vehicle_vin, vehicle_color
  ) VALUES (
    p_user_id, p_category_id, p_vehicle_year, p_vehicle_make, p_vehicle_model,
    p_vehicle_trim, p_vehicle_mileage, p_vehicle_vin, p_vehicle_color
  ) RETURNING id INTO v_inspection_id;

  -- Create step rows from templates, applying user preferences
  FOR v_template IN
    SELECT step_number, step_name, checklist_items
    FROM public.inspection_step_templates
    WHERE active = true
    ORDER BY sort_order
  LOOP
    INSERT INTO public.inspection_steps (
      inspection_id, step_number, step_name, checklist
    ) VALUES (
      v_inspection_id,
      v_template.step_number,
      v_template.step_name,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'item', item,
              'checked', false,
              'note', '',
              'rating', 0,
              'weight', COALESCE(
                (SELECT ucp.weight FROM public.user_checklist_preferences ucp
                 WHERE ucp.user_id = p_user_id
                   AND ucp.step_number = v_template.step_number
                   AND ucp.item_name = item),
                1  -- default weight if no preference
              )
            )
          )
          FROM jsonb_array_elements_text(v_template.checklist_items) AS item
          WHERE
            -- If user has preferences, only include items with weight > 0
            -- If no preferences, include all items
            CASE WHEN v_has_prefs THEN
              COALESCE(
                (SELECT ucp.weight FROM public.user_checklist_preferences ucp
                 WHERE ucp.user_id = p_user_id
                   AND ucp.step_number = v_template.step_number
                   AND ucp.item_name = item),
                1
              ) > 0
            ELSE true
            END
        ),
        '[]'::jsonb
      )
    );
  END LOOP;

  RETURN v_inspection_id;
END;
$$;

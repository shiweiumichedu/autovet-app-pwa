-- ============================================
-- AutoVet App - Inspection Workflow Migration
-- Run this AFTER schema.sql in the Supabase SQL editor
-- ============================================

-- ============================================
-- 1. New Tables
-- ============================================

-- 1.1 inspection_step_templates — Defines steps & checklist items
CREATE TABLE public.inspection_step_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number     INTEGER NOT NULL,
  step_name       TEXT NOT NULL,
  checklist_items JSONB NOT NULL DEFAULT '[]',
  instructions    TEXT NOT NULL DEFAULT '',
  photo_required  BOOLEAN NOT NULL DEFAULT true,
  max_photos      INTEGER NOT NULL DEFAULT 2,
  sort_order      INTEGER NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT true
);

-- 1.2 inspections — One row per inspection session
CREATE TABLE public.inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id),
  category_id     UUID NOT NULL REFERENCES public.categories(id),
  -- Vehicle info
  vehicle_year    INTEGER,
  vehicle_make    TEXT NOT NULL DEFAULT '',
  vehicle_model   TEXT NOT NULL DEFAULT '',
  vehicle_trim    TEXT NOT NULL DEFAULT '',
  vehicle_mileage INTEGER,
  vehicle_vin     TEXT NOT NULL DEFAULT '',
  vehicle_color   TEXT NOT NULL DEFAULT '',
  -- Status
  status          TEXT NOT NULL DEFAULT 'in_progress',
  current_step    INTEGER NOT NULL DEFAULT 1,
  overall_rating  INTEGER,
  decision        TEXT,
  notes           TEXT NOT NULL DEFAULT '',
  -- Report
  report_url      TEXT,
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 inspection_steps — One row per step per inspection
CREATE TABLE public.inspection_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  step_number     INTEGER NOT NULL,
  step_name       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  checklist       JSONB NOT NULL DEFAULT '[]',
  notes           TEXT NOT NULL DEFAULT '',
  rating          INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(inspection_id, step_number)
);

-- 1.4 inspection_photos — Photos captured during inspection
CREATE TABLE public.inspection_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  step_id         UUID NOT NULL REFERENCES public.inspection_steps(id) ON DELETE CASCADE,
  photo_url       TEXT NOT NULL,
  photo_order     INTEGER NOT NULL DEFAULT 1,
  ai_analysis     TEXT,
  ai_verdict      TEXT,
  ai_analyzed_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(step_id, photo_order)
);

-- 1.5 vehicle_known_issues — Pre-seeded reference data
CREATE TABLE public.vehicle_known_issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  year_start      INTEGER NOT NULL,
  year_end        INTEGER NOT NULL,
  category        TEXT NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'medium',
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  source          TEXT NOT NULL DEFAULT '',
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. Indexes
-- ============================================

CREATE INDEX idx_inspections_user_id ON public.inspections(user_id);
CREATE INDEX idx_inspections_category_id ON public.inspections(category_id);
CREATE INDEX idx_inspections_status ON public.inspections(status);
CREATE INDEX idx_inspection_steps_inspection_id ON public.inspection_steps(inspection_id);
CREATE INDEX idx_inspection_photos_inspection_id ON public.inspection_photos(inspection_id);
CREATE INDEX idx_inspection_photos_step_id ON public.inspection_photos(step_id);
CREATE INDEX idx_vehicle_known_issues_lookup ON public.vehicle_known_issues(make, model, year_start, year_end);

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE public.inspection_step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_known_issues ENABLE ROW LEVEL SECURITY;

-- inspection_step_templates: read-only for anon
CREATE POLICY "Allow anonymous read on inspection_step_templates"
  ON public.inspection_step_templates FOR SELECT TO anon USING (true);

-- inspections: full access for anon (access controlled via RPC)
CREATE POLICY "Allow anonymous select on inspections"
  ON public.inspections FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert on inspections"
  ON public.inspections FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update on inspections"
  ON public.inspections FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous delete on inspections"
  ON public.inspections FOR DELETE TO anon USING (true);

-- inspection_steps: full access for anon
CREATE POLICY "Allow anonymous select on inspection_steps"
  ON public.inspection_steps FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert on inspection_steps"
  ON public.inspection_steps FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update on inspection_steps"
  ON public.inspection_steps FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous delete on inspection_steps"
  ON public.inspection_steps FOR DELETE TO anon USING (true);

-- inspection_photos: full access for anon
CREATE POLICY "Allow anonymous select on inspection_photos"
  ON public.inspection_photos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert on inspection_photos"
  ON public.inspection_photos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update on inspection_photos"
  ON public.inspection_photos FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anonymous delete on inspection_photos"
  ON public.inspection_photos FOR DELETE TO anon USING (true);

-- vehicle_known_issues: read-only for anon
CREATE POLICY "Allow anonymous read on vehicle_known_issues"
  ON public.vehicle_known_issues FOR SELECT TO anon USING (true);

-- ============================================
-- 4. Seed Data: Step Templates
-- ============================================

INSERT INTO public.inspection_step_templates (step_number, step_name, checklist_items, instructions, photo_required, max_photos, sort_order) VALUES
(1, 'Vehicle Info', '[]', 'Enter the vehicle details: year, make, model, trim, mileage, and VIN (optional). Review any known issues for this vehicle.', false, 0, 1),
(2, 'Wheels & Tires', '["Tire tread depth", "Tire pressure", "Wheel condition", "Spare tire", "Alignment (visual)"]', 'Inspect all four tires and wheels. Check tread depth, look for uneven wear, and inspect wheel rims for damage.', true, 2, 2),
(3, 'Exterior', '["Paint condition", "Body panels aligned", "Glass/windshield", "Lights working", "Rust/corrosion"]', 'Walk around the vehicle and inspect the exterior. Look for paint damage, dents, rust, and check all lights.', true, 2, 3),
(4, 'Interior', '["Seats condition", "Dashboard/gauges", "AC/Heating", "Electronics/infotainment", "Odors"]', 'Sit inside the vehicle and inspect the interior. Check seats, dashboard, electronics, and climate controls.', true, 2, 4),
(5, 'Engine Bay', '["Oil level/condition", "Coolant level", "Belt condition", "Battery", "Leaks"]', 'Open the hood and inspect the engine bay. Check fluid levels, belts, battery, and look for leaks.', true, 2, 5),
(6, 'Trunk & Undercarriage', '["Trunk space/liner", "Undercarriage rust", "Exhaust system", "Suspension visible"]', 'Check the trunk area and look under the vehicle for rust, exhaust damage, and suspension issues.', true, 2, 6),
(7, 'Test Drive', '["Engine start", "Idle smooth", "Acceleration", "Braking", "Steering", "Transmission shifts", "Noises"]', 'Take the vehicle for a test drive. Note engine performance, braking, steering feel, and any unusual noises.', false, 0, 7);

-- ============================================
-- 5. Seed Data: Sample Known Issues
-- ============================================

INSERT INTO public.vehicle_known_issues (make, model, year_start, year_end, category, severity, title, description, source) VALUES
-- Honda Civic
('Honda', 'Civic', 2016, 2020, 'engine', 'medium', 'Oil Dilution Issue', 'Engine oil dilution with fuel in cold climates. Oil level may rise above full mark on dipstick.', 'TSB'),
('Honda', 'Civic', 2016, 2021, 'body', 'low', 'Windshield Cracking', 'Reports of windshields cracking without impact, possibly due to stress from frame flex.', 'user-reported'),
-- Toyota Camry
('Toyota', 'Camry', 2018, 2022, 'transmission', 'medium', 'Transmission Hesitation', 'Reports of hesitation when accelerating from a stop, particularly in 8-speed automatic models.', 'user-reported'),
('Toyota', 'Camry', 2018, 2023, 'electrical', 'low', 'Infotainment Freezing', 'Touchscreen may freeze or become unresponsive, requiring vehicle restart.', 'TSB'),
-- Ford F-150
('Ford', 'F-150', 2015, 2020, 'engine', 'high', 'Cam Phaser Tick', 'Ticking noise from engine on startup due to cam phaser wear. Can lead to timing chain issues if not addressed.', 'NHTSA'),
('Ford', 'F-150', 2017, 2020, 'transmission', 'medium', '10-Speed Shift Issues', 'Harsh shifting, hunting for gears, or clunking in the 10-speed automatic transmission.', 'TSB'),
-- BMW 3 Series
('BMW', '3 Series', 2012, 2019, 'engine', 'high', 'Timing Chain Stretch', 'N20/N26 engines prone to timing chain stretch. Listen for rattling on cold start.', 'NHTSA'),
('BMW', '3 Series', 2012, 2018, 'electrical', 'medium', 'Battery Drain', 'Excessive battery drain when parked due to modules not entering sleep mode.', 'user-reported'),
-- Tesla Model 3
('Tesla', 'Model 3', 2018, 2023, 'body', 'medium', 'Panel Gap Issues', 'Inconsistent panel gaps and alignment issues common in early production vehicles.', 'user-reported'),
('Tesla', 'Model 3', 2018, 2023, 'other', 'low', 'Phantom Braking', 'Sudden unexpected braking events, particularly on highways with overpasses.', 'NHTSA'),
-- Chevrolet Silverado
('Chevrolet', 'Silverado', 2019, 2023, 'transmission', 'high', 'Transmission Shudder', 'Shudder/vibration at highway speeds due to torque converter issues in 8-speed transmission.', 'TSB'),
('Chevrolet', 'Silverado', 2019, 2022, 'engine', 'medium', 'Active Fuel Management Lifter', 'Lifter failure in AFM (Active Fuel Management) equipped V8 engines causing misfires.', 'NHTSA');

-- ============================================
-- 6. RPC Functions
-- ============================================

-- 6.1 create_inspection: Creates inspection + all step rows from templates
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
BEGIN
  -- Create the inspection
  INSERT INTO public.inspections (
    user_id, category_id, vehicle_year, vehicle_make, vehicle_model,
    vehicle_trim, vehicle_mileage, vehicle_vin, vehicle_color
  ) VALUES (
    p_user_id, p_category_id, p_vehicle_year, p_vehicle_make, p_vehicle_model,
    p_vehicle_trim, p_vehicle_mileage, p_vehicle_vin, p_vehicle_color
  ) RETURNING id INTO v_inspection_id;

  -- Create step rows from templates
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
          SELECT jsonb_agg(jsonb_build_object('item', item, 'checked', false, 'note', '', 'rating', 0))
          FROM jsonb_array_elements_text(v_template.checklist_items) AS item
        ),
        '[]'::jsonb
      )
    );
  END LOOP;

  RETURN v_inspection_id;
END;
$$;

-- 6.2 get_inspection: Get full inspection with steps and photos
CREATE OR REPLACE FUNCTION public.get_inspection(p_inspection_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', i.id,
    'user_id', i.user_id,
    'category_id', i.category_id,
    'vehicle_year', i.vehicle_year,
    'vehicle_make', i.vehicle_make,
    'vehicle_model', i.vehicle_model,
    'vehicle_trim', i.vehicle_trim,
    'vehicle_mileage', i.vehicle_mileage,
    'vehicle_vin', i.vehicle_vin,
    'vehicle_color', i.vehicle_color,
    'status', i.status,
    'current_step', i.current_step,
    'overall_rating', i.overall_rating,
    'decision', i.decision,
    'notes', i.notes,
    'report_url', i.report_url,
    'created_at', i.created_at,
    'updated_at', i.updated_at,
    'steps', (
      SELECT json_agg(
        json_build_object(
          'id', s.id,
          'inspection_id', s.inspection_id,
          'step_number', s.step_number,
          'step_name', s.step_name,
          'status', s.status,
          'checklist', s.checklist,
          'notes', s.notes,
          'rating', s.rating,
          'created_at', s.created_at,
          'updated_at', s.updated_at,
          'photos', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'id', p.id,
                'inspection_id', p.inspection_id,
                'step_id', p.step_id,
                'photo_url', p.photo_url,
                'photo_order', p.photo_order,
                'ai_analysis', p.ai_analysis,
                'ai_verdict', p.ai_verdict,
                'ai_analyzed_at', p.ai_analyzed_at,
                'created_at', p.created_at
              ) ORDER BY p.photo_order
            ), '[]'::json)
            FROM public.inspection_photos p
            WHERE p.step_id = s.id
          )
        ) ORDER BY s.step_number
      )
      FROM public.inspection_steps s
      WHERE s.inspection_id = i.id
    )
  ) INTO v_result
  FROM public.inspections i
  WHERE i.id = p_inspection_id;

  RETURN v_result;
END;
$$;

-- 6.3 get_user_inspections: List user's inspections for a category
CREATE OR REPLACE FUNCTION public.get_user_inspections(
  p_user_id UUID,
  p_category_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', i.id,
      'vehicle_year', i.vehicle_year,
      'vehicle_make', i.vehicle_make,
      'vehicle_model', i.vehicle_model,
      'vehicle_trim', i.vehicle_trim,
      'vehicle_mileage', i.vehicle_mileage,
      'status', i.status,
      'current_step', i.current_step,
      'overall_rating', i.overall_rating,
      'decision', i.decision,
      'report_url', i.report_url,
      'created_at', i.created_at,
      'updated_at', i.updated_at
    ) ORDER BY i.created_at DESC
  ), '[]'::json) INTO v_result
  FROM public.inspections i
  WHERE i.user_id = p_user_id
    AND i.category_id = p_category_id;

  RETURN v_result;
END;
$$;

-- 6.4 update_inspection_step: Update a step's checklist, notes, rating, status
CREATE OR REPLACE FUNCTION public.update_inspection_step(
  p_step_id UUID,
  p_checklist JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_rating INTEGER DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inspection_steps
  SET
    checklist = COALESCE(p_checklist, checklist),
    notes = COALESCE(p_notes, notes),
    rating = COALESCE(p_rating, rating),
    status = COALESCE(p_status, status),
    updated_at = now()
  WHERE id = p_step_id;

  RETURN FOUND;
END;
$$;

-- 6.5 complete_inspection: Finalize an inspection
CREATE OR REPLACE FUNCTION public.complete_inspection(
  p_inspection_id UUID,
  p_overall_rating INTEGER DEFAULT NULL,
  p_decision TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inspections
  SET
    status = CASE WHEN p_decision = 'pass' THEN 'passed' ELSE 'completed' END,
    overall_rating = COALESCE(p_overall_rating, overall_rating),
    decision = COALESCE(p_decision, decision),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_inspection_id;

  RETURN FOUND;
END;
$$;

-- 6.6 get_vehicle_known_issues: Find known issues for a vehicle
CREATE OR REPLACE FUNCTION public.get_vehicle_known_issues(
  p_make TEXT,
  p_model TEXT,
  p_year INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', ki.id,
      'make', ki.make,
      'model', ki.model,
      'year_start', ki.year_start,
      'year_end', ki.year_end,
      'category', ki.category,
      'severity', ki.severity,
      'title', ki.title,
      'description', ki.description,
      'source', ki.source
    ) ORDER BY
      CASE ki.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
  ), '[]'::json) INTO v_result
  FROM public.vehicle_known_issues ki
  WHERE ki.active = true
    AND LOWER(ki.make) = LOWER(p_make)
    AND LOWER(ki.model) = LOWER(p_model)
    AND p_year BETWEEN ki.year_start AND ki.year_end;

  RETURN v_result;
END;
$$;

-- 6.7 get_inspection_step_templates: Return active step templates
CREATE OR REPLACE FUNCTION public.get_inspection_step_templates()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', t.id,
      'step_number', t.step_number,
      'step_name', t.step_name,
      'checklist_items', t.checklist_items,
      'instructions', t.instructions,
      'photo_required', t.photo_required,
      'max_photos', t.max_photos
    ) ORDER BY t.sort_order
  ), '[]'::json) INTO v_result
  FROM public.inspection_step_templates t
  WHERE t.active = true;

  RETURN v_result;
END;
$$;

-- 6.8 update_inspection_current_step: Update which step the user is on
CREATE OR REPLACE FUNCTION public.update_inspection_current_step(
  p_inspection_id UUID,
  p_current_step INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inspections
  SET current_step = p_current_step, updated_at = now()
  WHERE id = p_inspection_id;

  RETURN FOUND;
END;
$$;

-- ============================================
-- 7. Grant Execute Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION public.create_inspection(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_inspection(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_inspections(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.update_inspection_step(UUID, JSONB, TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.complete_inspection(UUID, INTEGER, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_vehicle_known_issues(TEXT, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_inspection_step_templates() TO anon;
GRANT EXECUTE ON FUNCTION public.update_inspection_current_step(UUID, INTEGER) TO anon;

-- ============================================
-- 8. Supabase Storage Buckets (create via dashboard or API)
-- ============================================
--
-- Bucket 1: inspection-photos
--   Public read access, authenticated upload
--   Path pattern: {inspection_id}/{step_number}/{photo_order}.jpg
--
-- Bucket 2: inspection-reports
--   Public read access (so report URLs work without auth)
--   Path pattern: {inspection_id}.pdf
--   Written by the Edge Function (generate-inspection-report)
--   URL stored in inspections.report_url
--
-- NOTE: Storage bucket creation must be done via:
--   1. Supabase Dashboard > Storage > New Bucket
--   2. Create "inspection-photos" (Public: Yes)
--   3. Create "inspection-reports" (Public: Yes)
--   4. Or via Supabase Management API

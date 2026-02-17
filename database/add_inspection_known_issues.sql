-- ============================================
-- Add inspection_known_issues junction table
-- Links inspections to their matching known issues at creation time
-- Run this in Supabase SQL editor
-- ============================================

-- 1. Create junction table
CREATE TABLE IF NOT EXISTS public.inspection_known_issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  known_issue_id  UUID NOT NULL REFERENCES public.vehicle_known_issues(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(inspection_id, known_issue_id)
);

CREATE INDEX IF NOT EXISTS idx_inspection_known_issues_inspection
  ON public.inspection_known_issues(inspection_id);

-- RLS
ALTER TABLE public.inspection_known_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to inspection_known_issues"
  ON public.inspection_known_issues FOR ALL USING (true) WITH CHECK (true);

-- 2. Update create_inspection to auto-populate matching known issues
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

  -- Auto-populate matching known issues for this vehicle
  IF p_vehicle_make != '' AND p_vehicle_model != '' THEN
    INSERT INTO public.inspection_known_issues (inspection_id, known_issue_id)
    SELECT v_inspection_id, ki.id
    FROM public.vehicle_known_issues ki
    WHERE ki.active = true
      AND LOWER(ki.make) = LOWER(p_vehicle_make)
      AND LOWER(ki.model) = LOWER(p_vehicle_model)
      AND (p_vehicle_year IS NULL OR (p_vehicle_year >= ki.year_start AND p_vehicle_year <= ki.year_end));
  END IF;

  RETURN v_inspection_id;
END;
$$;

-- 3. Update get_inspection to include known issues
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
    ),
    'known_issues', (
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
      ), '[]'::json)
      FROM public.inspection_known_issues iki
      JOIN public.vehicle_known_issues ki ON ki.id = iki.known_issue_id
      WHERE iki.inspection_id = i.id
    )
  ) INTO v_result
  FROM public.inspections i
  WHERE i.id = p_inspection_id;

  RETURN v_result;
END;
$$;

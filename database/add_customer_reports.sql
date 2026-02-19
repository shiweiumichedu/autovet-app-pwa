-- ============================================
-- Refactor customer reports from JSONB to relational table
-- Mirrors inspection_photos pattern
-- Run this in Supabase SQL editor
-- ============================================

-- 1. Create the new table
CREATE TABLE IF NOT EXISTS public.inspection_customer_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  report_type     TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_type       TEXT NOT NULL,
  ai_analysis     TEXT,
  ai_verdict      TEXT,
  ai_analyzed_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(inspection_id, report_type)
);

-- 2. Migrate existing JSONB data into the new table
INSERT INTO public.inspection_customer_reports (inspection_id, report_type, file_url, file_name, file_type, ai_analysis, ai_analyzed_at, created_at)
SELECT
  i.id,
  elem->>'report_type',
  elem->>'file_url',
  elem->>'file_name',
  elem->>'file_type',
  elem->>'ai_summary',
  (elem->>'ai_analyzed_at')::timestamptz,
  COALESCE((elem->>'uploaded_at')::timestamptz, now())
FROM public.inspections i,
     jsonb_array_elements(i.customer_reports) elem
WHERE i.customer_reports IS NOT NULL
  AND jsonb_array_length(i.customer_reports) > 0
ON CONFLICT (inspection_id, report_type) DO NOTHING;

-- 3. Drop the JSONB column
ALTER TABLE public.inspections DROP COLUMN IF EXISTS customer_reports;

-- 4. Drop old functions (return types changed, so CREATE OR REPLACE won't work)
DROP FUNCTION IF EXISTS public.save_customer_report(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.save_customer_report_analysis(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_customer_report(UUID, TEXT);
DROP FUNCTION IF EXISTS public.delete_customer_report(UUID);

-- 5. RPC: Save a customer report (upsert)
CREATE OR REPLACE FUNCTION public.save_customer_report(
  p_inspection_id UUID,
  p_report_type TEXT,
  p_file_url TEXT,
  p_file_name TEXT,
  p_file_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.inspection_customer_reports (inspection_id, report_type, file_url, file_name, file_type)
  VALUES (p_inspection_id, p_report_type, p_file_url, p_file_name, p_file_type)
  ON CONFLICT (inspection_id, report_type)
  DO UPDATE SET file_url = p_file_url, file_name = p_file_name, file_type = p_file_type,
                ai_analysis = NULL, ai_verdict = NULL, ai_analyzed_at = NULL
  RETURNING id INTO v_id;

  UPDATE public.inspections SET updated_at = now() WHERE id = p_inspection_id;

  RETURN json_build_object('id', v_id);
END;
$$;

-- 6. RPC: Save AI analysis for a customer report (by report id)
CREATE OR REPLACE FUNCTION public.save_customer_report_analysis(
  p_report_id UUID,
  p_ai_analysis TEXT,
  p_ai_verdict TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inspection_customer_reports
  SET ai_analysis = p_ai_analysis,
      ai_verdict = p_ai_verdict,
      ai_analyzed_at = now()
  WHERE id = p_report_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 7. RPC: Delete a customer report (by report id)
CREATE OR REPLACE FUNCTION public.delete_customer_report(
  p_report_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.inspection_customer_reports WHERE id = p_report_id;
END;
$$;

-- 8. Update get_inspection to include customer_reports from new table
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
    'customer_reports', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', cr.id,
          'inspection_id', cr.inspection_id,
          'report_type', cr.report_type,
          'file_url', cr.file_url,
          'file_name', cr.file_name,
          'file_type', cr.file_type,
          'ai_analysis', cr.ai_analysis,
          'ai_verdict', cr.ai_verdict,
          'ai_analyzed_at', cr.ai_analyzed_at,
          'created_at', cr.created_at
        )
      ), '[]'::json)
      FROM public.inspection_customer_reports cr
      WHERE cr.inspection_id = i.id
    ),
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

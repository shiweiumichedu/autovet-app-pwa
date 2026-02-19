-- ============================================
-- Add customer_reports JSONB column to inspections
-- Stores OBD II, CarFax, AutoCheck report metadata
-- Run this in Supabase SQL editor
-- ============================================

-- 1. Add column
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS customer_reports JSONB DEFAULT '[]'::jsonb;

-- 2. RPC: Save a customer report entry
CREATE OR REPLACE FUNCTION public.save_customer_report(
  p_inspection_id UUID,
  p_report_type TEXT,
  p_file_url TEXT,
  p_file_name TEXT,
  p_file_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove existing entry for this report_type, then append new one
  UPDATE public.inspections
  SET customer_reports = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(customer_reports) elem
    WHERE elem->>'report_type' != p_report_type
  ) || jsonb_build_array(jsonb_build_object(
    'report_type', p_report_type,
    'file_url', p_file_url,
    'file_name', p_file_name,
    'file_type', p_file_type,
    'ai_summary', NULL,
    'ai_analyzed_at', NULL,
    'uploaded_at', now()
  )),
  updated_at = now()
  WHERE id = p_inspection_id;
END;
$$;

-- 3. RPC: Save AI analysis for a customer report
CREATE OR REPLACE FUNCTION public.save_customer_report_analysis(
  p_inspection_id UUID,
  p_report_type TEXT,
  p_ai_summary TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inspections
  SET customer_reports = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'report_type' = p_report_type
        THEN elem || jsonb_build_object('ai_summary', p_ai_summary, 'ai_analyzed_at', now())
        ELSE elem
      END
    )
    FROM jsonb_array_elements(customer_reports) elem
  ),
  updated_at = now()
  WHERE id = p_inspection_id;
END;
$$;

-- 4. RPC: Delete a customer report
CREATE OR REPLACE FUNCTION public.delete_customer_report(
  p_inspection_id UUID,
  p_report_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inspections
  SET customer_reports = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(customer_reports) elem
    WHERE elem->>'report_type' != p_report_type
  ),
  updated_at = now()
  WHERE id = p_inspection_id;
END;
$$;

-- 5. Update get_inspection to include customer_reports
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
    'customer_reports', COALESCE(i.customer_reports, '[]'::jsonb),
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

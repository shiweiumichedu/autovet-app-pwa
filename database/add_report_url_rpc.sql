-- ============================================
-- RPC: update_inspection_report_url
-- Saves the generated PDF report URL
-- ============================================

CREATE OR REPLACE FUNCTION public.update_inspection_report_url(
  p_inspection_id UUID,
  p_report_url TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inspections
  SET report_url = p_report_url
  WHERE id = p_inspection_id;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_inspection_report_url(UUID, TEXT) TO anon;

-- ============================================
-- RPC: save_photo_analysis
-- Updates a photo record with AI analysis results
-- ============================================

CREATE OR REPLACE FUNCTION public.save_photo_analysis(
  p_photo_id UUID,
  p_ai_analysis TEXT,
  p_ai_verdict TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inspection_photos
  SET
    ai_analysis = p_ai_analysis,
    ai_verdict = p_ai_verdict,
    ai_analyzed_at = NOW()
  WHERE id = p_photo_id;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_photo_analysis(UUID, TEXT, TEXT) TO anon;

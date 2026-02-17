-- ============================================
-- RPC: save_inspection_photo
-- Upserts a photo record (insert or update on conflict)
-- ============================================

CREATE OR REPLACE FUNCTION public.save_inspection_photo(
  p_inspection_id UUID,
  p_step_id UUID,
  p_photo_url TEXT,
  p_photo_order INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_photo_id UUID;
BEGIN
  INSERT INTO public.inspection_photos (inspection_id, step_id, photo_url, photo_order)
  VALUES (p_inspection_id, p_step_id, p_photo_url, p_photo_order)
  ON CONFLICT (step_id, photo_order)
  DO UPDATE SET photo_url = EXCLUDED.photo_url
  RETURNING id INTO v_photo_id;

  RETURN json_build_object('id', v_photo_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_inspection_photo(UUID, UUID, TEXT, INTEGER) TO anon;

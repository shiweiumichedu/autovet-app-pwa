-- ============================================
-- RPC: delete_inspection
-- Deletes an inspection and returns photo paths for storage cleanup
-- CASCADE handles steps, photos, and known_issues records
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_inspection(
  p_inspection_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_photo_paths JSON;
BEGIN
  -- Collect storage paths before deleting
  SELECT COALESCE(json_agg(
    json_build_object(
      'inspection_id', i.id,
      'step_number', s.step_number,
      'photo_order', p.photo_order
    )
  ), '[]'::json)
  INTO v_photo_paths
  FROM public.inspection_photos p
  JOIN public.inspection_steps s ON s.id = p.step_id
  JOIN public.inspections i ON i.id = s.inspection_id
  WHERE i.id = p_inspection_id;

  -- Delete inspection (CASCADE removes steps, photos, known_issues)
  DELETE FROM public.inspections WHERE id = p_inspection_id;

  RETURN json_build_object('deleted', true, 'photo_paths', v_photo_paths);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_inspection(UUID) TO anon;

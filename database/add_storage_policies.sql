-- ============================================
-- AutoVet App - Storage Policies
-- Run this AFTER creating the storage buckets in Supabase Dashboard
-- Required buckets: inspection-photos, inspection-reports
-- ============================================

-- Allow anonymous uploads to inspection-photos bucket
CREATE POLICY "Allow anonymous uploads to inspection-photos"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'inspection-photos');

-- Allow anonymous reads from inspection-photos bucket
CREATE POLICY "Allow anonymous reads from inspection-photos"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'inspection-photos');

-- Allow anonymous updates to inspection-photos (for upsert)
CREATE POLICY "Allow anonymous updates to inspection-photos"
ON storage.objects FOR UPDATE TO anon
USING (bucket_id = 'inspection-photos');

-- Allow anonymous deletes from inspection-photos
CREATE POLICY "Allow anonymous deletes from inspection-photos"
ON storage.objects FOR DELETE TO anon
USING (bucket_id = 'inspection-photos');

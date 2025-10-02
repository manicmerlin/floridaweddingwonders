-- SQL to run in Supabase SQL Editor
-- This allows authenticated users to upload to venue-photos bucket

-- Allow authenticated users to INSERT (upload) files
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'venue-photos');

-- Allow authenticated users to UPDATE their files
CREATE POLICY "Allow authenticated users to update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'venue-photos');

-- Allow authenticated users to DELETE their files
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'venue-photos');

-- Keep public read access (should already exist from template)
-- If not, uncomment this:
-- CREATE POLICY "Allow public read"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'venue-photos');

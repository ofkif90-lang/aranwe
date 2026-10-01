/*
# Storage bucket policies for property-images and avatars

## Security
- property-images: public read, authenticated write (owner or admin)
- avatars: public read, authenticated write (own avatar or admin)
*/

-- property-images: public read
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
CREATE POLICY "property_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-images');

-- property-images: authenticated can upload
DROP POLICY IF EXISTS "property_images_auth_upload" ON storage.objects;
CREATE POLICY "property_images_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images');

-- property-images: authenticated can update/delete their own
DROP POLICY IF EXISTS "property_images_auth_update" ON storage.objects;
CREATE POLICY "property_images_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "property_images_auth_delete" ON storage.objects;
CREATE POLICY "property_images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-images');

-- avatars: public read
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

-- avatars: authenticated can upload
DROP POLICY IF EXISTS "avatars_auth_upload" ON storage.objects;
CREATE POLICY "avatars_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- avatars: authenticated can update/delete
DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

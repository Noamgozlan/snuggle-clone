
-- 1. Fix profiles email exposure: remove anonymous access entirely
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_public = true);
REVOKE SELECT ON public.profiles FROM anon;

-- 2. Fix public bucket listing: drop broad SELECT policies on storage.objects
DROP POLICY IF EXISTS "Public can view trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
-- Direct file URL access still works because the buckets remain public;
-- only the ability to LIST files via the Data API is removed.

-- 3. SECURITY DEFINER function exposure: revoke from PUBLIC, grant only where needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_mentor_of(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lookup_user_id_by_username(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_mentor_of(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_user_id_by_username(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_mentor_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_user_id_by_username(text) TO authenticated;

-- 4. Realtime channel auth: require authentication to subscribe
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can broadcast" ON realtime.messages;
CREATE POLICY "Authenticated users can broadcast"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

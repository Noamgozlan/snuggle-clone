
REVOKE SELECT ON public.profiles FROM authenticated, anon;
GRANT SELECT (id, user_id, first_name, last_name, username, country, trading_style, avatar_url, created_at, updated_at, favorite_asset, is_public, chart_colors) ON public.profiles TO authenticated;
GRANT SELECT (id, user_id, first_name, last_name, username, country, trading_style, avatar_url, created_at, updated_at, favorite_asset, is_public, chart_colors) ON public.profiles TO anon;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Users can view messages in channels they have access to" ON public.community_messages;
CREATE POLICY "Users can view messages in channels they have access to"
ON public.community_messages
FOR SELECT
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM public.channel_permissions cp WHERE cp.channel_id = community_messages.channel_id
  )
  OR EXISTS (
    SELECT 1 FROM public.channel_permissions cp
    JOIN public.user_roles ur ON ur.role = cp.role
    WHERE cp.channel_id = community_messages.channel_id
      AND cp.can_read = true
      AND ur.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Mentors can create replies to their feedback"
ON public.feedback_replies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.mentor_trade_feedback mtf
    WHERE mtf.id = feedback_replies.feedback_id
      AND mtf.mentor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

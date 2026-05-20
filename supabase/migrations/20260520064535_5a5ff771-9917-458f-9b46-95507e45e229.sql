CREATE OR REPLACE FUNCTION public.lookup_user_id_by_username(p_username text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select user_id
  from public.profiles
  where username = p_username
  limit 1;
$$;
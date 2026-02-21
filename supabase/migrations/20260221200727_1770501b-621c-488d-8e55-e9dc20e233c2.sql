
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can read active quotes" ON public.admin_quotes;
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.admin_quotes;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can read active quotes"
  ON public.admin_quotes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage quotes"
  ON public.admin_quotes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

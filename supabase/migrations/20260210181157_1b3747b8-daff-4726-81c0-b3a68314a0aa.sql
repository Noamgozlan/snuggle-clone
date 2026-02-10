
-- Admin quotes table (single row for the active quote)
CREATE TABLE public.admin_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  author TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_quotes ENABLE ROW LEVEL SECURITY;

-- Everyone can read active quotes
CREATE POLICY "Anyone can read active quotes"
ON public.admin_quotes
FOR SELECT
USING (is_active = true);

-- Only admins can manage quotes
CREATE POLICY "Admins can manage quotes"
ON public.admin_quotes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_quotes_updated_at
BEFORE UPDATE ON public.admin_quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

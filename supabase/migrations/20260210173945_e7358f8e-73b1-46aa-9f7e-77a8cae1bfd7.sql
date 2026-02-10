
-- Add tag columns to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS mental_state TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS mistakes TEXT[];
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS setup_type TEXT;

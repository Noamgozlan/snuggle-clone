-- Add session column to trades table
ALTER TABLE public.trades 
ADD COLUMN session TEXT;

-- Add a comment to describe valid values
COMMENT ON COLUMN public.trades.session IS 'Trading session: new_york, london, asia';
-- Add timeframe column to trade_screenshots table
ALTER TABLE public.trade_screenshots 
ADD COLUMN timeframe text DEFAULT '15m';

-- Add a comment to describe the column
COMMENT ON COLUMN public.trade_screenshots.timeframe IS 'The timeframe of the chart screenshot (e.g., 1m, 5m, 15m, 1h, 4h, 1d)';
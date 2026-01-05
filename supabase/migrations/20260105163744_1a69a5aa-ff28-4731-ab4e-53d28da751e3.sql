-- Create trade_screenshots table for multiple images per trade
CREATE TABLE public.trade_screenshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  screenshot_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_screenshots ENABLE ROW LEVEL SECURITY;

-- Create policies - users can manage screenshots for their own trades
CREATE POLICY "Users can view screenshots of their trades"
ON public.trade_screenshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trades 
    WHERE trades.id = trade_screenshots.trade_id 
    AND trades.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add screenshots to their trades"
ON public.trade_screenshots
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trades 
    WHERE trades.id = trade_screenshots.trade_id 
    AND trades.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete screenshots from their trades"
ON public.trade_screenshots
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trades 
    WHERE trades.id = trade_screenshots.trade_id 
    AND trades.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_trade_screenshots_trade_id ON public.trade_screenshots(trade_id);
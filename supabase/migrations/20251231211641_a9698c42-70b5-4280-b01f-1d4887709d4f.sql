-- Add policy to allow users to view trades that are shared in community messages
CREATE POLICY "Users can view trades shared in community messages"
ON public.trades
FOR SELECT
USING (
  id IN (
    SELECT trade_id FROM public.community_messages WHERE trade_id IS NOT NULL
  )
);
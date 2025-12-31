-- Add trade_id column to mentor_messages for sharing trades in chat
ALTER TABLE public.mentor_messages 
ADD COLUMN trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL;
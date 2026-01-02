-- Add entry_reason and conclusions columns to trades table
ALTER TABLE public.trades 
ADD COLUMN entry_reason TEXT,
ADD COLUMN conclusions TEXT;

-- Add entry_reason and conclusions columns to shared_trades table as well
ALTER TABLE public.shared_trades 
ADD COLUMN entry_reason TEXT,
ADD COLUMN conclusions TEXT;
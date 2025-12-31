-- Add external_trade_id column to trades table for duplicate prevention
ALTER TABLE trades ADD COLUMN IF NOT EXISTS external_trade_id TEXT;
CREATE INDEX IF NOT EXISTS idx_trades_external_trade_id ON trades(external_trade_id);

-- Create broker_connections table
CREATE TABLE IF NOT EXISTS public.broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  broker_name TEXT NOT NULL DEFAULT 'tradovate',
  account_id TEXT,
  account_name TEXT,
  username TEXT,
  environment TEXT DEFAULT 'demo' CHECK (environment IN ('demo', 'live')),
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for broker_connections
CREATE POLICY "Users can view their own broker connections"
ON broker_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own broker connections"
ON broker_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own broker connections"
ON broker_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own broker connections"
ON broker_connections FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_broker_connections_updated_at
BEFORE UPDATE ON broker_connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
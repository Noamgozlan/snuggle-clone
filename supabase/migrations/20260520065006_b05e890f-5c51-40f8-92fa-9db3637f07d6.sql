-- prop_accounts table
CREATE TABLE public.prop_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  firm_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'eval_phase_1',
  account_size NUMERIC NOT NULL DEFAULT 50000,
  cost NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  portfolio_id UUID NULL,
  profit_target NUMERIC NULL,
  min_trading_days INTEGER NULL,
  max_drawdown NUMERIC NULL,
  rules_preset TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prop_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prop accounts"
  ON public.prop_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prop accounts"
  ON public.prop_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prop accounts"
  ON public.prop_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prop accounts"
  ON public.prop_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_prop_accounts_updated_at
  BEFORE UPDATE ON public.prop_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prop_accounts_user_id ON public.prop_accounts(user_id);
CREATE INDEX idx_prop_accounts_portfolio_id ON public.prop_accounts(portfolio_id);

-- prop_payouts table
CREATE TABLE public.prop_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prop_account_id UUID NOT NULL REFERENCES public.prop_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prop_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prop payouts"
  ON public.prop_payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prop payouts"
  ON public.prop_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prop payouts"
  ON public.prop_payouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prop payouts"
  ON public.prop_payouts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_prop_payouts_account_id ON public.prop_payouts(prop_account_id);
CREATE INDEX idx_prop_payouts_user_id ON public.prop_payouts(user_id);
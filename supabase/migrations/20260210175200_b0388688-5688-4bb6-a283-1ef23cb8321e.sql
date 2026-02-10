
-- Create daily_notes table
CREATE TABLE public.daily_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID,
  note_date DATE NOT NULL,
  pre_market_note TEXT,
  post_market_note TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, note_date, portfolio_id)
);

ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily notes" ON public.daily_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own daily notes" ON public.daily_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily notes" ON public.daily_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily notes" ON public.daily_notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_daily_notes_updated_at BEFORE UPDATE ON public.daily_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trading_goals table
CREATE TABLE public.trading_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  metric TEXT NOT NULL CHECK (metric IN ('pnl', 'trades', 'winrate', 'points')),
  target_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trading_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON public.trading_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.trading_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.trading_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.trading_goals FOR DELETE USING (auth.uid() = user_id);

-- Add columns to strategies table
ALTER TABLE public.strategies ADD COLUMN entry_rules TEXT;
ALTER TABLE public.strategies ADD COLUMN exit_rules TEXT;
ALTER TABLE public.strategies ADD COLUMN screenshot_url TEXT;
ALTER TABLE public.strategies ADD COLUMN risk_per_trade TEXT;

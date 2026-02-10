import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio } from "@/contexts/PortfolioContext";

export interface TradingGoal {
  id: string;
  user_id: string;
  portfolio_id: string | null;
  goal_type: "daily" | "weekly" | "monthly";
  metric: "pnl" | "trades" | "winrate" | "points";
  target_value: number;
  is_active: boolean;
  created_at: string;
}

export const useTradingGoals = () => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) { setGoals([]); setLoading(false); return; }
    try {
      let query = supabase.from('trading_goals' as any).select('*').eq('user_id', user.id).eq('is_active', true);
      if (activePortfolio) query = query.eq('portfolio_id', activePortfolio.id);
      const { data, error } = await query;
      if (error) throw error;
      setGoals((data || []) as any as TradingGoal[]);
    } catch (e) { console.error('Error fetching goals:', e); }
    finally { setLoading(false); }
  }, [user, activePortfolio]);

  const createGoal = async (goalType: string, metric: string, targetValue: number) => {
    if (!user) return { success: false };
    try {
      const { error } = await (supabase.from('trading_goals' as any) as any)
        .insert({ user_id: user.id, portfolio_id: activePortfolio?.id || null, goal_type: goalType, metric, target_value: targetValue });
      if (error) throw error;
      await fetchGoals();
      return { success: true };
    } catch (e) { console.error('Error creating goal:', e); return { success: false }; }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await (supabase.from('trading_goals' as any) as any).update({ is_active: false }).eq('id', id);
      if (error) throw error;
      await fetchGoals();
      return { success: true };
    } catch (e) { return { success: false }; }
  };

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  return { goals, loading, createGoal, deleteGoal, fetchGoals };
};

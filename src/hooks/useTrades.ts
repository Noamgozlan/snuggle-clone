import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { useBreakEvenConfig } from "@/pages/Settings";

export interface Trade {
  id: string;
  user_id: string;
  portfolio_id: string | null;
  symbol: string;
  trade_type: string;
  quantity: number;
  entry_date: string | null;
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  pnl_points: number | null;
  risk: number | null;
  commission: number | null;
  rr: number | null;
  rating: number | null;
  strategy: string | null;
  notes: string | null;
  screenshot_url: string | null;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
  mental_state: string | null;
  mistakes: string[] | null;
  setup_type: string | null;
}

export interface TradeStats {
  totalPnl: number;
  totalPoints: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  profitFactor: number;
  avgRR: number;
  avgPnl: number;
  avgPoints: number;
  avgWin: number;
  avgLoss: number;
  maxWin: number;
  maxLoss: number;
  maxWinPoints: number;
  maxLossPoints: number;
}

export const useTrades = () => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();
  const { min: beMin, max: beMax } = useBreakEvenConfig();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TradeStats>({
    totalPnl: 0,
    totalPoints: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    breakevenTrades: 0,
    winRate: 0,
    profitFactor: 0,
    avgRR: 0,
    avgPnl: 0,
    avgPoints: 0,
    avgWin: 0,
    avgLoss: 0,
    maxWin: 0,
    maxLoss: 0,
    maxWinPoints: 0,
    maxLossPoints: 0,
  });

  const calculateStats = useCallback(
    (tradesData: Trade[]) => {
      const totalPnl = tradesData.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalPoints = tradesData.reduce((sum, t) => sum + (t.pnl_points || 0), 0);

      // Categorize trades based on Break Even range
      const winningTrades = tradesData.filter((t) => (t.pnl || 0) > beMax);
      const losingTrades = tradesData.filter((t) => (t.pnl || 0) < beMin);
      const breakevenTrades = tradesData.filter((t) => {
        const pnl = t.pnl || 0;
        // BE if it's explicitly 0/null OR within the [min, max] range inclusive
        return pnl === 0 || t.pnl === null || (pnl >= beMin && pnl <= beMax);
      });

      const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));

      // Profit factor: standard formula uses gross profit vs gross loss across ALL trades
      // (independent of break-even bucketing) so the value is realistic.
      const grossProfit = tradesData.reduce((sum, t) => sum + Math.max(0, t.pnl || 0), 0);
      const grossLoss = Math.abs(tradesData.reduce((sum, t) => sum + Math.min(0, t.pnl || 0), 0));

      const pnls = tradesData.map((t) => t.pnl || 0);
      const points = tradesData.map((t) => t.pnl_points || 0);
      const maxWin = pnls.length > 0 ? Math.max(...pnls) : 0;
      const maxLoss = pnls.length > 0 ? Math.min(...pnls) : 0;
      const maxWinPoints = points.length > 0 ? Math.max(...points) : 0;
      const maxLossPoints = points.length > 0 ? Math.min(...points) : 0;

      const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

      // Calculate Avg RR
      const tradesWithRR = tradesData.filter((t) => t.rr !== null && t.rr !== undefined);
      const avgRR =
        tradesWithRR.length > 0 ? tradesWithRR.reduce((sum, t) => sum + (t.rr || 0), 0) / tradesWithRR.length : 0;

      // Win rate excludes break-even trades (only count wins vs losses)
      const decisiveTrades = winningTrades.length + losingTrades.length;

      setStats({
        totalPnl,
        totalPoints,
        totalTrades: tradesData.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        breakevenTrades: breakevenTrades.length,
        winRate: decisiveTrades > 0 ? (winningTrades.length / decisiveTrades) * 100 : 0,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
        avgRR,
        avgPnl: tradesData.length > 0 ? totalPnl / tradesData.length : 0,
        avgPoints: tradesData.length > 0 ? totalPoints / tradesData.length : 0,
        avgWin,
        avgLoss,
        maxWin,
        maxLoss,
        maxWinPoints,
        maxLossPoints,
      });
    },
    [beMin, beMax],
  );

  const fetchTrades = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

      // Filter by active portfolio if one is selected
      if (activePortfolio) {
        query = query.eq("portfolio_id", activePortfolio.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const tradesData = (data || []) as Trade[];
      setTrades(tradesData);
      calculateStats(tradesData);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  }, [user, activePortfolio, calculateStats]); // calculateStats now depends on beMin/beMax via callback dep

  const deleteTrade = async (tradeId: string) => {
    try {
      const { error } = await supabase.from("trades").delete().eq("id", tradeId);

      if (error) throw error;

      // Refresh trades
      await fetchTrades();
      return { success: true };
    } catch (error) {
      console.error("Error deleting trade:", error);
      return { success: false, error };
    }
  };

  const deleteAllTrades = async () => {
    if (!user) return { success: false };

    try {
      let query = supabase.from("trades").delete().eq("user_id", user.id);

      // Only delete trades for active portfolio if one is selected
      if (activePortfolio) {
        query = query.eq("portfolio_id", activePortfolio.id);
      }

      const { error } = await query;

      if (error) throw error;

      setTrades([]);
      calculateStats([]);
      return { success: true };
    } catch (error) {
      console.error("Error deleting all trades:", error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    stats,
    loading,
    fetchTrades,
    deleteTrade,
    deleteAllTrades,
    activePortfolioId: activePortfolio?.id || null,
  };
};

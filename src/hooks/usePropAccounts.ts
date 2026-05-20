import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PropAccount {
  id: string;
  user_id: string;
  firm_name: string;
  account_type: "eval_phase_1" | "eval_phase_2" | "funded";
  account_size: number;
  cost: number;
  start_date: string;
  status: "active" | "passed" | "failed" | "archived";
  portfolio_id: string | null;
  profit_target: number | null;
  min_trading_days: number | null;
  max_drawdown: number | null;
  rules_preset: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropPayout {
  id: string;
  prop_account_id: string;
  user_id: string;
  amount: number;
  payout_date: string;
  notes: string | null;
  created_at: string;
}

export interface PropAccountStats {
  netPnl: number;
  tradingDays: number;
  currentDrawdown: number; // positive value = drawdown in $
  payoutsTotal: number;
  payoutCount: number;
  progressPct: number; // 0-100+
  daysRatio: string; // "5/7"
  eligibleForPayout: boolean;
  ruleViolations: string[];
}

interface TradeRow {
  id: string;
  pnl: number | null;
  entry_date: string | null;
  portfolio_id: string | null;
  created_at: string;
}

function computeStats(account: PropAccount, trades: TradeRow[], payouts: PropPayout[]): PropAccountStats {
  const start = new Date(account.start_date + "T00:00:00").getTime();

  const inScope = trades.filter((t) => {
    if (account.portfolio_id && t.portfolio_id !== account.portfolio_id) return false;
    const d = new Date(t.entry_date || t.created_at).getTime();
    return d >= start;
  });

  // Sort chronologically for drawdown calculation
  const sorted = [...inScope].sort((a, b) => {
    const da = new Date(a.entry_date || a.created_at).getTime();
    const db = new Date(b.entry_date || b.created_at).getTime();
    return da - db;
  });

  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const t of sorted) {
    cumulative += t.pnl || 0;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  const netPnl = cumulative;

  const dayKeys = new Set<string>();
  for (const t of sorted) {
    const d = new Date(t.entry_date || t.created_at);
    dayKeys.add(d.toISOString().slice(0, 10));
  }
  const tradingDays = dayKeys.size;

  const acctPayouts = payouts.filter((p) => p.prop_account_id === account.id);
  const payoutsTotal = acctPayouts.reduce((s, p) => s + (p.amount || 0), 0);

  const target = account.profit_target || 0;
  const progressPct = target > 0 ? Math.min(999, (netPnl / target) * 100) : 0;
  const daysRatio = `${tradingDays}/${account.min_trading_days ?? "—"}`;

  const violations: string[] = [];
  if (account.max_drawdown != null && maxDrawdown > account.max_drawdown) {
    violations.push(`Drawdown $${maxDrawdown.toFixed(0)} > $${account.max_drawdown}`);
  }

  const targetHit = account.profit_target != null && netPnl >= account.profit_target;
  const daysHit = account.min_trading_days != null && tradingDays >= account.min_trading_days;
  const ddOk = account.max_drawdown == null || maxDrawdown <= account.max_drawdown;
  const activeStatus = account.status === "active" || account.status === "passed";

  const eligibleForPayout = targetHit && daysHit && ddOk && activeStatus;

  return {
    netPnl,
    tradingDays,
    currentDrawdown: maxDrawdown,
    payoutsTotal,
    payoutCount: acctPayouts.length,
    progressPct,
    daysRatio,
    eligibleForPayout,
    ruleViolations: violations,
  };
}

export const usePropAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PropAccount[]>([]);
  const [payouts, setPayouts] = useState<PropPayout[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setPayouts([]);
      setTrades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [accRes, payRes, tradeRes] = await Promise.all([
      supabase.from("prop_accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("prop_payouts").select("*").eq("user_id", user.id),
      supabase.from("trades").select("id, pnl, entry_date, portfolio_id, created_at").eq("user_id", user.id),
    ]);
    if (!accRes.error) setAccounts((accRes.data || []) as PropAccount[]);
    if (!payRes.error) setPayouts((payRes.data || []) as PropPayout[]);
    if (!tradeRes.error) setTrades((tradeRes.data || []) as TradeRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statsByAccount = useMemo(() => {
    const map: Record<string, PropAccountStats> = {};
    for (const acc of accounts) {
      map[acc.id] = computeStats(acc, trades, payouts);
    }
    return map;
  }, [accounts, trades, payouts]);

  const summary = useMemo(() => {
    const activeCount = accounts.filter((a) => a.status === "active" || a.status === "passed").length;
    const totalCost = accounts.reduce((s, a) => s + (a.cost || 0), 0);
    const totalPayouts = payouts.reduce((s, p) => s + (p.amount || 0), 0);
    return {
      activeCount,
      totalCount: accounts.length,
      totalCost,
      totalPayouts,
      netProfit: totalPayouts - totalCost,
    };
  }, [accounts, payouts]);

  const createAccount = async (input: Omit<PropAccount, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase.from("prop_accounts").insert({ ...input, user_id: user.id });
    if (!error) await fetchAll();
    return { error };
  };

  const updateAccount = async (id: string, patch: Partial<PropAccount>) => {
    const { error } = await supabase.from("prop_accounts").update(patch).eq("id", id);
    if (!error) await fetchAll();
    return { error };
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from("prop_accounts").delete().eq("id", id);
    if (!error) await fetchAll();
    return { error };
  };

  const recordPayout = async (
    prop_account_id: string,
    amount: number,
    payout_date: string,
    notes?: string
  ) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await supabase
      .from("prop_payouts")
      .insert({ prop_account_id, user_id: user.id, amount, payout_date, notes: notes || null });
    if (!error) await fetchAll();
    return { error };
  };

  const deletePayout = async (id: string) => {
    const { error } = await supabase.from("prop_payouts").delete().eq("id", id);
    if (!error) await fetchAll();
    return { error };
  };

  return {
    accounts,
    payouts,
    loading,
    statsByAccount,
    summary,
    createAccount,
    updateAccount,
    deleteAccount,
    recordPayout,
    deletePayout,
    refresh: fetchAll,
  };
};

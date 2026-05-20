// Preset rules per prop firm. User can override any of these in the form.

export type AccountType = "eval_phase_1" | "eval_phase_2" | "funded";

export interface PropFirmPreset {
  profit_target: number;
  min_trading_days: number;
  max_drawdown: number;
}

// firm -> account_type -> account_size -> preset
type PresetMap = Record<string, Partial<Record<AccountType, Record<number, PropFirmPreset>>>>;

export const PROP_FIRMS = [
  "Topstep",
  "Apex",
  "FundedNext",
  "Lucid",
  "MyForexFunds",
  "FTMO",
  "TakeProfitTrader",
  "Other",
] as const;

export type PropFirm = (typeof PROP_FIRMS)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, { he: string; en: string }> = {
  eval_phase_1: { he: "מבחן שלב 1", en: "Eval — Phase 1" },
  eval_phase_2: { he: "מבחן שלב 2", en: "Eval — Phase 2" },
  funded: { he: "תיק ממומן", en: "Funded" },
};

export const COMMON_SIZES = [25000, 50000, 75000, 100000, 150000, 200000, 250000, 300000];

// Industry-typical defaults. Always editable by the user.
export const PROP_FIRM_PRESETS: PresetMap = {
  Topstep: {
    eval_phase_1: {
      25000: { profit_target: 1500, min_trading_days: 5, max_drawdown: 1500 },
      50000: { profit_target: 3000, min_trading_days: 5, max_drawdown: 2000 },
      100000: { profit_target: 6000, min_trading_days: 5, max_drawdown: 3000 },
      150000: { profit_target: 9000, min_trading_days: 5, max_drawdown: 4500 },
    },
    funded: {
      50000: { profit_target: 2500, min_trading_days: 5, max_drawdown: 2000 },
      100000: { profit_target: 5000, min_trading_days: 5, max_drawdown: 3000 },
      150000: { profit_target: 7500, min_trading_days: 5, max_drawdown: 4500 },
    },
  },
  Apex: {
    eval_phase_1: {
      25000: { profit_target: 1500, min_trading_days: 7, max_drawdown: 1500 },
      50000: { profit_target: 3000, min_trading_days: 7, max_drawdown: 2500 },
      100000: { profit_target: 6000, min_trading_days: 7, max_drawdown: 3000 },
      150000: { profit_target: 9000, min_trading_days: 7, max_drawdown: 5000 },
    },
    funded: {
      50000: { profit_target: 2600, min_trading_days: 8, max_drawdown: 2500 },
      100000: { profit_target: 5200, min_trading_days: 8, max_drawdown: 3000 },
    },
  },
  FundedNext: {
    eval_phase_1: {
      25000: { profit_target: 2000, min_trading_days: 5, max_drawdown: 1500 },
      50000: { profit_target: 4000, min_trading_days: 5, max_drawdown: 3000 },
      100000: { profit_target: 8000, min_trading_days: 5, max_drawdown: 6000 },
      200000: { profit_target: 16000, min_trading_days: 5, max_drawdown: 12000 },
    },
    eval_phase_2: {
      50000: { profit_target: 2500, min_trading_days: 5, max_drawdown: 3000 },
      100000: { profit_target: 5000, min_trading_days: 5, max_drawdown: 6000 },
      200000: { profit_target: 10000, min_trading_days: 5, max_drawdown: 12000 },
    },
    funded: {
      50000: { profit_target: 2500, min_trading_days: 5, max_drawdown: 3000 },
      100000: { profit_target: 5000, min_trading_days: 5, max_drawdown: 6000 },
    },
  },
  Lucid: {
    eval_phase_1: {
      25000: { profit_target: 1000, min_trading_days: 5, max_drawdown: 750 },
      50000: { profit_target: 2000, min_trading_days: 5, max_drawdown: 1500 },
      100000: { profit_target: 4000, min_trading_days: 5, max_drawdown: 3000 },
    },
    funded: {
      50000: { profit_target: 2000, min_trading_days: 5, max_drawdown: 1500 },
      100000: { profit_target: 4000, min_trading_days: 5, max_drawdown: 3000 },
    },
  },
  FTMO: {
    eval_phase_1: {
      25000: { profit_target: 2500, min_trading_days: 4, max_drawdown: 2500 },
      50000: { profit_target: 5000, min_trading_days: 4, max_drawdown: 5000 },
      100000: { profit_target: 10000, min_trading_days: 4, max_drawdown: 10000 },
      200000: { profit_target: 20000, min_trading_days: 4, max_drawdown: 20000 },
    },
    eval_phase_2: {
      50000: { profit_target: 2500, min_trading_days: 4, max_drawdown: 5000 },
      100000: { profit_target: 5000, min_trading_days: 4, max_drawdown: 10000 },
    },
    funded: {
      100000: { profit_target: 5000, min_trading_days: 4, max_drawdown: 10000 },
    },
  },
  MyForexFunds: {},
  TakeProfitTrader: {
    eval_phase_1: {
      50000: { profit_target: 2000, min_trading_days: 5, max_drawdown: 2000 },
      100000: { profit_target: 4000, min_trading_days: 5, max_drawdown: 3000 },
      150000: { profit_target: 6000, min_trading_days: 5, max_drawdown: 4500 },
    },
  },
  Other: {},
};

export function getPreset(
  firm: string,
  accountType: AccountType,
  accountSize: number
): PropFirmPreset | null {
  return PROP_FIRM_PRESETS[firm]?.[accountType]?.[accountSize] ?? null;
}

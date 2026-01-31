/**
 * Formats a duration in milliseconds to HH:MM:SS format
 * Always returns non-negative values and is RTL-safe
 */
export const formatDuration = (ms: number): string => {
  // Ensure non-negative
  const absMs = Math.abs(ms);
  const totalSeconds = Math.floor(absMs / 1000);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Pad with zeros for consistent HH:MM:SS format
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  
  return `${hh}:${mm}:${ss}`;
};

/**
 * Calculates average trade duration from an array of trades
 * Only considers closed trades with both entry_date and exit_date
 * Returns formatted HH:MM:SS string or null if no valid trades
 */
export const calculateAverageTradeDuration = (
  trades: Array<{ entry_date: string | null; exit_date: string | null; is_closed?: boolean }>
): string | null => {
  // Filter to only closed trades with both dates
  const closedTrades = trades.filter(
    (t) => t.entry_date && t.exit_date && t.is_closed !== false
  );
  
  if (closedTrades.length === 0) return null;
  
  // Calculate total duration in milliseconds
  const totalMs = closedTrades.reduce((sum, t) => {
    const entry = new Date(t.entry_date!);
    const exit = new Date(t.exit_date!);
    const duration = exit.getTime() - entry.getTime();
    // Only add positive durations
    return sum + Math.max(0, duration);
  }, 0);
  
  // Calculate average
  const avgMs = totalMs / closedTrades.length;
  
  return formatDuration(avgMs);
};

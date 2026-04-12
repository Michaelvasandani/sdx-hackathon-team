/**
 * Wash Trading Detection
 *
 * Detects repetitive same-size trades that suggest self-trading
 * to create artificial volume.
 *
 * Signal: High percentage of trades with identical sizes
 * Interpretation: Wash trading to inflate volume metrics
 */

export interface TradeData {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface WashTradingDetectionResult {
  detected: boolean;
  type: 'wash_trading';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  evidence: {
    total_trades: number;
    same_size_count: number;
    common_size: number;
    ratio: number;
  };
}

const WASH_TRADING_THRESHOLD = 0.7; // 70% of trades being same size
const HIGH_WASH_THRESHOLD = 0.85; // 85% is very suspicious

/**
 * Detect wash trading from trade history
 *
 * @param trades - Recent trade executions
 * @param windowHours - Time window to analyze (default 2 hours)
 * @returns Detection result or null if no wash trading detected
 */
export function detectWashTrading(
  trades: TradeData[],
  windowHours: number = 2
): WashTradingDetectionResult | null {
  const now = Date.now();
  const windowMs = windowHours * 60 * 60 * 1000;

  // Filter to recent window
  const recentTrades = trades.filter((t) => now - t.timestamp < windowMs);

  if (recentTrades.length < 20) {
    return null; // Need minimum sample size
  }

  // Count trade size distribution
  const sizeCount = new Map<number, number>();

  for (const trade of recentTrades) {
    // Round to 2 decimals to group similar sizes
    const roundedSize = Math.round(trade.size * 100) / 100;
    sizeCount.set(roundedSize, (sizeCount.get(roundedSize) || 0) + 1);
  }

  // Find most common size
  let mostCommonSize = 0;
  let mostCommonCount = 0;

  for (const [size, count] of sizeCount.entries()) {
    if (count > mostCommonCount) {
      mostCommonSize = size;
      mostCommonCount = count;
    }
  }

  // Calculate ratio of most common size
  const ratio = mostCommonCount / recentTrades.length;

  // Check if ratio exceeds threshold
  if (ratio < WASH_TRADING_THRESHOLD) {
    return null;
  }

  // Determine severity
  const severity: 'medium' | 'high' | 'critical' =
    ratio > 0.95 ? 'critical' : ratio > HIGH_WASH_THRESHOLD ? 'high' : 'medium';

  // Confidence based on how extreme the ratio is
  const confidence = Math.min(50 + ratio * 50, 95);

  const description = `${mostCommonCount} out of ${recentTrades.length} trades (${(
    ratio * 100
  ).toFixed(
    1
  )}%) in the last ${windowHours} hours were exactly ${mostCommonSize} contracts. This highly uniform distribution suggests wash trading to create artificial volume. Actual unique volume is likely ${(
    (1 - ratio) *
    100
  ).toFixed(0)}% lower than reported.`;

  return {
    detected: true,
    type: 'wash_trading',
    severity,
    confidence,
    description,
    evidence: {
      total_trades: recentTrades.length,
      same_size_count: mostCommonCount,
      common_size: mostCommonSize,
      ratio,
    },
  };
}

/**
 * Calculate wash trading probability (0-1) for integrity scoring
 */
export function calculateWashTradingProbability(trades: TradeData[]): number {
  if (trades.length < 10) return 0;

  const sizeCount = new Map<number, number>();

  for (const trade of trades) {
    const roundedSize = Math.round(trade.size * 100) / 100;
    sizeCount.set(roundedSize, (sizeCount.get(roundedSize) || 0) + 1);
  }

  // Find highest ratio
  let maxCount = 0;
  for (const count of sizeCount.values()) {
    if (count > maxCount) maxCount = count;
  }

  const maxRatio = maxCount / trades.length;

  // Return probability (0-1)
  return Math.max(0, (maxRatio - 0.5) / 0.5); // Scale from 50-100% uniformity
}

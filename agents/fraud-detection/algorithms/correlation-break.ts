/**
 * Cross-Market Correlation Break Detection
 *
 * Detects when historically correlated markets suddenly move independently,
 * which could indicate isolated manipulation on one market.
 *
 * Signal: Historical correlation >0.7, recent correlation <0.3
 * Interpretation: Isolated manipulation vs. genuine cultural shift
 */

export interface PriceHistory {
  ticker: string;
  prices: Array<{ timestamp: number; value: number }>;
}

export interface CorrelationBreakDetectionResult {
  detected: boolean;
  type: 'correlation_break';
  severity: 'low' | 'medium';
  confidence: number;
  description: string;
  evidence: {
    ticker1: string;
    ticker2: string;
    historical_correlation: number;
    recent_correlation: number;
    correlation_drop: number;
  };
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Extract price values aligned by timestamp
 */
function alignPrices(
  history1: PriceHistory,
  history2: PriceHistory
): { prices1: number[]; prices2: number[] } {
  const prices1: number[] = [];
  const prices2: number[] = [];

  // Create timestamp maps
  const map1 = new Map(history1.prices.map((p) => [p.timestamp, p.value]));
  const map2 = new Map(history2.prices.map((p) => [p.timestamp, p.value]));

  // Find common timestamps
  const commonTimestamps = new Set<number>();
  for (const ts of map1.keys()) {
    if (map2.has(ts)) {
      commonTimestamps.add(ts);
    }
  }

  // Extract aligned prices
  for (const ts of Array.from(commonTimestamps).sort((a, b) => a - b)) {
    prices1.push(map1.get(ts)!);
    prices2.push(map2.get(ts)!);
  }

  return { prices1, prices2 };
}

/**
 * Detect correlation break between two markets
 */
export function detectCorrelationBreak(
  historicalData1: PriceHistory,
  historicalData2: PriceHistory,
  recentData1: PriceHistory,
  recentData2: PriceHistory
): CorrelationBreakDetectionResult | null {
  // Calculate historical correlation (e.g., last 30 days)
  const { prices1: histPrices1, prices2: histPrices2 } = alignPrices(
    historicalData1,
    historicalData2
  );

  if (histPrices1.length < 10) {
    return null; // Insufficient historical data
  }

  const historicalCorrelation = calculateCorrelation(histPrices1, histPrices2);

  // Calculate recent correlation (e.g., last 24 hours)
  const { prices1: recentPrices1, prices2: recentPrices2 } = alignPrices(
    recentData1,
    recentData2
  );

  if (recentPrices1.length < 5) {
    return null; // Insufficient recent data
  }

  const recentCorrelation = calculateCorrelation(recentPrices1, recentPrices2);

  // Check for significant correlation break
  if (historicalCorrelation < 0.7 || recentCorrelation > 0.3) {
    return null; // No significant break
  }

  const correlationDrop = historicalCorrelation - recentCorrelation;

  const severity: 'low' | 'medium' = correlationDrop > 0.6 ? 'medium' : 'low';
  const confidence = Math.min(50 + correlationDrop * 25, 70);

  const description = `${historicalData1.ticker} and ${
    historicalData2.ticker
  } historically move together (correlation: ${historicalCorrelation.toFixed(
    2
  )}) but recently diverged (${recentCorrelation.toFixed(
    2
  )}). This ${correlationDrop.toFixed(
    2
  )} correlation drop could indicate isolated manipulation on one market rather than a genuine cultural shift affecting both.`;

  return {
    detected: true,
    type: 'correlation_break',
    severity,
    confidence,
    description,
    evidence: {
      ticker1: historicalData1.ticker,
      ticker2: historicalData2.ticker,
      historical_correlation: historicalCorrelation,
      recent_correlation: recentCorrelation,
      correlation_drop: correlationDrop,
    },
  };
}

/**
 * Calculate correlation break score for integrity calculation
 */
export function calculateCorrelationBreakScore(
  historicalCorr: number,
  recentCorr: number
): number {
  if (historicalCorr < 0.7) return 0;

  const drop = historicalCorr - recentCorr;
  if (drop < 0.4) return 0;

  return Math.min((drop - 0.4) * 100, 100);
}

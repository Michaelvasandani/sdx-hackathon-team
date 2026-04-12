/**
 * Price-Index Divergence Detection
 *
 * Detects when price movements significantly diverge from attention index movements.
 * This suggests artificial price manipulation without underlying cultural momentum.
 *
 * Signal: Price changes X% but index only changes Y%, where |X - Y| > threshold
 * Interpretation: Someone is manipulating price without genuine attention growth
 */

export interface PriceIndexData {
  price_change_24h: number; // Percentage change in price
  index_change_24h: number; // Percentage change in attention index
}

export interface DivergenceDetectionResult {
  detected: boolean;
  type: 'price_manipulation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  description: string;
  evidence: {
    price_change: number;
    index_change: number;
    divergence: number;
  };
}

const DIVERGENCE_THRESHOLD = 15; // 15% divergence triggers alert
const HIGH_DIVERGENCE_THRESHOLD = 25; // 25% is high severity

/**
 * Calculate percentage change
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Detect price-index manipulation
 *
 * @param ticker - Market ticker symbol
 * @param currentPrice - Current price
 * @param price24hAgo - Price 24 hours ago
 * @param currentIndex - Current attention index value
 * @param index24hAgo - Attention index value 24 hours ago
 * @returns Detection result or null if no manipulation detected
 */
export function detectPriceManipulation(
  ticker: string,
  currentPrice: number,
  price24hAgo: number,
  currentIndex: number,
  index24hAgo: number
): DivergenceDetectionResult | null {
  // Calculate percentage changes
  const priceChange = calculatePercentageChange(price24hAgo, currentPrice);
  const indexChange = calculatePercentageChange(index24hAgo, currentIndex);

  // Calculate absolute divergence
  const divergence = Math.abs(priceChange - indexChange);

  // Check if divergence exceeds threshold
  if (divergence < DIVERGENCE_THRESHOLD) {
    return null; // No significant divergence
  }

  // Determine severity
  const severity: 'medium' | 'high' | 'critical' =
    divergence > 40
      ? 'critical'
      : divergence > HIGH_DIVERGENCE_THRESHOLD
      ? 'high'
      : 'medium';

  // Calculate confidence (scales with divergence magnitude)
  const confidence = Math.min((divergence / 50) * 100, 100);

  // Generate description
  const description = `Price moved ${priceChange.toFixed(
    1
  )}% but attention index only moved ${indexChange.toFixed(
    1
  )}%. This ${divergence.toFixed(
    1
  )}% divergence suggests artificial price movement without underlying cultural momentum. ${
    priceChange > 0 && indexChange < 5
      ? 'Price is being pumped without genuine attention growth.'
      : priceChange < 0 && indexChange > -5
      ? 'Price is being dumped despite stable attention.'
      : 'Price and attention are significantly misaligned.'
  }`;

  return {
    detected: true,
    type: 'price_manipulation',
    severity,
    confidence,
    description,
    evidence: {
      price_change: priceChange,
      index_change: indexChange,
      divergence,
    },
  };
}

/**
 * Batch detection for multiple tickers
 */
export async function detectPriceManipulationBatch(
  markets: Array<{
    ticker: string;
    currentPrice: number;
    price24hAgo: number;
    currentIndex: number;
    index24hAgo: number;
  }>
): Promise<Map<string, DivergenceDetectionResult>> {
  const results = new Map<string, DivergenceDetectionResult>();

  for (const market of markets) {
    const result = detectPriceManipulation(
      market.ticker,
      market.currentPrice,
      market.price24hAgo,
      market.currentIndex,
      market.index24hAgo
    );

    if (result) {
      results.set(market.ticker, result);
    }
  }

  return results;
}

/**
 * Calculate divergence score (0-100) for integrity scoring
 * Higher score = worse divergence
 */
export function calculateDivergenceScore(
  priceChange: number,
  indexChange: number
): number {
  const divergence = Math.abs(priceChange - indexChange);

  if (divergence < DIVERGENCE_THRESHOLD) {
    return 0; // No significant divergence
  }

  // Scale divergence to 0-100 score (100 = worst)
  return Math.min((divergence / 50) * 100, 100);
}

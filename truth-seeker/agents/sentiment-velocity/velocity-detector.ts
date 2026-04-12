/**
 * Sentiment Velocity Detector
 * Measures price and index acceleration to detect momentum changes
 */

export interface MomentumSignal {
  type: 'price_acceleration' | 'index_acceleration' | 'momentum_divergence';
  detected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  magnitude: number; // z-score
  direction: 'positive' | 'negative'; // direction of acceleration
  window: '5m' | '15m' | '1h'; // measurement window
  evidence: {
    current_velocity: number;
    previous_velocity: number;
    acceleration: number;
    z_score: number;
    baseline_acceleration_std: number;
  };
}

export interface VelocityAnalysis {
  ticker: string;
  timestamp: string;
  price_signals: MomentumSignal[];
  index_signals: MomentumSignal[];
  alert_level: 'green' | 'yellow' | 'red'; // composite risk level
  has_critical_alert: boolean;
}

/**
 * Calculate velocity (first derivative of price/index)
 */
function calculateVelocity(values: number[]): number[] {
  if (values.length < 2) return [];
  return values.slice(1).map((val, i) => val - values[i]);
}

/**
 * Calculate acceleration (second derivative, or velocity of velocity)
 */
function calculateAcceleration(values: number[]): number[] {
  const velocities = calculateVelocity(values);
  return calculateVelocity(velocities);
}

/**
 * Compute z-score: (value - mean) / std_dev
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate mean of array
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Detect momentum in a single price/index series
 * Returns signals for multiple time windows (5m, 15m, 1h)
 */
export function detectAcceleration(
  ticker: string,
  values: number[],
  valueType: 'price' | 'index',
  baselineAccelerations: number[], // historical accelerations for this series
  threshold: number = 2.0 // z-score threshold for "extreme"
): MomentumSignal[] {
  const signals: MomentumSignal[] = [];

  // Need at least 60 data points (if 1-min candlesticks, last 1 hour)
  if (values.length < 60) {
    return signals;
  }

  // Define windows: [5-min, 15-min, 1-hour] = [5, 15, 60] data points
  const windows = [
    { duration: 5 as const, name: '5m' as const },
    { duration: 15 as const, name: '15m' as const },
    { duration: 60 as const, name: '1h' as const },
  ];

  // Get baseline statistics for acceleration
  const baselineMean = calculateMean(baselineAccelerations);
  const baselineStdDev = calculateStdDev(baselineAccelerations);

  for (const window of windows) {
    if (values.length < window.duration + 1) continue;

    // Get recent values for this window
    const recentValues = values.slice(-window.duration - 1);

    // Calculate acceleration in this window
    const accelerations = calculateAcceleration(recentValues);
    if (accelerations.length === 0) continue;

    const currentAcceleration = accelerations[accelerations.length - 1];
    const previousAcceleration = accelerations[accelerations.length - 2] || 0;

    // Normalize to z-score
    const zScore = calculateZScore(currentAcceleration, baselineMean, baselineStdDev);

    // Determine if this is a significant signal
    const isSignificant = Math.abs(zScore) >= threshold;

    if (isSignificant) {
      const severity =
        Math.abs(zScore) > 3.0
          ? 'critical'
          : Math.abs(zScore) > 2.5
            ? 'high'
            : Math.abs(zScore) > 2.0
              ? 'medium'
              : 'low';

      const direction = currentAcceleration > 0 ? 'positive' : 'negative';

      signals.push({
        type: valueType === 'price' ? 'price_acceleration' : 'index_acceleration',
        detected: true,
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        confidence: Math.min(95, (Math.abs(zScore) / 4.0) * 100), // 0-100, cap at 95
        magnitude: zScore,
        direction,
        window: window.name,
        evidence: {
          current_velocity: previousAcceleration, // velocity at times[t-1]
          previous_velocity: accelerations[accelerations.length - 3] || 0,
          acceleration: currentAcceleration,
          z_score: zScore,
          baseline_acceleration_std: baselineStdDev,
        },
      });
    }
  }

  return signals;
}

/**
 * Main function: Analyze price acceleration for a market
 * Expects price history (1-min candlesticks, last 24+ hours for baseline)
 */
export function analyzePriceAcceleration(
  ticker: string,
  priceHistory: number[], // ascending order [oldest, ..., newest]
  baselinePriceAccelerations: number[], // historical accelerations on 1h+ of data
  threshold: number = 2.0
): MomentumSignal[] {
  return detectAcceleration(
    ticker,
    priceHistory,
    'price',
    baselinePriceAccelerations,
    threshold
  );
}

/**
 * Main function: Analyze index acceleration for a market
 */
export function analyzeIndexAcceleration(
  ticker: string,
  indexHistory: number[], // ascending order [oldest, ..., newest]
  baselineIndexAccelerations: number[], // historical accelerations
  threshold: number = 2.0
): MomentumSignal[] {
  return detectAcceleration(
    ticker,
    indexHistory,
    'index',
    baselineIndexAccelerations,
    threshold
  );
}

/**
 * Compute alert level based on signals
 */
export function computeAlertLevel(
  signals: MomentumSignal[]
): 'green' | 'yellow' | 'red' {
  const hasCritical = signals.some((s) => s.severity === 'critical');
  const hasHigh = signals.some((s) => s.severity === 'high');
  const hasMedium = signals.some((s) => s.severity === 'medium');

  if (hasCritical) return 'red';
  if (hasHigh) return 'red';
  if (hasMedium) return 'yellow';
  return 'green';
}

/**
 * Full velocity analysis for a market
 */
export function analyzeMarketVelocity(
  ticker: string,
  priceHistory: number[], // 1-min candlesticks, last 60+ min
  indexHistory: number[], // 1-min indices, same length as priceHistory
  baselinePriceAccelerations: number[], // historical price accelerations
  baselineIndexAccelerations: number[] // historical index accelerations
): VelocityAnalysis {
  const priceSignals = analyzePriceAcceleration(
    ticker,
    priceHistory,
    baselinePriceAccelerations
  );
  const indexSignals = analyzeIndexAcceleration(
    ticker,
    indexHistory,
    baselineIndexAccelerations
  );

  const allSignals = [...priceSignals, ...indexSignals];
  const alertLevel = computeAlertLevel(allSignals);
  const hasCritical = allSignals.some((s) => s.severity === 'critical');

  return {
    ticker,
    timestamp: new Date().toISOString(),
    price_signals: priceSignals,
    index_signals: indexSignals,
    alert_level: alertLevel,
    has_critical_alert: hasCritical,
  };
}

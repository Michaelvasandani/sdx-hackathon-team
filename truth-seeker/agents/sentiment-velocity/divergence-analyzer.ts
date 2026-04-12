/**
 * Sentiment Momentum Divergence Analyzer
 * Detects when price momentum diverges from index momentum (price accelerating up while index accelerates down, etc.)
 */

import { MomentumSignal } from './velocity-detector';

export interface DivergenceAlert {
  type: 'momentum_divergence';
  detected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  description: string;
  price_momentum_direction: 'positive' | 'negative' | 'neutral';
  index_momentum_direction: 'positive' | 'negative' | 'neutral';
  divergence_magnitude: number; // combined z-score magnitude of divergence
  window: '5m' | '15m' | '1h';
  evidence: {
    price_acceleration: number;
    price_z_score: number;
    index_acceleration: number;
    index_z_score: number;
    direction_mismatch: string;
  };
}

/**
 * Determine momentum direction from acceleration
 */
function getMomentumDirection(
  acceleration: number,
  threshold: number = 0.5
): 'positive' | 'negative' | 'neutral' {
  if (Math.abs(acceleration) < threshold) return 'neutral';
  return acceleration > 0 ? 'positive' : 'negative';
}

/**
 * Detect divergence between price and index momentum
 * Returns alert if they diverge significantly
 */
export function detectMomentumDivergence(
  priceSignals: MomentumSignal[],
  indexSignals: MomentumSignal[]
): DivergenceAlert[] {
  const alerts: DivergenceAlert[] = [];

  // Group signals by window
  const windows = ['5m', '15m', '1h'] as const;

  for (const window of windows) {
    const priceSignal = priceSignals.find((s) => s.window === window && s.detected);
    const indexSignal = indexSignals.find((s) => s.window === window && s.detected);

    // Both must have detected signals to identify divergence
    if (!priceSignal || !indexSignal) continue;

    const priceDirection = getMomentumDirection(priceSignal.evidence.acceleration);
    const indexDirection = getMomentumDirection(indexSignal.evidence.acceleration);

    // Check if directions diverge (one positive, one negative, or extremes)
    const isDiverging =
      (priceDirection === 'positive' && indexDirection === 'negative') ||
      (priceDirection === 'negative' && indexDirection === 'positive');

    if (!isDiverging) continue;

    // Calculate divergence magnitude: sum of absolute z-scores
    const divergenceMagnitude =
      Math.abs(priceSignal.magnitude) + Math.abs(indexSignal.magnitude);

    // Determine severity based on divergence magnitude
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (divergenceMagnitude > 6.0) severity = 'critical';
    else if (divergenceMagnitude > 5.0) severity = 'high';
    else if (divergenceMagnitude > 4.0) severity = 'medium';

    // Confidence: higher divergence = higher confidence
    const confidence = Math.min(100, (divergenceMagnitude / 8.0) * 100);

    alerts.push({
      type: 'momentum_divergence',
      detected: true,
      severity,
      confidence,
      description:
        `Price momentum ${priceDirection} but Index momentum ${indexDirection} (${window} window). ` +
        `This suggests price movement decoupling from actual attention trends.`,
      price_momentum_direction: priceDirection,
      index_momentum_direction: indexDirection,
      divergence_magnitude: divergenceMagnitude,
      window,
      evidence: {
        price_acceleration: priceSignal.evidence.acceleration,
        price_z_score: priceSignal.magnitude,
        index_acceleration: indexSignal.evidence.acceleration,
        index_z_score: indexSignal.magnitude,
        direction_mismatch: `Price ${priceDirection} vs Index ${indexDirection}`,
      },
    });
  }

  return alerts;
}

/**
 * Filter divergence alerts to only high-confidence ones (moderate threshold)
 */
export function filterSignificantDivergences(
  alerts: DivergenceAlert[],
  minConfidence: number = 65
): DivergenceAlert[] {
  return alerts.filter((alert) => alert.confidence >= minConfidence);
}

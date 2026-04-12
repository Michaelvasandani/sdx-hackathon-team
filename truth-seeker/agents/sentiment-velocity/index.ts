/**
 * Sentiment Velocity Agent Orchestrator
 * Coordinates velocity detection and divergence analysis
 */

import {
  VelocityAnalysis,
  MomentumSignal,
  analyzeMarketVelocity,
} from './velocity-detector';
import {
  DivergenceAlert,
  detectMomentumDivergence,
  filterSignificantDivergences,
} from './divergence-analyzer';

export interface SentimentVelocityResult {
  ticker: string;
  timestamp: string;
  velocity_analysis: VelocityAnalysis;
  divergence_alerts: DivergenceAlert[];
  overall_momentum_score: number; // 0-100
  momentum_status: 'stable' | 'accelerating' | 'diverging' | 'critical';
}

/**
 * Calculate overall momentum score (0-100)
 * Combines signal strength and divergence detection
 */
function calculateMomentumScore(
  velocityAnalysis: VelocityAnalysis,
  divergenceAlerts: DivergenceAlert[]
): number {
  let score = 50; // baseline neutral

  // Penalize for high-severity signals
  const criticalSignals = velocityAnalysis.price_signals.filter(
    (s) => s.severity === 'critical'
  ).length;
  const highSignals = velocityAnalysis.price_signals.filter(
    (s) => s.severity === 'high'
  ).length;
  const mediumSignals = velocityAnalysis.price_signals.filter(
    (s) => s.severity === 'medium'
  ).length;

  score -= criticalSignals * 15;
  score -= highSignals * 10;
  score -= mediumSignals * 5;

  // Penalize for divergence
  for (const alert of divergenceAlerts) {
    if (alert.severity === 'critical') score -= 20;
    else if (alert.severity === 'high') score -= 15;
    else if (alert.severity === 'medium') score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine momentum status
 */
function determineMomentumStatus(
  velocityAnalysis: VelocityAnalysis,
  divergenceAlerts: DivergenceAlert[]
): 'stable' | 'accelerating' | 'diverging' | 'critical' {
  if (velocityAnalysis.has_critical_alert) return 'critical';
  if (divergenceAlerts.some((a) => a.severity === 'high' || a.severity === 'critical'))
    return 'diverging';
  if (
    velocityAnalysis.price_signals.some(
      (s) => s.severity === 'high' || s.severity === 'critical'
    )
  )
    return 'accelerating';
  return 'stable';
}

/**
 * Main orchestrator: Run full sentiment velocity analysis
 */
export async function analyzeSentimentVelocity(
  ticker: string,
  priceHistory: number[], // 1-min candlestick closes, last 60+ minutes
  indexHistory: number[], // 1-min index values, same length as priceHistory
  baselinePriceAccelerations: number[], // historical accelerations (can be from 24h+ of historical data)
  baselineIndexAccelerations: number[] // historical index accelerations
): Promise<SentimentVelocityResult> {
  // Step 1: Analyze acceleration/velocity
  const velocityAnalysis = analyzeMarketVelocity(
    ticker,
    priceHistory,
    indexHistory,
    baselinePriceAccelerations,
    baselineIndexAccelerations
  );

  // Step 2: Detect divergence between price and index momentum
  const allDivergences = detectMomentumDivergence(
    velocityAnalysis.price_signals,
    velocityAnalysis.index_signals
  );

  // Step 3: Filter to only significant divergences (confidence >= 65)
  const divergenceAlerts = filterSignificantDivergences(allDivergences, 65);

  // Step 4: Calculate composite scores
  const momentumScore = calculateMomentumScore(velocityAnalysis, divergenceAlerts);
  const momentumStatus = determineMomentumStatus(velocityAnalysis, divergenceAlerts);

  return {
    ticker,
    timestamp: new Date().toISOString(),
    velocity_analysis: velocityAnalysis,
    divergence_alerts: divergenceAlerts,
    overall_momentum_score: momentumScore,
    momentum_status: momentumStatus,
  };
}

// Export types for use in other modules
export type { VelocityAnalysis, MomentumSignal, DivergenceAlert };

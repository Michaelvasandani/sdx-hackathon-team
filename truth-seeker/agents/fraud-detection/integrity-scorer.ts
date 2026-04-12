/**
 * Integrity Score Calculator
 *
 * Combines all fraud detection signals into a single 0-100 integrity score
 * Higher score = better integrity (safer to trade)
 * Lower score = worse integrity (fraud detected)
 */

export interface IntegritySignals {
  price_index_divergence: number; // 0-100 (higher = worse divergence)
  spoofing_events: number; // Count of spoofing events
  wash_trading_probability: number; // 0-1
  bot_coordination_detected: boolean;
  funding_anomaly_score: number; // 0-100
  correlation_break_score: number; // 0-100
}

export interface IntegrityScore {
  score: number; // 0-100
  signals: IntegritySignals;
  risk_level: 'safe' | 'moderate' | 'high' | 'critical';
}

// Weights for each signal (must sum to 1.0)
const WEIGHTS = {
  price_index_divergence: 0.30, // 30% weight - most important
  spoofing: 0.25, // 25% weight
  wash_trading: 0.20, // 20% weight
  bot_coordination: 0.10, // 10% weight
  funding_anomaly: 0.10, // 10% weight
  correlation_break: 0.05, // 5% weight
};

/**
 * Convert spoofing events count to 0-100 score
 */
function spoofingToScore(events: number): number {
  if (events === 0) return 0;
  if (events < 5) return events * 10;
  if (events < 10) return 50 + (events - 5) * 6;
  return Math.min(80 + (events - 10) * 4, 100);
}

/**
 * Calculate composite integrity score
 *
 * @param signals - All fraud detection signals
 * @returns Integrity score (0-100) and risk level
 */
export function calculateIntegrityScore(signals: IntegritySignals): IntegrityScore {
  // Convert all signals to 0-100 penalty scores (higher = worse)
  const penalties = {
    divergence: signals.price_index_divergence,
    spoofing: spoofingToScore(signals.spoofing_events),
    washTrading: signals.wash_trading_probability * 100,
    botCoordination: signals.bot_coordination_detected ? 50 : 0,
    fundingAnomaly: signals.funding_anomaly_score,
    correlationBreak: signals.correlation_break_score,
  };

  // Calculate weighted penalty
  const totalPenalty =
    penalties.divergence * WEIGHTS.price_index_divergence +
    penalties.spoofing * WEIGHTS.spoofing +
    penalties.washTrading * WEIGHTS.wash_trading +
    penalties.botCoordination * WEIGHTS.bot_coordination +
    penalties.fundingAnomaly * WEIGHTS.funding_anomaly +
    penalties.correlationBreak * WEIGHTS.correlation_break;

  // Convert penalty to integrity score (invert: 100 - penalty)
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  // Determine risk level
  let risk_level: 'safe' | 'moderate' | 'high' | 'critical';
  if (score >= 80) {
    risk_level = 'safe';
  } else if (score >= 50) {
    risk_level = 'moderate';
  } else if (score >= 30) {
    risk_level = 'high';
  } else {
    risk_level = 'critical';
  }

  return {
    score: Math.round(score),
    signals,
    risk_level,
  };
}

/**
 * Generate human-readable explanation of score
 */
export function explainIntegrityScore(integrity: IntegrityScore): string {
  const { score, signals, risk_level } = integrity;

  const issues: string[] = [];

  if (signals.price_index_divergence > 30) {
    issues.push(`price-index divergence (${signals.price_index_divergence.toFixed(0)}%)`);
  }

  if (signals.spoofing_events > 0) {
    issues.push(`${signals.spoofing_events} spoofing events`);
  }

  if (signals.wash_trading_probability > 0.5) {
    issues.push(`wash trading (${(signals.wash_trading_probability * 100).toFixed(0)}% probability)`);
  }

  if (signals.bot_coordination_detected) {
    issues.push('bot coordination detected');
  }

  if (signals.funding_anomaly_score > 30) {
    issues.push('funding rate anomaly');
  }

  if (signals.correlation_break_score > 30) {
    issues.push('correlation break with related markets');
  }

  if (issues.length === 0) {
    return `Integrity Score: ${score}/100 (${risk_level.toUpperCase()}). No significant fraud signals detected. Market appears healthy.`;
  }

  return `Integrity Score: ${score}/100 (${risk_level.toUpperCase()}). Detected: ${issues.join(', ')}.`;
}

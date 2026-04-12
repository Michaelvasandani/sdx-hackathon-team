/**
 * Mock Time-Series Data Generator
 *
 * Generates realistic historical data for visualization charts
 */

interface IntegritySignals {
  price_index_divergence: number;
  spoofing_events: number;
  wash_trading_probability: number;
  bot_coordination_detected: boolean;
  funding_anomaly_score: number;
  correlation_break_score: number;
}

export interface IntegrityScorePoint {
  timestamp: string;
  time: string; // Human-readable time
  score: number;
  signals: IntegritySignals;
}

/**
 * Generate historical integrity score data points
 *
 * Creates a realistic time series that ends at the current score
 */
export function generateHistoricalScores(
  currentScore: number,
  currentSignals: IntegritySignals,
  hours: number = 24
): IntegrityScorePoint[] {
  const data: IntegrityScorePoint[] = [];
  const now = new Date();

  // Create a baseline "healthy" state to start from
  const healthyScore = Math.max(currentScore + 15, 85);

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const progress = (hours - i) / hours; // 0 to 1

    // Gradually transition from healthy to current state
    // Add some random walk behavior
    const randomWalk = Math.sin(i * 0.3) * 5 + (Math.random() - 0.5) * 3;
    const trendScore = healthyScore + (currentScore - healthyScore) * Math.pow(progress, 1.5) + randomWalk;
    const score = Math.max(0, Math.min(100, trendScore));

    // Interpolate signals
    const signals: IntegritySignals = {
      price_index_divergence: interpolateWithNoise(0, currentSignals.price_index_divergence, progress, 5),
      spoofing_events: Math.round(interpolateWithNoise(0, currentSignals.spoofing_events, progress, 1)),
      wash_trading_probability: interpolateWithNoise(0, currentSignals.wash_trading_probability, progress, 0.1),
      bot_coordination_detected: progress > 0.7 ? currentSignals.bot_coordination_detected : false,
      funding_anomaly_score: interpolateWithNoise(0, currentSignals.funding_anomaly_score, progress, 5),
      correlation_break_score: interpolateWithNoise(0, currentSignals.correlation_break_score, progress, 5),
    };

    data.push({
      timestamp: timestamp.toISOString(),
      time: formatTimeLabel(i),
      score: Math.round(score),
      signals,
    });
  }

  return data;
}

/**
 * Interpolate between two values with random noise
 */
function interpolateWithNoise(
  start: number,
  end: number,
  progress: number,
  noiseAmount: number
): number {
  const base = start + (end - start) * progress;
  const noise = (Math.random() - 0.5) * noiseAmount;
  return Math.max(0, base + noise);
}

/**
 * Format time label for chart
 */
function formatTimeLabel(hoursAgo: number): string {
  if (hoursAgo === 0) return 'Now';
  if (hoursAgo === 24) return '24h ago';
  if (hoursAgo === 12) return '12h ago';
  if (hoursAgo === 6) return '6h ago';
  if (hoursAgo % 6 === 0) return `${hoursAgo}h ago`;
  return '';
}

/**
 * Generate mock market comparison data
 */
export interface MarketComparison {
  ticker: string;
  name: string;
  score: number;
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  signals: IntegritySignals;
}

/**
 * Calculate score distribution
 */
export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export function calculateScoreDistribution(scores: number[]): ScoreDistribution[] {
  const total = scores.length;
  const ranges = [
    { range: '90-100', min: 90, max: 100 },
    { range: '80-89', min: 80, max: 89 },
    { range: '70-79', min: 70, max: 79 },
    { range: '60-69', min: 60, max: 69 },
    { range: '50-59', min: 50, max: 59 },
    { range: '40-49', min: 40, max: 49 },
    { range: '30-39', min: 30, max: 39 },
    { range: '0-29', min: 0, max: 29 },
  ];

  return ranges.map(({ range, min, max }) => {
    const count = scores.filter(s => s >= min && s <= max).length;
    return {
      range,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

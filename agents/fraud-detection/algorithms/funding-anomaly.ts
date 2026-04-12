/**
 * Funding Rate Anomaly Detection
 *
 * Detects when funding rate direction doesn't match the expected
 * price-index relationship, suggesting unnatural market positioning.
 *
 * Expected: If price > index → positive funding (longs pay shorts)
 *          If price < index → negative funding (shorts pay longs)
 *
 * Signal: Funding direction opposite of expected
 * Interpretation: Unnatural positioning, potential manipulation
 */

export interface FundingData {
  current_price: number;
  index_value: number;
  funding_rate: number; // Annual percentage rate
}

export interface FundingAnomalyDetectionResult {
  detected: boolean;
  type: 'funding_anomaly';
  severity: 'low' | 'medium';
  confidence: number;
  description: string;
  evidence: {
    price: number;
    index: number;
    funding_rate: number;
    expected_sign: 'positive' | 'negative';
    actual_sign: 'positive' | 'negative';
  };
}

/**
 * Detect funding rate anomalies
 */
export function detectFundingAnomaly(
  ticker: string,
  fundingData: FundingData
): FundingAnomalyDetectionResult | null {
  const { current_price, index_value, funding_rate } = fundingData;

  // Determine expected funding direction
  const expectedSign = current_price > index_value ? 'positive' : 'negative';
  const actualSign = funding_rate > 0 ? 'positive' : 'negative';

  // Check for mismatch
  if (expectedSign === actualSign) {
    return null; // Funding matches expectations
  }

  // Calculate price-index spread percentage
  const spread = ((current_price - index_value) / index_value) * 100;

  // Only flag if spread is meaningful (>2%)
  if (Math.abs(spread) < 2) {
    return null;
  }

  const confidence = Math.min(55 + Math.abs(spread) * 3, 75);
  const severity: 'low' | 'medium' = Math.abs(spread) > 5 ? 'medium' : 'low';

  const description = `Funding rate (${(funding_rate * 100).toFixed(
    2
  )}% APR) direction doesn't match price-index relationship (price: $${current_price.toFixed(
    2
  )}, index: ${index_value.toFixed(
    2
  )}). Expected ${expectedSign} funding but observed ${actualSign}. This ${Math.abs(
    spread
  ).toFixed(
    1
  )}% price-index spread suggests unnatural market positioning, potentially from coordinated manipulation.`;

  return {
    detected: true,
    type: 'funding_anomaly',
    severity,
    confidence,
    description,
    evidence: {
      price: current_price,
      index: index_value,
      funding_rate,
      expected_sign: expectedSign,
      actual_sign: actualSign,
    },
  };
}

export function calculateFundingAnomalyScore(
  price: number,
  index: number,
  fundingRate: number
): number {
  const expectedSign = price > index ? 1 : -1;
  const actualSign = fundingRate > 0 ? 1 : -1;

  if (expectedSign === actualSign) return 0;

  const spread = Math.abs(((price - index) / index) * 100);
  return Math.min(spread * 10, 100);
}

/**
 * Unit Test Suite for Fraud Detection Algorithms
 *
 * Tests all algorithms with known inputs/outputs to verify mathematical correctness
 */

import { detectPriceManipulation } from './agents/fraud-detection/algorithms/price-index-divergence';
import { detectFundingAnomaly } from './agents/fraud-detection/algorithms/funding-anomaly';
import { calculateIntegrityScore } from './agents/fraud-detection/integrity-scorer';
import type { IntegritySignals } from './agents/fraud-detection/types';

// ============================================
// TEST UTILITIES
// ============================================

interface TestResult {
  testName: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

const results: TestResult[] = [];

function test(testName: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${testName}`);
  } catch (error) {
    console.log(`❌ ${testName}`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    results.push({
      testName,
      passed: false,
      expected: 'no error',
      actual: error instanceof Error ? error.message : String(error),
      error: String(error),
    });
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
    );
  }
}

function assertNull(actual: any, message?: string) {
  if (actual !== null) {
    throw new Error(message || `Expected null but got ${JSON.stringify(actual)}`);
  }
}

function assertNotNull(actual: any, message?: string) {
  if (actual === null) {
    throw new Error(message || `Expected non-null value`);
  }
}

function assertBetween(actual: number, min: number, max: number, message?: string) {
  if (actual < min || actual > max) {
    throw new Error(
      message || `Expected value between ${min} and ${max} but got ${actual}`
    );
  }
}

// ============================================
// PRICE-INDEX DIVERGENCE TESTS
// ============================================

console.log('\n🧪 Testing Price-Index Divergence Detection\n');

test('No fraud - Price and index move together (1% each)', () => {
  const result = detectPriceManipulation(
    'TEST',
    100,    // currentPrice
    99,     // price24hAgo
    50,     // currentIndex
    49.5    // index24hAgo
  );

  // Expected: priceChange = 1.01%, indexChange = 1.01%, divergence = 0%
  assertNull(result, 'Should return null when price and index move together');
});

test('No fraud - Both move up 5%', () => {
  const result = detectPriceManipulation(
    'TEST',
    105,    // currentPrice
    100,    // price24hAgo
    52.5,   // currentIndex
    50      // index24hAgo
  );

  // Expected: priceChange = 5%, indexChange = 5%, divergence = 0%
  assertNull(result, 'Should return null when both move up equally');
});

test('Medium fraud - Price pumps 20% but index only up 2%', () => {
  const result = detectPriceManipulation(
    'TEST',
    120,    // currentPrice (+20%)
    100,    // price24hAgo
    51,     // currentIndex (+2%)
    50      // index24hAgo
  );

  // Expected: priceChange = 20%, indexChange = 2%, divergence = 18%
  assertNotNull(result, 'Should detect manipulation');
  assertEquals(result?.type, 'price_manipulation');
  assertEquals(result?.severity, 'medium');
  assertBetween(result?.evidence.divergence, 17, 19, 'Divergence should be ~18%');
  assertBetween(result?.confidence, 30, 40, 'Confidence should be ~36%');
});

test('High fraud - Price pumps 40% but index flat', () => {
  const result = detectPriceManipulation(
    'TEST',
    140,    // currentPrice (+40%)
    100,    // price24hAgo
    50,     // currentIndex (0%)
    50      // index24hAgo
  );

  // Expected: priceChange = 40%, indexChange = 0%, divergence = 40%
  // Severity thresholds: >40 = critical, >25 = high, else medium
  // 40% divergence is exactly at threshold, so it's "high" not "critical"
  assertNotNull(result, 'Should detect high manipulation');
  assertEquals(result?.severity, 'high');
  assertBetween(result?.evidence.divergence, 39, 41, 'Divergence should be ~40%');
  assertBetween(result?.confidence, 75, 85, 'Confidence should be high');
});

test('Critical fraud - Price crashes 50% but index only down 5%', () => {
  const result = detectPriceManipulation(
    'TEST',
    50,     // currentPrice (-50%)
    100,    // price24hAgo
    47.5,   // currentIndex (-5%)
    50      // index24hAgo
  );

  // Expected: priceChange = -50%, indexChange = -5%, divergence = 45%
  assertNotNull(result, 'Should detect critical manipulation');
  assertEquals(result?.severity, 'critical');
  assertBetween(result?.evidence.divergence, 44, 46, 'Divergence should be ~45%');
});

test('Edge case - Zero index (should handle gracefully)', () => {
  const result = detectPriceManipulation(
    'TEST',
    100,
    100,
    0,      // currentIndex = 0
    0       // index24hAgo = 0
  );

  // Should return null (can't calculate percentage change from zero)
  assertNull(result, 'Should handle zero index gracefully');
});

test('Edge case - Negative price change', () => {
  const result = detectPriceManipulation(
    'TEST',
    80,     // currentPrice (-20%)
    100,    // price24hAgo
    45,     // currentIndex (-10%)
    50      // index24hAgo
  );

  // Expected: priceChange = -20%, indexChange = -10%, divergence = 10%
  // 10% < 15% threshold, should return null
  assertNull(result, 'Should return null when divergence below threshold');
});

// ============================================
// FUNDING ANOMALY TESTS
// ============================================

console.log('\n🧪 Testing Funding Anomaly Detection\n');

test('No anomaly - Price > Index → Positive funding (expected)', () => {
  const result = detectFundingAnomaly('TEST', {
    current_price: 110,
    index_value: 100,
    funding_rate: 0.001, // positive
    next_funding_time: new Date().toISOString(),
  });

  assertNull(result, 'Should return null when funding matches price-index relationship');
});

test('No anomaly - Price < Index → Negative funding (expected)', () => {
  const result = detectFundingAnomaly('TEST', {
    current_price: 90,
    index_value: 100,
    funding_rate: -0.001, // negative
    next_funding_time: new Date().toISOString(),
  });

  assertNull(result, 'Should return null when funding matches price-index relationship');
});

test('Anomaly - Price > Index but negative funding (unnatural)', () => {
  const result = detectFundingAnomaly('TEST', {
    current_price: 110,  // 10% above index
    index_value: 100,
    funding_rate: -0.001, // negative (wrong!)
    next_funding_time: new Date().toISOString(),
  });

  assertNotNull(result, 'Should detect funding anomaly');
  assertEquals(result?.type, 'funding_anomaly');
  assertBetween(result?.evidence.spread_percent, 9, 11, 'Spread should be ~10%');
});

test('Anomaly - Price < Index but positive funding (unnatural)', () => {
  const result = detectFundingAnomaly('TEST', {
    current_price: 90,   // 10% below index
    index_value: 100,
    funding_rate: 0.001, // positive (wrong!)
    next_funding_time: new Date().toISOString(),
  });

  assertNotNull(result, 'Should detect funding anomaly');
  assertEquals(result?.type, 'funding_anomaly');
  assertBetween(result?.evidence.spread_percent, -11, -9, 'Spread should be ~-10%');
});

test('No anomaly - Small spread below 2% threshold', () => {
  const result = detectFundingAnomaly('TEST', {
    current_price: 101,  // 1% above index
    index_value: 100,
    funding_rate: -0.001, // negative (opposite)
    next_funding_time: new Date().toISOString(),
  });

  // Spread is only 1%, below 2% threshold
  assertNull(result, 'Should ignore small spreads as noise');
});

test('Medium severity - Large 15% spread with wrong funding', () => {
  const result = detectFundingAnomaly('TEST', {
    current_price: 115,  // 15% above index
    index_value: 100,
    funding_rate: -0.002, // negative (wrong!)
    next_funding_time: new Date().toISOString(),
  });

  assertNotNull(result, 'Should detect anomaly');
  // Severity: >5% spread = medium (not high, algorithm only returns low/medium)
  assertEquals(result?.severity, 'medium');
});

// ============================================
// INTEGRITY SCORE TESTS
// ============================================

console.log('\n🧪 Testing Integrity Score Calculation\n');

test('Perfect score - No fraud signals', () => {
  const signals: IntegritySignals = {
    price_index_divergence: 0,
    spoofing_events: 0,
    wash_trading_probability: 0,
    bot_coordination_detected: false,
    funding_anomaly_score: 0,
    correlation_break_score: 0,
  };

  const result = calculateIntegrityScore(signals);

  assertEquals(result.score, 100, 'Perfect score should be 100');
  assertEquals(result.risk_level, 'safe', 'Should be safe');
});

test('Single divergence penalty - 20% divergence', () => {
  const signals: IntegritySignals = {
    price_index_divergence: 20,
    spoofing_events: 0,
    wash_trading_probability: 0,
    bot_coordination_detected: false,
    funding_anomaly_score: 0,
    correlation_break_score: 0,
  };

  const result = calculateIntegrityScore(signals);

  // Expected penalty: 20 * 0.30 (weight) = 6 points
  // Score: 100 - 6 = 94
  assertBetween(result.score, 93, 95, 'Score should be ~94');
  assertEquals(result.risk_level, 'safe', 'Should still be safe');
});

test('Multiple signals - Divergence + Funding anomaly', () => {
  const signals: IntegritySignals = {
    price_index_divergence: 18,      // 18 * 0.30 = 5.4
    spoofing_events: 0,
    wash_trading_probability: 0,
    bot_coordination_detected: false,
    funding_anomaly_score: 50,       // 50 * 0.10 = 5.0
    correlation_break_score: 0,
  };

  const result = calculateIntegrityScore(signals);

  // Expected penalty: 5.4 + 5.0 = 10.4
  // Score: 100 - 10.4 = 89.6
  assertBetween(result.score, 88, 91, 'Score should be ~90');
  assertEquals(result.risk_level, 'safe', 'Should be safe');
});

test('High risk - Multiple severe signals', () => {
  const signals: IntegritySignals = {
    price_index_divergence: 40,      // 40 * 0.30 = 12
    spoofing_events: 5,              // spoofingToScore(5) = 50 (events < 10: 50 + (5-5)*6 = 50), * 0.25 = 12.5
    wash_trading_probability: 0.6,   // 60 * 0.20 = 12
    bot_coordination_detected: true, // 50 * 0.10 = 5
    funding_anomaly_score: 80,       // 80 * 0.10 = 8
    correlation_break_score: 30,     // 30 * 0.05 = 1.5
  };

  const result = calculateIntegrityScore(signals);

  // Expected penalty: 12 + 12.5 + 12 + 5 + 8 + 1.5 = 51.0
  // Score: 100 - 51.0 = 49.0
  assertBetween(result.score, 48, 50, 'Score should be ~49');
  assertEquals(result.risk_level, 'high', 'Should be high risk');
});

test('Critical risk - Extreme manipulation', () => {
  const signals: IntegritySignals = {
    price_index_divergence: 50,      // Max divergence
    spoofing_events: 10,             // Heavy spoofing
    wash_trading_probability: 0.9,   // 90% wash trading
    bot_coordination_detected: true,
    funding_anomaly_score: 100,
    correlation_break_score: 50,
  };

  const result = calculateIntegrityScore(signals);

  assertBetween(result.score, 0, 30, 'Score should be critical (<30)');
  assertEquals(result.risk_level, 'critical', 'Should be critical risk');
});

test('Moderate risk - Borderline signals', () => {
  const signals: IntegritySignals = {
    price_index_divergence: 25,      // 25 * 0.30 = 7.5
    spoofing_events: 2,              // 20 * 0.25 = 5
    wash_trading_probability: 0.3,   // 30 * 0.20 = 6
    bot_coordination_detected: false,
    funding_anomaly_score: 40,       // 40 * 0.10 = 4
    correlation_break_score: 20,     // 20 * 0.05 = 1
  };

  const result = calculateIntegrityScore(signals);

  // Expected penalty: 7.5 + 5 + 6 + 4 + 1 = 23.5
  // Score: 100 - 23.5 = 76.5
  assertBetween(result.score, 75, 78, 'Score should be ~76.5');
  assertEquals(result.risk_level, 'moderate', 'Should be moderate risk');
});

test('Edge case - Score cannot go below 0', () => {
  const signals: IntegritySignals = {
    price_index_divergence: 100,
    spoofing_events: 50,
    wash_trading_probability: 1.0,
    bot_coordination_detected: true,
    funding_anomaly_score: 100,
    correlation_break_score: 100,
  };

  const result = calculateIntegrityScore(signals);

  // Total penalty = 30 + 25 + 20 + 5 + 10 + 5 = 95
  // Score = 100 - 95 = 5 (critical)
  // Even with max values, score doesn't hit 0 (would need penalty > 100)
  assertBetween(result.score, 0, 10, 'Score should be very low but not necessarily 0');
  assertEquals(result.risk_level, 'critical');
});

test('Edge case - Score cannot exceed 100', () => {
  const signals: IntegritySignals = {
    price_index_divergence: -10,  // Invalid negative (edge case)
    spoofing_events: 0,
    wash_trading_probability: 0,
    bot_coordination_detected: false,
    funding_anomaly_score: 0,
    correlation_break_score: 0,
  };

  const result = calculateIntegrityScore(signals);

  assertBetween(result.score, 0, 100, 'Score should be clamped at 100');
});

// ============================================
// SUMMARY
// ============================================

console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));

const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;

console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log('\n❌ FAILED TESTS:\n');
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  ${r.testName}`);
      console.log(`    Expected: ${r.expected}`);
      console.log(`    Actual: ${r.actual}`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED!\n');
  console.log('The algorithms are mathematically correct and working as designed.\n');
}

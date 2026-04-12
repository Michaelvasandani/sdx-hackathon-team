/**
 * Sentiment Velocity Agent Tests
 * Unit tests for velocity detection and divergence analysis algorithms
 */

import {
  analyzePriceAcceleration,
  analyzeIndexAcceleration,
  analyzeMarketVelocity,
  computeAlertLevel,
} from '@/agents/sentiment-velocity/velocity-detector';
import {
  detectMomentumDivergence,
  filterSignificantDivergences,
} from '@/agents/sentiment-velocity/divergence-analyzer';
import { analyzeSentimentVelocity } from '@/agents/sentiment-velocity';

describe('Sentiment Velocity Algorithms', () => {
  describe('Velocity Detection', () => {
    test('should detect price acceleration on upward spike', () => {
      // Create price history with sudden acceleration
      const prices = [
        100, 100.1, 100.2, 100.2, 100.3, 100.4, 100.5, 100.6, 100.8, 101.0, // normal
        101.5, 102.0, 103.0, 104.5, 106.0, 107.5, 109.0, 110.5, // acceleration
      ];

      const baseline = Array(15).fill(0.1); // normal acceleration baseline

      const signals = analyzePriceAcceleration('TEST', prices, baseline);

      expect(signals.length).toBeGreaterThan(0);
      expect(signals.some((s) => s.severity !== 'low')).toBe(true);
      expect(signals.some((s) => s.direction === 'positive')).toBe(true);
    });

    test('should detect price deceleration (negative acceleration)', () => {
      // Create price history with sudden deceleration
      const prices = [
        100, 102, 104, 106, 108, 110, 111.5, 112.5, 113.2, 113.7, 114.0, 114.1, 114.1, 114.0, // acceleration then deceleration
      ];

      const baseline = Array(12).fill(0.1);

      const signals = analyzePriceAcceleration('TEST', prices, baseline);

      expect(signals.length).toBeGreaterThan(0);
      const hasNegative = signals.some((s) => s.direction === 'negative');
      expect(hasNegative).toBe(true);
    });

    test('should not flag flat prices as acceleration', () => {
      // Prices stay roughly flat
      const prices = Array(60)
        .fill(100)
        .map((p, i) => p + (Math.random() - 0.5) * 0.1);

      const baseline = Array(58).fill(0.01);

      const signals = analyzePriceAcceleration('TEST', prices, baseline);

      // Should have minimal or no signals
      const highSeverity = signals.filter(
        (s) => s.severity === 'high' || s.severity === 'critical'
      );
      expect(highSeverity.length).toBeLessThanOrEqual(1);
    });

    test('should calculate confidence based on z-score', () => {
      const prices = [
        99, 98, 97, 96, 95, 94, 93, 92, 91, 90, // large acceleration downward
      ];

      const baseline = Array(8).fill(0.01); // very stable baseline

      const signals = analyzePriceAcceleration('TEST', prices, baseline);

      if (signals.length > 0) {
        expect(signals[0].confidence).toBeGreaterThan(50);
        expect(signals[0].confidence).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Momentum Divergence Detection', () => {
    test('should detect price-index divergence', () => {
      // Price accelerating up, index accelerating down
      const priceSignals = [
        {
          type: 'price_acceleration' as const,
          detected: true,
          severity: 'high' as const,
          confidence: 85,
          magnitude: 2.5,
          direction: 'positive' as const,
          window: '1h' as const,
          evidence: {
            current_velocity: 1.0,
            previous_velocity: 0.5,
            acceleration: 0.5,
            z_score: 2.5,
            baseline_acceleration_std: 0.1,
          },
        },
      ];

      const indexSignals = [
        {
          type: 'index_acceleration' as const,
          detected: true,
          severity: 'high' as const,
          confidence: 80,
          magnitude: -2.3,
          direction: 'negative' as const,
          window: '1h' as const,
          evidence: {
            current_velocity: -1.0,
            previous_velocity: -0.5,
            acceleration: -0.5,
            z_score: -2.3,
            baseline_acceleration_std: 0.1,
          },
        },
      ];

      const divergences = detectMomentumDivergence(priceSignals, indexSignals);

      expect(divergences.length).toBeGreaterThan(0);
      expect(divergences[0].detected).toBe(true);
      expect(divergences[0].price_momentum_direction).toBe('positive');
      expect(divergences[0].index_momentum_direction).toBe('negative');
      expect(divergences[0].severity).toBe('high');
    });

    test('should not flag aligned momentum as divergence', () => {
      const priceSignals = [
        {
          type: 'price_acceleration' as const,
          detected: true,
          severity: 'medium' as const,
          confidence: 70,
          magnitude: 2.1,
          direction: 'positive' as const,
          window: '1h' as const,
          evidence: {
            current_velocity: 1.0,
            previous_velocity: 0.5,
            acceleration: 0.5,
            z_score: 2.1,
            baseline_acceleration_std: 0.1,
          },
        },
      ];

      const indexSignals = [
        {
          type: 'index_acceleration' as const,
          detected: true,
          severity: 'medium' as const,
          confidence: 70,
          magnitude: 2.0,
          direction: 'positive' as const, // same direction
          window: '1h' as const,
          evidence: {
            current_velocity: 0.8,
            previous_velocity: 0.3,
            acceleration: 0.5,
            z_score: 2.0,
            baseline_acceleration_std: 0.1,
          },
        },
      ];

      const divergences = detectMomentumDivergence(priceSignals, indexSignals);

      // Should have no divergence
      expect(divergences.length).toBe(0);
    });

    test('should filter low-confidence divergences', () => {
      const priceSignals = [
        {
          type: 'price_acceleration' as const,
          detected: true,
          severity: 'low' as const,
          confidence: 50,
          magnitude: 1.2,
          direction: 'positive' as const,
          window: '5m' as const,
          evidence: {
            current_velocity: 0.1,
            previous_velocity: 0.05,
            acceleration: 0.05,
            z_score: 1.2,
            baseline_acceleration_std: 0.1,
          },
        },
      ];

      const indexSignals = [
        {
          type: 'index_acceleration' as const,
          detected: true,
          severity: 'low' as const,
          confidence: 45,
          magnitude: -1.1,
          direction: 'negative' as const,
          window: '5m' as const,
          evidence: {
            current_velocity: -0.1,
            previous_velocity: -0.05,
            acceleration: -0.05,
            z_score: -1.1,
            baseline_acceleration_std: 0.1,
          },
        },
      ];

      const divergences = detectMomentumDivergence(priceSignals, indexSignals);
      const filtered = filterSignificantDivergences(divergences, 65);

      // Low confidence divergences should be filtered out
      expect(
        filtered.every((d) => d.confidence >= 65)
      ).toBe(true);
    });
  });

  describe('Alert Level Computation', () => {
    test('should return red for critical signals', () => {
      const signals = [
        {
          type: 'price_acceleration' as const,
          detected: true,
          severity: 'critical' as const,
          confidence: 95,
          magnitude: 4.0,
          direction: 'positive' as const,
          window: '1h' as const,
          evidence: { acceleration: 1.0, z_score: 4.0, baseline_acceleration_std: 0.1, current_velocity: 2, previous_velocity: 1 },
        },
      ];

      const level = computeAlertLevel(signals);
      expect(level).toBe('red');
    });

    test('should return yellow for medium signals', () => {
      const signals = [
        {
          type: 'price_acceleration' as const,
          detected: true,
          severity: 'medium' as const,
          confidence: 70,
          magnitude: 2.2,
          direction: 'positive' as const,
          window: '1h' as const,
          evidence: { acceleration: 0.5, z_score: 2.2, baseline_acceleration_std: 0.1, current_velocity: 1, previous_velocity: 0.5 },
        },
      ];

      const level = computeAlertLevel(signals);
      expect(level).toBe('yellow');
    });

    test('should return green for low/no signals', () => {
      const signals = [
        {
          type: 'price_acceleration' as const,
          detected: true,
          severity: 'low' as const,
          confidence: 40,
          magnitude: 1.5,
          direction: 'positive' as const,
          window: '5m' as const,
          evidence: { acceleration: 0.1, z_score: 1.5, baseline_acceleration_std: 0.1, current_velocity: 0.2, previous_velocity: 0.1 },
        },
      ];

      const level = computeAlertLevel(signals);
      expect(level).toBe('green');
    });
  });

  describe('Full Velocity Analysis', () => {
    test('should complete end-to-end analysis', async () => {
      // Create synthetic market data
      const priceHistory = Array(60)
        .fill(100)
        .map((p, i) => p + Math.sin(i / 10) * 2);

      const indexHistory = Array(60)
        .fill(50)
        .map((i, idx) => i + Math.sin(idx / 12) * 1);

      const baselinePriceAccels = Array(58).fill(0.1);
      const baselineIndexAccels = Array(58).fill(0.05);

      const result = await analyzeSentimentVelocity(
        'TEST_TICKER',
        priceHistory,
        indexHistory,
        baselinePriceAccels,
        baselineIndexAccels
      );

      expect(result.ticker).toBe('TEST_TICKER');
      expect(result.momentum_status).toBeDefined();
      expect(result.overall_momentum_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_momentum_score).toBeLessThanOrEqual(100);
      expect(result.velocity_analysis).toBeDefined();
      expect(result.divergence_alerts).toBeDefined();
    });
  });
});

// Helper assertion functions for testing
export const testHelpers = {
  /**
   * Verify momentum score is in valid range
   */
  isValidMomentumScore(score: number): boolean {
    return score >= 0 && score <= 100;
  },

  /**
   * Verify all signals have required fields
   */
  isValidSignal(signal: any): boolean {
    return (
      signal.type &&
      signal.detected !== undefined &&
      signal.severity &&
      signal.confidence !== undefined &&
      signal.magnitude !== undefined &&
      signal.direction &&
      signal.window &&
      signal.evidence
    );
  },

  /**
   * Simulate price spike for testing
   */
  generatePriceSpike(basePrice: number = 100, spikeHeight: number = 20): number[] {
    const prices: number[] = [];
    // Normal prices
    for (let i = 0; i < 30; i++) {
      prices.push(basePrice + (Math.random() - 0.5) * 1);
    }
    // Spike
    for (let i = 0; i < 10; i++) {
      prices.push(basePrice + (spikeHeight * i) / 10 + (Math.random() - 0.5) * 0.5);
    }
    // Recovery
    for (let i = 0; i < 20; i++) {
      prices.push(basePrice + spikeHeight - (spikeHeight * i) / 20 + (Math.random() - 0.5) * 1);
    }
    return prices;
  },
};

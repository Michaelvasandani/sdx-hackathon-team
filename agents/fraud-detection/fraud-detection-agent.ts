/**
 * Main Fraud Detection Agent
 *
 * Orchestrates all fraud detection algorithms and generates integrity scores
 */

import { fetchAllMarketsData, MarketAnalysisData, calculatePrice24hAgo, calculateIndex24hAgo } from './data-fetcher';
import { detectPriceManipulation } from './algorithms/price-index-divergence';
import { detectFundingAnomaly } from './algorithms/funding-anomaly';
import { calculateIntegrityScore, IntegritySignals, IntegrityScore } from './integrity-scorer';
import { storeIntegrityScore, storeFraudAlert } from '../../lib/supabase/queries';

// ============================================
// TYPES
// ============================================

export interface FraudDetectionResult {
  ticker: string;
  name: string;
  category: string;
  integrityScore: IntegrityScore;
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
  }>;
  timestamp: Date;
}

export interface FraudDetectionSummary {
  totalMarkets: number;
  safeMarkets: number; // 80-100
  moderateRisk: number; // 50-79
  highRisk: number; // 30-49
  criticalRisk: number; // 0-29
  totalAlerts: number;
  results: FraudDetectionResult[];
}

// ============================================
// MAIN FRAUD DETECTION
// ============================================

/**
 * Run fraud detection on a single market
 */
export async function analyzeSingleMarket(
  marketData: MarketAnalysisData
): Promise<FraudDetectionResult> {
  const alerts: FraudDetectionResult['alerts'] = [];
  const signals: IntegritySignals = {
    price_index_divergence: 0,
    spoofing_events: 0,
    wash_trading_probability: 0,
    bot_coordination_detected: false,
    funding_anomaly_score: 0,
    correlation_break_score: 0,
  };

  // ============================================
  // ALGORITHM 1: Price-Index Divergence
  // ============================================
  try {
    const price24hAgo = calculatePrice24hAgo(
      marketData.currentPrice,
      marketData.priceChange24h
    );
    const index24hAgo = calculateIndex24hAgo(
      marketData.currentIndex,
      marketData.indexChange24h
    );

    const divergenceResult = detectPriceManipulation(
      marketData.ticker,
      marketData.currentPrice,
      price24hAgo,
      marketData.currentIndex,
      index24hAgo
    );

    if (divergenceResult) {
      alerts.push({
        type: 'price_manipulation',
        severity: divergenceResult.severity,
        confidence: divergenceResult.confidence,
        description: divergenceResult.description,
      });
      signals.price_index_divergence = divergenceResult.evidence.divergence;
    }
  } catch (error) {
    console.error(`Error in price-index divergence for ${marketData.ticker}:`, error);
  }

  // ============================================
  // ALGORITHM 5: Funding Rate Anomaly
  // ============================================
  try {
    const fundingResult = detectFundingAnomaly(marketData.ticker, {
      current_price: marketData.currentPrice,
      index_value: marketData.currentIndex,
      funding_rate: marketData.currentFundingRate,
    });

    if (fundingResult) {
      alerts.push({
        type: 'funding_anomaly',
        severity: fundingResult.severity,
        confidence: fundingResult.confidence,
        description: fundingResult.description,
      });

      const spread = Math.abs(
        ((marketData.currentPrice - marketData.currentIndex) / marketData.currentIndex) * 100
      );
      signals.funding_anomaly_score = Math.min(spread * 10, 100);
    }
  } catch (error) {
    console.error(`Error in funding anomaly for ${marketData.ticker}:`, error);
  }

  // ============================================
  // TODO: Add more algorithms when endpoints available
  // ============================================
  // - Order Book Spoofing (needs /orderbook/{ticker})
  // - Wash Trading (needs /trades/{ticker})
  // - Bot Coordination (needs /orderbook/{ticker})
  // - Correlation Break (needs historical price data)

  // ============================================
  // Calculate Integrity Score
  // ============================================
  const integrityScore = calculateIntegrityScore(signals);

  return {
    ticker: marketData.ticker,
    name: marketData.name,
    category: marketData.category,
    integrityScore,
    alerts,
    timestamp: new Date(),
  };
}

/**
 * Run fraud detection on all markets
 */
export async function analyzeAllMarkets(): Promise<FraudDetectionSummary> {
  console.log('🔍 Fetching market data from Forum API...');
  const marketsData = await fetchAllMarketsData();
  console.log(`📊 Found ${marketsData.length} live markets to analyze\n`);

  const results: FraudDetectionResult[] = [];
  let totalAlerts = 0;

  // Analyze each market
  for (const marketData of marketsData) {
    const result = await analyzeSingleMarket(marketData);
    results.push(result);
    totalAlerts += result.alerts.length;

    // Print progress
    const emoji =
      result.integrityScore.score >= 80 ? '✅' :
      result.integrityScore.score >= 50 ? '⚠️ ' :
      result.integrityScore.score >= 30 ? '🔴' : '🚨';

    console.log(
      `${emoji} ${result.ticker.padEnd(15)} Score: ${result.integrityScore.score}/100  Alerts: ${result.alerts.length}`
    );
  }

  // Calculate summary stats
  const safeMarkets = results.filter((r) => r.integrityScore.score >= 80).length;
  const moderateRisk = results.filter(
    (r) => r.integrityScore.score >= 50 && r.integrityScore.score < 80
  ).length;
  const highRisk = results.filter(
    (r) => r.integrityScore.score >= 30 && r.integrityScore.score < 50
  ).length;
  const criticalRisk = results.filter((r) => r.integrityScore.score < 30).length;

  return {
    totalMarkets: marketsData.length,
    safeMarkets,
    moderateRisk,
    highRisk,
    criticalRisk,
    totalAlerts,
    results,
  };
}

/**
 * Store fraud detection results to Supabase
 */
export async function storeResults(summary: FraudDetectionSummary): Promise<void> {
  console.log('\n💾 Storing results to Supabase...');

  let storedScores = 0;
  let storedAlerts = 0;

  for (const result of summary.results) {
    try {
      // Store integrity score
      await storeIntegrityScore(result.ticker, result.integrityScore.score, {
        price_index_divergence: result.integrityScore.signals.price_index_divergence,
        spoofing_events: result.integrityScore.signals.spoofing_events,
        wash_trading_probability: result.integrityScore.signals.wash_trading_probability,
        bot_coordination_detected: result.integrityScore.signals.bot_coordination_detected,
        funding_anomaly_score: result.integrityScore.signals.funding_anomaly_score,
        correlation_break_score: result.integrityScore.signals.correlation_break_score,
      });
      storedScores++;

      // Store each alert
      for (const alert of result.alerts) {
        await storeFraudAlert(
          result.ticker,
          alert.type,
          alert.severity,
          alert.confidence,
          alert.description,
          { timestamp: result.timestamp.toISOString() }
        );
        storedAlerts++;
      }
    } catch (error) {
      console.error(`Error storing results for ${result.ticker}:`, error);
    }
  }

  console.log(`✅ Stored ${storedScores} integrity scores`);
  console.log(`✅ Stored ${storedAlerts} fraud alerts`);
}

/**
 * Main entry point: Run full fraud detection and store results
 */
export async function runFraudDetection(): Promise<FraudDetectionSummary> {
  const startTime = Date.now();

  const summary = await analyzeAllMarkets();
  await storeResults(summary);

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log('📊 FRAUD DETECTION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Markets Analyzed: ${summary.totalMarkets}`);
  console.log(`Safe (80-100):          ${summary.safeMarkets} 🟢`);
  console.log(`Moderate Risk (50-79):  ${summary.moderateRisk} 🟡`);
  console.log(`High Risk (30-49):      ${summary.highRisk} 🔴`);
  console.log(`Critical Risk (0-29):   ${summary.criticalRisk} 🚨`);
  console.log(`Total Alerts Generated: ${summary.totalAlerts}`);
  console.log(`Time Elapsed:           ${elapsedTime}s`);
  console.log('='.repeat(50) + '\n');

  return summary;
}

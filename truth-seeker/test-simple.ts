/**
 * Simple Fraud Detection Test
 * Tests algorithms directly without Supabase
 */

import { forumAPI } from './lib/forum-api/client';
import { detectPriceManipulation } from './agents/fraud-detection/algorithms/price-index-divergence';
import { detectFundingAnomaly } from './agents/fraud-detection/algorithms/funding-anomaly';
import { calculateIntegrityScore } from './agents/fraud-detection/integrity-scorer';

async function main() {
  console.log('🚀 Truth Seeker - Simple Fraud Detection Test\n');

  console.log('🔍 Fetching markets from Forum API...');
  const markets = await forumAPI.listAllMarkets();
  const liveMarkets = markets.filter(m => m.live);
  console.log(`📊 Found ${liveMarkets.length} live markets\n`);

  const results = [];

  for (const market of liveMarkets) {
    const alerts = [];
    const signals = {
      price_index_divergence: 0,
      spoofing_events: 0,
      wash_trading_probability: 0,
      bot_coordination_detected: false,
      funding_anomaly_score: 0,
      correlation_break_score: 0,
    };

    // Test Algorithm 1: Price-Index Divergence
    const priceChange = market.changePercentPastDay * 100;
    const indexChange = market.changeIndexPercentPastDay * 100;

    const price24hAgo = market.lastPrice / (1 + market.changePercentPastDay);
    const index24hAgo = market.lastIndexValue / (1 + market.changeIndexPercentPastDay);

    const divResult = detectPriceManipulation(
      market.ticker,
      market.lastPrice,
      price24hAgo,
      market.lastIndexValue,
      index24hAgo
    );

    if (divResult) {
      alerts.push(divResult);
      signals.price_index_divergence = divResult.evidence.divergence;
    }

    // Test Algorithm 2: Funding Anomaly
    const fundResult = detectFundingAnomaly(market.ticker, {
      current_price: market.lastPrice,
      index_value: market.lastIndexValue,
      funding_rate: market.movingFundingRate,
    });

    if (fundResult) {
      alerts.push(fundResult);
      const spread = Math.abs(((market.lastPrice - market.lastIndexValue) / market.lastIndexValue) * 100);
      signals.funding_anomaly_score = Math.min(spread * 10, 100);
    }

    // Calculate integrity score
    const integrityScore = calculateIntegrityScore(signals);

    results.push({
      ticker: market.ticker,
      name: market.name,
      score: integrityScore.score,
      riskLevel: integrityScore.risk_level,
      alerts: alerts.length,
    });

    // Print progress
    const emoji =
      integrityScore.score >= 80 ? '✅' :
      integrityScore.score >= 50 ? '⚠️ ' :
      integrityScore.score >= 30 ? '🔴' : '🚨';

    console.log(
      `${emoji} ${market.ticker.padEnd(15)} Score: ${integrityScore.score}/100  Alerts: ${alerts.length}`
    );
  }

  // Summary
  const safe = results.filter(r => r.score >= 80).length;
  const moderate = results.filter(r => r.score >= 50 && r.score < 80).length;
  const high = results.filter(r => r.score >= 30 && r.score < 50).length;
  const critical = results.filter(r => r.score < 30).length;

  console.log('\n' + '='.repeat(50));
  console.log('📊 FRAUD DETECTION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Markets:        ${liveMarkets.length}`);
  console.log(`Safe (80-100):        ${safe} 🟢`);
  console.log(`Moderate (50-79):     ${moderate} 🟡`);
  console.log(`High Risk (30-49):    ${high} 🔴`);
  console.log(`Critical (0-29):      ${critical} 🚨`);
  console.log('='.repeat(50) + '\n');

  // Show risky markets
  const risky = results.filter(r => r.score < 70).sort((a, b) => a.score - b.score).slice(0, 5);
  if (risky.length > 0) {
    console.log('⚠️  Markets with Fraud Signals:\n');
    risky.forEach(r => {
      console.log(`  ${r.ticker} (${r.name})`);
      console.log(`  Score: ${r.score}/100 (${r.riskLevel.toUpperCase()}), Alerts: ${r.alerts}\n`);
    });
  }

  console.log('✅ Test completed!\n');
}

main().catch(console.error);

/**
 * Fraud Detection Test Runner (No Database Save)
 *
 * Run this to test fraud detection without saving to Supabase
 *
 * Usage: npx tsx test-fraud-detection-nosave.ts
 */

import { fetchAllMarketsData } from './agents/fraud-detection/data-fetcher';
import { analyzeSingleMarket } from './agents/fraud-detection/fraud-detection-agent';

async function main() {
  console.log('🚀 Truth Seeker - Fraud Detection Test (No Database)\n');

  try {
    console.log('🔍 Fetching market data from Forum API...');
    const marketsData = await fetchAllMarketsData();
    console.log(`📊 Found ${marketsData.length} live markets to analyze\n`);

    const results = [];
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

    console.log('\n' + '='.repeat(50));
    console.log('📊 FRAUD DETECTION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Markets Analyzed: ${marketsData.length}`);
    console.log(`Safe (80-100):          ${safeMarkets} 🟢`);
    console.log(`Moderate Risk (50-79):  ${moderateRisk} 🟡`);
    console.log(`High Risk (30-49):      ${highRisk} 🔴`);
    console.log(`Critical Risk (0-29):   ${criticalRisk} 🚨`);
    console.log(`Total Alerts Generated: ${totalAlerts}`);
    console.log('='.repeat(50) + '\n');

    // Show some interesting examples
    console.log('🔍 Interesting Cases:\n');

    // Show highest risk markets
    const risky = results
      .filter((r) => r.integrityScore.score < 70)
      .sort((a, b) => a.integrityScore.score - b.integrityScore.score)
      .slice(0, 5);

    if (risky.length > 0) {
      console.log('⚠️  Markets with Fraud Signals:');
      for (const market of risky) {
        console.log(`\n  ${market.ticker} (${market.name}) - ${market.category}`);
        console.log(`  Integrity Score: ${market.integrityScore.score}/100 (${market.integrityScore.risk_level.toUpperCase()})`);
        if (market.alerts.length > 0) {
          console.log(`  Alerts:`);
          for (const alert of market.alerts) {
            console.log(`    - ${alert.type} (${alert.severity}, ${alert.confidence}% confidence):`);
            console.log(`      ${alert.description.substring(0, 120)}...`);
          }
        }
      }
    }

    // Show cleanest markets
    const clean = results
      .filter((r) => r.integrityScore.score >= 90)
      .sort((a, b) => b.integrityScore.score - a.integrityScore.score)
      .slice(0, 3);

    if (clean.length > 0) {
      console.log('\n\n✅ Cleanest Markets (High Integrity):');
      for (const market of clean) {
        console.log(`  ${market.ticker} (${market.name}) - Score: ${market.integrityScore.score}/100`);
      }
    }

    console.log('\n✅ Test completed successfully!\n');
    console.log('💡 To save results to Supabase, update .env.local with your Supabase credentials\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error running fraud detection:', error);
    process.exit(1);
  }
}

main();

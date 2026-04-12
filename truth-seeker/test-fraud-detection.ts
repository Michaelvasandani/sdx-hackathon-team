/**
 * Fraud Detection Test Runner
 *
 * Run this to test the fraud detection system on real Forum markets
 *
 * Usage: npx tsx test-fraud-detection.ts
 */

import { runFraudDetection } from './agents/fraud-detection/fraud-detection-agent';

async function main() {
  console.log('🚀 Truth Seeker - Fraud Detection Test\n');

  try {
    const summary = await runFraudDetection();

    // Show some interesting examples
    console.log('\n🔍 Interesting Cases:\n');

    // Show highest risk markets
    const risky = summary.results
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
            console.log(`    - ${alert.type}: ${alert.description.substring(0, 100)}...`);
          }
        }
      }
    }

    // Show cleanest markets
    const clean = summary.results
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
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error running fraud detection:', error);
    process.exit(1);
  }
}

main();

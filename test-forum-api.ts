/**
 * Forum API Connection Test
 *
 * Run this to verify Forum API is accessible and returning data
 *
 * Usage: npx tsx test-forum-api.ts
 */

import { forumAPI } from './lib/forum-api/client';

async function testForumAPI() {
  console.log('🔍 Testing Forum API Connection...\n');

  try {
    // Test 1: List all markets
    console.log('📊 Test 1: Fetching all markets...');
    const markets = await forumAPI.listAllMarkets();
    console.log(`✅ Success! Found ${markets.length} markets`);

    if (markets.length > 0) {
      console.log('\nFirst 3 markets:');
      markets.slice(0, 3).forEach((market, i) => {
        console.log(`  ${i + 1}. ${market.ticker} (${market.name})`);
        console.log(`     Price: $${market.last_price}, Index: ${market.index_value}`);
      });
    }

    // Test 2: Get specific market details (if markets exist)
    if (markets.length > 0) {
      const testTicker = markets[0].ticker;
      console.log(`\n📈 Test 2: Fetching details for ${testTicker}...`);
      const marketDetails = await forumAPI.getMarket(testTicker);
      console.log('✅ Success!');
      console.log(`   Ticker: ${marketDetails.ticker}`);
      console.log(`   Price: $${marketDetails.last_price}`);
      console.log(`   Index: ${marketDetails.index_value}`);
      console.log(`   24h Volume: ${marketDetails.volume_24h}`);
      console.log(`   Funding Rate: ${marketDetails.funding_rate}%`);

      // Test 3: Get order book
      console.log(`\n📖 Test 3: Fetching order book for ${testTicker}...`);
      try {
        const orderBook = await forumAPI.getOrderBook(testTicker);
        console.log('✅ Success!');
        console.log(`   Bids: ${orderBook.bids.length} orders`);
        console.log(`   Asks: ${orderBook.asks.length} orders`);
        if (orderBook.bids.length > 0) {
          console.log(`   Best Bid: $${orderBook.bids[0].price} (${orderBook.bids[0].size} contracts)`);
        }
        if (orderBook.asks.length > 0) {
          console.log(`   Best Ask: $${orderBook.asks[0].price} (${orderBook.asks[0].size} contracts)`);
        }
      } catch (error) {
        console.log('⚠️  Order book endpoint not available or different format');
      }

      // Test 4: Get recent trades
      console.log(`\n💱 Test 4: Fetching recent trades for ${testTicker}...`);
      try {
        const trades = await forumAPI.getRecentTrades(testTicker, 5);
        console.log(`✅ Success! Found ${trades.length} recent trades`);
        if (trades.length > 0) {
          console.log('\n   Latest trade:');
          console.log(`   Price: $${trades[0].price}`);
          console.log(`   Size: ${trades[0].size} contracts`);
          console.log(`   Side: ${trades[0].side}`);
        }
      } catch (error) {
        console.log('⚠️  Trades endpoint not available or different format');
      }

      // Test 5: Get index details
      console.log(`\n📊 Test 5: Fetching index details for ${testTicker}...`);
      try {
        const indexDetails = await forumAPI.getIndexDetails(testTicker);
        console.log('✅ Success!');
        console.log(`   Index Value: ${indexDetails.index_value}`);
        if (indexDetails.source_breakdown) {
          console.log('   Source Breakdown:');
          Object.entries(indexDetails.source_breakdown).forEach(([source, value]) => {
            console.log(`     ${source}: ${value}`);
          });
        }
      } catch (error) {
        console.log('⚠️  Index details endpoint not available or different format');
      }

      // Test 6: Get funding rate
      console.log(`\n💰 Test 6: Fetching funding rate for ${testTicker}...`);
      try {
        const funding = await forumAPI.getCurrentFundingRate(testTicker);
        console.log('✅ Success!');
        console.log(`   Current Rate: ${funding.current_rate}%`);
        console.log(`   Next Rate Estimate: ${funding.next_rate_estimate}%`);
        console.log(`   Next Funding Time: ${funding.next_funding_time}`);
      } catch (error) {
        console.log('⚠️  Funding rate endpoint not available or different format');
      }
    }

    console.log('\n✅ Forum API connection test completed!\n');

  } catch (error) {
    console.error('\n❌ Forum API Error:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }

    console.log('\n💡 Troubleshooting:');
    console.log('1. Check that FORUM_API_BASE_URL is correct in .env.local');
    console.log('2. Verify Forum API is accessible from your network');
    console.log('3. Check forum_api.md for correct endpoint formats');

    process.exit(1);
  }
}

// Run the test
testForumAPI();

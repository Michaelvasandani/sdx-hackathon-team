import { forumAPI } from './lib/forum-api/client';

async function debug() {
  const markets = await forumAPI.listAllMarkets();
  console.log('Total markets:', markets.length);
  console.log('\nFirst market:');
  console.log(JSON.stringify(markets[0], null, 2));

  console.log('\nAll market tickers:');
  markets.forEach((m: any) => console.log(`- ${m.ticker}`));
}

debug();

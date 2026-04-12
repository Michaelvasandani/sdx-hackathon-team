/**
 * Data Fetcher for Fraud Detection
 *
 * Fetches and prepares market data from Forum API for fraud detection algorithms
 */

import { forumAPI, ForumMarket } from '../../lib/forum-api/client';

// ============================================
// TYPES
// ============================================

export interface MarketAnalysisData {
  ticker: string;
  name: string;
  category: string;

  // Current values
  currentPrice: number;
  currentIndex: number;
  currentFundingRate: number;

  // 24-hour changes
  priceChange24h: number; // Percentage
  indexChange24h: number; // Percentage

  // Order book (if available)
  bestBid: number;
  bestAsk: number;

  // Volume and activity
  volume24h: number;
  openInterest: number;

  // Raw market data (for reference)
  rawData: ForumMarket;
}

// ============================================
// FETCH MARKET DATA
// ============================================

/**
 * Fetch and prepare data for a single market
 */
export async function fetchMarketData(ticker: string): Promise<MarketAnalysisData | null> {
  try {
    const markets = await forumAPI.listAllMarkets();
    const market = markets.find((m) => m.ticker === ticker);

    if (!market) {
      console.warn(`Market ${ticker} not found`);
      return null;
    }

    return prepareMarketData(market);
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch and prepare data for all markets
 */
export async function fetchAllMarketsData(): Promise<MarketAnalysisData[]> {
  try {
    const markets = await forumAPI.listAllMarkets();
    return markets
      .filter((m) => m.live) // Only analyze live markets
      .map((m) => prepareMarketData(m));
  } catch (error) {
    console.error('Error fetching all markets:', error);
    return [];
  }
}

/**
 * Prepare market data for analysis
 */
function prepareMarketData(market: ForumMarket): MarketAnalysisData {
  return {
    ticker: market.ticker,
    name: market.name,
    category: market.category || 'unknown',

    // Current values
    currentPrice: market.lastPrice,
    currentIndex: market.lastIndexValue,
    currentFundingRate: market.movingFundingRate,

    // 24-hour changes (already calculated by Forum API)
    priceChange24h: market.changePercentPastDay * 100, // Convert to percentage
    indexChange24h: market.changeIndexPercentPastDay * 100, // Convert to percentage

    // Order book
    bestBid: market.bestBid,
    bestAsk: market.bestAsk,

    // Volume and activity
    volume24h: market.volumePastDay,
    openInterest: market.openInterest,

    // Keep raw data for reference
    rawData: market,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Group markets by category for correlation analysis
 */
export function groupMarketsByCategory(
  markets: MarketAnalysisData[]
): Map<string, MarketAnalysisData[]> {
  const grouped = new Map<string, MarketAnalysisData[]>();

  for (const market of markets) {
    const category = market.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(market);
  }

  return grouped;
}

/**
 * Find related markets (same category)
 */
export function findRelatedMarkets(
  ticker: string,
  allMarkets: MarketAnalysisData[]
): MarketAnalysisData[] {
  const market = allMarkets.find((m) => m.ticker === ticker);
  if (!market) return [];

  return allMarkets.filter(
    (m) => m.category === market.category && m.ticker !== ticker
  );
}

/**
 * Calculate price 24h ago
 */
export function calculatePrice24hAgo(
  currentPrice: number,
  changePercent: number
): number {
  // changePercent = ((current - old) / old) * 100
  // Solving for old: old = current / (1 + changePercent/100)
  return currentPrice / (1 + changePercent / 100);
}

/**
 * Calculate index 24h ago
 */
export function calculateIndex24hAgo(
  currentIndex: number,
  changePercent: number
): number {
  return currentIndex / (1 + changePercent / 100);
}

/**
 * Bot Coordination Detection
 *
 * Detects when multiple orders cluster at identical price points,
 * suggesting coordinated bot activity rather than organic trading.
 *
 * Signal: 10+ orders at exact same price
 * Interpretation: Bot network coordinating placement
 */

export interface OrderBookData {
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
}

export interface BotCoordinationDetectionResult {
  detected: boolean;
  type: 'bot_coordination';
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  description: string;
  evidence: {
    clusters: Array<{
      side: 'bid' | 'ask';
      price: number;
      count: number;
    }>;
  };
}

const CLUSTER_THRESHOLD = 10; // 10+ orders at same price
const HIGH_CLUSTER_THRESHOLD = 20; // 20+ is high severity

/**
 * Detect bot coordination from order book clustering
 */
export function detectBotCoordination(
  orderBook: OrderBookData
): BotCoordinationDetectionResult | null {
  const suspiciousClusters: Array<{
    side: 'bid' | 'ask';
    price: number;
    count: number;
  }> = [];

  // Analyze bid side
  const bidPrices = new Map<number, number>();
  for (const bid of orderBook.bids) {
    const roundedPrice = Math.round(bid.price * 100) / 100;
    bidPrices.set(roundedPrice, (bidPrices.get(roundedPrice) || 0) + 1);
  }

  for (const [price, count] of bidPrices.entries()) {
    if (count >= CLUSTER_THRESHOLD) {
      suspiciousClusters.push({ side: 'bid', price, count });
    }
  }

  // Analyze ask side
  const askPrices = new Map<number, number>();
  for (const ask of orderBook.asks) {
    const roundedPrice = Math.round(ask.price * 100) / 100;
    askPrices.set(roundedPrice, (askPrices.get(roundedPrice) || 0) + 1);
  }

  for (const [price, count] of askPrices.entries()) {
    if (count >= CLUSTER_THRESHOLD) {
      suspiciousClusters.push({ side: 'ask', price, count });
    }
  }

  if (suspiciousClusters.length === 0) {
    return null;
  }

  const maxClusterSize = Math.max(...suspiciousClusters.map((c) => c.count));
  const severity: 'medium' | 'high' =
    maxClusterSize > HIGH_CLUSTER_THRESHOLD ? 'high' : 'medium';

  const confidence = Math.min(60 + maxClusterSize, 85);

  const clusterDesc = suspiciousClusters
    .map((c) => `${c.count} ${c.side} orders at $${c.price.toFixed(2)}`)
    .join(', ');

  const description = `Detected unusual order clustering: ${clusterDesc}. Multiple orders at identical prices suggest bot coordination rather than organic trading. This pattern is statistically improbable for human traders.`;

  return {
    detected: true,
    type: 'bot_coordination',
    severity,
    confidence,
    description,
    evidence: { clusters: suspiciousClusters },
  };
}

export function hasBotCoordination(orderBook: OrderBookData): boolean {
  return detectBotCoordination(orderBook) !== null;
}

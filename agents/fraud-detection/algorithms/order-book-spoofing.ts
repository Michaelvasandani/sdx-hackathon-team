/**
 * Order Book Spoofing Detection
 *
 * Detects when large orders are placed and quickly canceled to manipulate
 * market perception and create false liquidity signals.
 *
 * Signal: Large orders (>5x median size) with lifetime < 10 seconds
 * Interpretation: Spoofing to manipulate perception of supply/demand
 */

export interface OrderUpdate {
  order_id: string;
  price: number;
  size: number;
  side: 'bid' | 'ask';
  status: 'placed' | 'canceled' | 'filled';
  timestamp: number;
}

export interface SpoofingDetectionResult {
  detected: boolean;
  type: 'spoofing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  evidence: {
    suspicious_orders: Array<{
      order_id: string;
      size: number;
      lifetime_seconds: number;
    }>;
    count: number;
    avg_size: number;
  };
}

const LARGE_ORDER_MULTIPLIER = 5; // 5x median size
const QUICK_CANCEL_THRESHOLD = 10; // seconds
const MIN_SPOOFING_EVENTS = 3; // Need at least 3 events to flag

/**
 * Calculate median order size from recent orders
 */
function calculateMedianOrderSize(orders: OrderUpdate[]): number {
  const sizes = orders.map((o) => o.size).sort((a, b) => a - b);
  const mid = Math.floor(sizes.length / 2);
  return sizes.length % 2 === 0 ? (sizes[mid - 1] + sizes[mid]) / 2 : sizes[mid];
}

/**
 * Detect spoofing from order book updates
 *
 * @param orderUpdates - Recent order placement and cancellation events
 * @param windowMinutes - Time window to analyze (default 15 minutes)
 * @returns Detection result or null if no spoofing detected
 */
export function detectSpoofing(
  orderUpdates: OrderUpdate[],
  windowMinutes: number = 15
): SpoofingDetectionResult | null {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  // Filter to recent window
  const recentOrders = orderUpdates.filter((o) => now - o.timestamp < windowMs);

  if (recentOrders.length === 0) {
    return null;
  }

  // Calculate median size for comparison
  const medianSize = calculateMedianOrderSize(recentOrders);
  const largeOrderThreshold = medianSize * LARGE_ORDER_MULTIPLIER;

  // Track order lifetimes
  const orderLifetimes = new Map<string, { placed: number; size: number; side: string }>();

  for (const update of recentOrders) {
    if (update.status === 'placed') {
      orderLifetimes.set(update.order_id, {
        placed: update.timestamp,
        size: update.size,
        side: update.side,
      });
    } else if (update.status === 'canceled') {
      const orderInfo = orderLifetimes.get(update.order_id);
      if (orderInfo) {
        orderInfo.placed = update.timestamp - orderInfo.placed; // Convert to lifetime
      }
    }
  }

  // Find suspicious large orders with quick cancellations
  const suspiciousOrders: Array<{
    order_id: string;
    size: number;
    lifetime_seconds: number;
  }> = [];

  for (const [orderId, info] of orderLifetimes.entries()) {
    const lifetimeSeconds = info.placed / 1000;

    // Check if order is large and canceled quickly
    if (info.size > largeOrderThreshold && lifetimeSeconds < QUICK_CANCEL_THRESHOLD) {
      suspiciousOrders.push({
        order_id: orderId,
        size: info.size,
        lifetime_seconds: lifetimeSeconds,
      });
    }
  }

  // Need minimum number of events to flag as spoofing
  if (suspiciousOrders.length < MIN_SPOOFING_EVENTS) {
    return null;
  }

  // Calculate average size
  const avgSize =
    suspiciousOrders.reduce((sum, o) => sum + o.size, 0) / suspiciousOrders.length;

  // Determine severity
  const severity: 'medium' | 'high' | 'critical' =
    suspiciousOrders.length > 10
      ? 'critical'
      : suspiciousOrders.length > 5
      ? 'high'
      : 'medium';

  // Confidence scales with number of events
  const confidence = Math.min(60 + suspiciousOrders.length * 5, 95);

  const description = `Detected ${
    suspiciousOrders.length
  } large orders (avg ${avgSize.toFixed(
    1
  )} contracts) placed and canceled within seconds. This is classic spoofing behavior to manipulate market perception. Orders were ${(
    avgSize / medianSize
  ).toFixed(1)}x the median order size and canceled after an average of ${(
    suspiciousOrders.reduce((sum, o) => sum + o.lifetime_seconds, 0) /
    suspiciousOrders.length
  ).toFixed(1)} seconds.`;

  return {
    detected: true,
    type: 'spoofing',
    severity,
    confidence,
    description,
    evidence: {
      suspicious_orders: suspiciousOrders,
      count: suspiciousOrders.length,
      avg_size: avgSize,
    },
  };
}

/**
 * Calculate spoofing score for integrity calculation
 */
export function calculateSpoofingScore(spoofingEvents: number): number {
  if (spoofingEvents === 0) return 0;

  // Scale: 3-5 events = 30-50, 5-10 = 50-80, 10+ = 80-100
  if (spoofingEvents < 5) return spoofingEvents * 10;
  if (spoofingEvents < 10) return 50 + (spoofingEvents - 5) * 6;
  return Math.min(80 + (spoofingEvents - 10) * 4, 100);
}

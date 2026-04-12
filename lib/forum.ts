/**
 * Forum Market API client
 * Handles HMAC-SHA256 signing for authenticated endpoints.
 * Signature scheme: HMAC-SHA256(secret, timestamp + METHOD + path)
 */

const BASE_URL = process.env.FORUM_API_BASE_URL ?? "https://api.forum.market/v1";
const API_KEY = process.env.FORUM_API_KEY ?? "";
const API_SECRET = process.env.FORUM_API_SECRET ?? "";

// --- HMAC signing ---

async function sign(timestamp: string, method: string, path: string): Promise<string> {
  const message = timestamp + method.toUpperCase() + path;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(API_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Buffer.from(sig).toString("hex");
}

async function authHeaders(method: string, path: string) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await sign(timestamp, method, path);
  return {
    "FORUM-ACCESS-KEY": API_KEY,
    "FORUM-ACCESS-SIGN": signature,
    "FORUM-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
  };
}

// --- Generic fetch wrapper ---

async function forumFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.auth) {
    Object.assign(headers, await authHeaders(method, path));
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Forum API ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ============================================================
// Types
// ============================================================

export interface Market {
  ticker: string;
  name: string;
  index: string;
  category: string;
  subCategory: string;
  live: boolean;
  lastPrice: number;
  bestBid: number;
  bestAsk: number;
  openInterest: number;
  volumePastDay: number;
  highPastDay: number;
  lowPastDay: number;
  changePercentPastDay: number;
  changePastDay: number;
  changeIndexPercentPastDay: number;
  changeIndexPastDay: number;
  lastFunding: string;
  movingFundingRate: number;
  lastSettledFundingRate: number;
  cumFunding: number;
}

export interface IndexDetails {
  name: string;
  value: number;
  updatedAt: string;
  sources?: Record<string, number>;
}

export interface IndexHistoryPoint {
  value: number;
  timestamp: string;
}

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface FundingRate {
  lastRate: number;
  estimatedNextRate: number;
  lastPrice: number;
  indexValue: number;
  nextFundingTime: string;
}

export interface Order {
  id: number;
  clientOrderId?: string;
  ticker: string;
  side: "buy" | "sell";
  qty: number;
  price?: number;
  orderType: "limit" | "market";
  status: string;
  createdAt: string;
}

export interface Position {
  ticker: string;
  qty: number;
  avgEntryPrice: number;
  unrealizedPnl: number;
  liquidationPrice: number;
}

export interface AccountSummary {
  balance: number;
  availableMargin: number;
  usedMargin: number;
  unrealizedPnl: number;
  totalPnl: number;
  healthStatus: string;
}

// ============================================================
// Public endpoints (no auth required)
// ============================================================

/** Returns the current server time. */
export const getServerTime = () =>
  forumFetch<{ epoch: number; iso: string }>("/time");

/** Returns exchange operational status. */
export const getExchangeStatus = () =>
  forumFetch<{ inMaintenance: boolean }>("/exchange/status");

/** Lists all available markets with ticker data. */
export const listMarkets = () =>
  forumFetch<Market[]>("/markets");

/** Returns details for a single market. */
export const getMarket = (ticker: string) =>
  forumFetch<Market>(`/markets/${encodeURIComponent(ticker)}`);

/** Returns the current order book snapshot for a market. */
export const getOrderBook = (ticker: string) =>
  forumFetch<unknown>(`/markets/${encodeURIComponent(ticker)}/book`);

/** Returns recent public trades for a market. */
export const getRecentTrades = (ticker: string, limit = 100) =>
  forumFetch<unknown[]>(`/markets/${encodeURIComponent(ticker)}/trades?limit=${limit}`);

/** Returns OHLCV candlestick data for a market. */
export const getCandles = (ticker: string, limit = 500) =>
  forumFetch<Candle[]>(`/markets/${encodeURIComponent(ticker)}/candles?limit=${limit}`);

/** Returns the current attention index value. */
export const getIndex = (name: string) =>
  forumFetch<IndexDetails>(`/indices/${encodeURIComponent(name)}`);

/** Returns historical index values. */
export const getIndexHistory = (name: string) =>
  forumFetch<{ values: IndexHistoryPoint[] }>(`/indices/${encodeURIComponent(name)}/history`);

/** Returns current + estimated funding rate for a market. */
export const getFundingRate = (ticker: string) =>
  forumFetch<FundingRate>(`/markets/${encodeURIComponent(ticker)}/funding-rate`);

/** Returns historical funding rates for a market. */
export const getFundingHistory = (ticker: string) =>
  forumFetch<FundingRate[]>(`/markets/${encodeURIComponent(ticker)}/funding-history`);

// ============================================================
// Private endpoints (auth required)
// ============================================================

/** Lists open orders. Requires read permission. */
export const listOrders = (limit = 100) =>
  forumFetch<Order[]>(`/orders?limit=${limit}`, { auth: true });

/** Places a single order. Requires trade permission. */
export const placeOrder = (order: {
  ticker: string;
  side: "buy" | "sell";
  qty: number;
  orderType: "limit" | "market";
  price?: number;
  timeInForce?: string;
  clientOrderId?: string;
}) => forumFetch<Order>("/orders", { method: "POST", body: order, auth: true });

/** Cancels all open orders (optionally filtered by ticker). */
export const cancelAllOrders = (ticker?: string) =>
  forumFetch<void>(ticker ? `/orders?ticker=${ticker}` : "/orders", {
    method: "DELETE",
    auth: true,
  });

/** Gets a single order by exchange ID. */
export const getOrder = (orderId: number) =>
  forumFetch<Order>(`/orders/${orderId}`, { auth: true });

/** Cancels a single order by exchange ID. */
export const cancelOrder = (orderId: number) =>
  forumFetch<void>(`/orders/${orderId}`, { method: "DELETE", auth: true });

/** Places up to 10 orders in one request. */
export const placeBatchOrders = (orders: Parameters<typeof placeOrder>[0][]) =>
  forumFetch<Order[]>("/orders/batch", { method: "POST", body: { orders }, auth: true });

/** Cancels up to 20 orders by ID in one request. */
export const cancelBatchOrders = (orderIds: number[]) =>
  forumFetch<void>("/orders/batch", { method: "DELETE", body: { orderIds }, auth: true });

/** Lists trade executions for the authenticated user. */
export const listFills = (limit = 100) =>
  forumFetch<unknown[]>(`/fills?limit=${limit}`, { auth: true });

/** Lists all open positions. */
export const listPositions = () =>
  forumFetch<Position[]>("/positions", { auth: true });

/** Gets position for a specific market. */
export const getPosition = (ticker: string) =>
  forumFetch<Position>(`/positions/${encodeURIComponent(ticker)}`, { auth: true });

/** Returns account summary: balances, margin, PnL, health. */
export const getAccount = () =>
  forumFetch<AccountSummary>("/account", { auth: true });

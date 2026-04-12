/**
 * Forum Market API Client
 *
 * REST API wrapper for Forum's attention markets
 * Based on forum_api.md documentation
 */

const FORUM_API_BASE_URL = process.env.FORUM_API_BASE_URL || 'https://api.forum.market/v1';

// Forum API is public - no authentication required

// ============================================
// TYPES
// ============================================

export interface ForumMarket {
  ticker: string;
  name: string;
  category: string;
  subCategory: string | null;
  lastPrice: number;
  lastIndexValue: number;
  bestBid: number;
  bestAsk: number;
  volumePastDay: number;
  openInterest: number;
  movingFundingRate: number;
  lastSettledFundingRate: number;
  changePercentPastDay: number;
  changePastDay: number;
  changeIndexPercentPastDay: number;
  changeIndexPastDay: number;
  highPastDay: number;
  lowPastDay: number;
  live: boolean;
  updatedAt: string;
}

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  ticker: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: string;
  sequence: number;
}

export interface Trade {
  id: string;
  ticker: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: string;
}

export interface Candlestick {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndexDetails {
  ticker: string;
  index_value: number;
  source_breakdown?: {
    [source: string]: number;
  };
  timestamp: string;
}

export interface IndexHistory {
  ticker: string;
  values: Array<{
    timestamp: string;
    value: number;
  }>;
}

export interface FundingRate {
  ticker: string;
  current_rate: number;
  next_rate_estimate: number;
  next_funding_time: string;
  last_price: number;
  index_value: number;
}

export interface FundingHistory {
  ticker: string;
  rates: Array<{
    timestamp: string;
    rate: number;
  }>;
}

// ============================================
// API CLIENT
// ============================================

class ForumAPIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Forum API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================
  // MARKETS
  // ============================================

  async listAllMarkets(): Promise<ForumMarket[]> {
    return this.request<ForumMarket[]>('/markets');
  }

  async getMarket(ticker: string): Promise<ForumMarket> {
    return this.request<ForumMarket>(`/market/${ticker}`);
  }

  // ============================================
  // MARKET DATA
  // ============================================

  async getOrderBook(ticker: string): Promise<OrderBook> {
    return this.request<OrderBook>(`/orderbook/${ticker}`);
  }

  async getRecentTrades(ticker: string, limit: number = 100): Promise<Trade[]> {
    return this.request<Trade[]>(`/trades/${ticker}?limit=${limit}`);
  }

  async getCandlesticks(
    ticker: string,
    interval: '1m' | '5m' | '1h' | '1d',
    start?: string,
    end?: string
  ): Promise<Candlestick[]> {
    let url = `/candlesticks/${ticker}?interval=${interval}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;
    return this.request<Candlestick[]>(url);
  }

  // ============================================
  // INDICES
  // ============================================

  async getIndexDetails(ticker: string): Promise<IndexDetails> {
    return this.request<IndexDetails>(`/indices/${ticker}`);
  }

  async getIndexHistory(
    ticker: string,
    start?: string,
    end?: string
  ): Promise<IndexHistory> {
    let url = `/indices/${ticker}/history`;
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (params.toString()) url += `?${params}`;
    return this.request<IndexHistory>(url);
  }

  // ============================================
  // FUNDING
  // ============================================

  async getCurrentFundingRate(ticker: string): Promise<FundingRate> {
    return this.request<FundingRate>(`/funding/${ticker}`);
  }

  async getFundingHistory(
    ticker: string,
    start?: string,
    end?: string
  ): Promise<FundingHistory> {
    let url = `/funding/${ticker}/history`;
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (params.toString()) url += `?${params}`;
    return this.request<FundingHistory>(url);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const forumAPI = new ForumAPIClient(FORUM_API_BASE_URL);

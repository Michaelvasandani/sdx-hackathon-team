import { supabase } from './client';

// ============================================
// TYPES
// ============================================

export interface Market {
  id: string;
  ticker: string;
  name: string;
  category: string | null;
  created_at: string;
}

export interface IntegrityScore {
  id: number;
  ticker: string;
  score: number;
  price_index_divergence: number;
  spoofing_events: number;
  wash_trading_probability: number;
  bot_coordination_detected: boolean;
  funding_anomaly_score: number;
  correlation_break_score: number;
  recorded_at: string;
}

export interface FraudAlert {
  id: string;
  ticker: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string | null;
  evidence: any;
  detected_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface OrderBookSnapshot {
  id: number;
  ticker: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  snapshot_at: string;
}

export interface Trade {
  id: number;
  ticker: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  traded_at: string;
}

// ============================================
// QUERIES
// ============================================

export async function getAllMarkets(): Promise<Market[]> {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .order('ticker');

  if (error) throw error;
  return data || [];
}

export async function getLatestIntegrityScores(): Promise<IntegrityScore[]> {
  // Get the most recent score for each ticker
  const { data, error } = await supabase
    .from('integrity_scores')
    .select('*')
    .order('recorded_at', { ascending: false });

  if (error) throw error;

  // Deduplicate to get latest per ticker
  const latestScores = new Map<string, IntegrityScore>();
  data?.forEach((score) => {
    if (!latestScores.has(score.ticker)) {
      latestScores.set(score.ticker, score);
    }
  });

  return Array.from(latestScores.values());
}

export async function getIntegrityScore(ticker: string): Promise<IntegrityScore | null> {
  const { data, error } = await supabase
    .from('integrity_scores')
    .select('*')
    .eq('ticker', ticker)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

export async function getIntegrityHistory(
  ticker: string,
  hours: number = 24
): Promise<IntegrityScore[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('integrity_scores')
    .select('*')
    .eq('ticker', ticker)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveAlerts(ticker?: string): Promise<FraudAlert[]> {
  let query = supabase
    .from('fraud_alerts')
    .select('*')
    .is('resolved_at', null);

  if (ticker) {
    query = query.eq('ticker', ticker);
  }

  const { data, error } = await query.order('detected_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllAlerts(
  limit: number = 100,
  ticker?: string
): Promise<FraudAlert[]> {
  let query = supabase.from('fraud_alerts').select('*');

  if (ticker) {
    query = query.eq('ticker', ticker);
  }

  const { data, error } = await query
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getTradeHistory(
  ticker: string,
  hours: number = 24
): Promise<Trade[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('trade_history')
    .select('*')
    .eq('ticker', ticker)
    .gte('traded_at', since)
    .order('traded_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getOrderBookSnapshot(ticker: string): Promise<OrderBookSnapshot | null> {
  const { data, error } = await supabase
    .from('order_book_snapshots')
    .select('*')
    .eq('ticker', ticker)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

// ============================================
// INSERTS
// ============================================

export async function storeIntegrityScore(
  ticker: string,
  score: number,
  signals: {
    price_index_divergence?: number;
    spoofing_events?: number;
    wash_trading_probability?: number;
    bot_coordination_detected?: boolean;
    funding_anomaly_score?: number;
    correlation_break_score?: number;
  }
) {
  const { error } = await supabase.from('integrity_scores').insert({
    ticker,
    score,
    ...signals,
  });

  if (error) throw error;
}

export async function storeFraudAlert(
  ticker: string,
  alert_type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  confidence: number,
  description: string,
  evidence: any
) {
  const { error } = await supabase.from('fraud_alerts').insert({
    ticker,
    alert_type,
    severity,
    confidence,
    description,
    evidence,
  });

  if (error) throw error;
}

export async function storeOrderBookSnapshot(
  ticker: string,
  bids: Array<{ price: number; size: number }>,
  asks: Array<{ price: number; size: number }>
) {
  const { error } = await supabase.from('order_book_snapshots').insert({
    ticker,
    bids,
    asks,
  });

  if (error) throw error;
}

export async function storeTradeHistory(trades: Omit<Trade, 'id'>[]) {
  const { error } = await supabase.from('trade_history').insert(trades);

  if (error) throw error;
}

export async function resolveAlert(alertId: string, notes?: string) {
  const { error } = await supabase
    .from('fraud_alerts')
    .update({
      resolved_at: new Date().toISOString(),
      resolution_notes: notes,
    })
    .eq('id', alertId);

  if (error) throw error;
}

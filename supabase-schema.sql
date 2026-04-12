-- Truth Seeker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. MARKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT, -- 'music', 'gaming', 'movies', 'brands', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INTEGRITY SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS integrity_scores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),

  -- Individual signal scores
  price_index_divergence FLOAT DEFAULT 0,
  spoofing_events INT DEFAULT 0,
  wash_trading_probability FLOAT DEFAULT 0,
  bot_coordination_detected BOOLEAN DEFAULT FALSE,
  funding_anomaly_score FLOAT DEFAULT 0,
  correlation_break_score FLOAT DEFAULT 0,

  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_integrity_ticker_time
ON integrity_scores(ticker, recorded_at DESC);

-- ============================================
-- 3. FRAUD ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  -- Options: 'spoofing', 'wash_trading', 'price_manipulation',
  --          'bot_coordination', 'funding_anomaly', 'correlation_break'

  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),

  description TEXT, -- AI-generated explanation
  evidence JSONB, -- Raw data supporting the alert

  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_alerts_ticker ON fraud_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_alerts_time ON fraud_alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON fraud_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON fraud_alerts(resolved_at) WHERE resolved_at IS NULL;

-- ============================================
-- 4. ORDER BOOK SNAPSHOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_book_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker TEXT NOT NULL,
  bids JSONB NOT NULL, -- Array of {price, size}
  asks JSONB NOT NULL, -- Array of {price, size}
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for historical analysis
CREATE INDEX IF NOT EXISTS idx_orderbook_ticker_time
ON order_book_snapshots(ticker, snapshot_at DESC);

-- ============================================
-- 5. TRADE HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trade_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker TEXT NOT NULL,
  price FLOAT NOT NULL,
  size FLOAT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  traded_at TIMESTAMPTZ NOT NULL
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_trades_ticker_time
ON trade_history(ticker, traded_at DESC);

-- ============================================
-- 6. ENABLE REAL-TIME FOR FRAUD ALERTS
-- ============================================
-- This allows the frontend to subscribe to new alerts in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE fraud_alerts;

-- ============================================
-- 7. SEED INITIAL DATA (Example Markets)
-- ============================================
INSERT INTO markets (ticker, name, category) VALUES
  ('DRAKE', 'Drake', 'music'),
  ('TAYLOR_SWIFT', 'Taylor Swift', 'music'),
  ('KENDRICK_LAMAR', 'Kendrick Lamar', 'music'),
  ('SABRINA_CARPENTER', 'Sabrina Carpenter', 'music'),
  ('FORTNITE', 'Fortnite', 'gaming'),
  ('ELDEN_RING', 'Elden Ring', 'gaming'),
  ('GTA_6', 'GTA 6', 'gaming'),
  ('KARDASHIANS', 'The Kardashians', 'brands'),
  ('TESLA', 'Tesla', 'brands'),
  ('APPLE', 'Apple', 'brands')
ON CONFLICT (ticker) DO NOTHING;

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to get latest integrity score for a ticker
CREATE OR REPLACE FUNCTION get_latest_integrity_score(ticker_param TEXT)
RETURNS TABLE (
  ticker TEXT,
  score INT,
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    integrity_scores.ticker,
    integrity_scores.score,
    integrity_scores.recorded_at
  FROM integrity_scores
  WHERE integrity_scores.ticker = ticker_param
  ORDER BY integrity_scores.recorded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get active (unresolved) alerts for a ticker
CREATE OR REPLACE FUNCTION get_active_alerts(ticker_param TEXT)
RETURNS TABLE (
  id UUID,
  ticker TEXT,
  alert_type TEXT,
  severity TEXT,
  confidence FLOAT,
  description TEXT,
  detected_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fraud_alerts.id,
    fraud_alerts.ticker,
    fraud_alerts.alert_type,
    fraud_alerts.severity,
    fraud_alerts.confidence,
    fraud_alerts.description,
    fraud_alerts.detected_at
  FROM fraud_alerts
  WHERE fraud_alerts.ticker = ticker_param
    AND fraud_alerts.resolved_at IS NULL
  ORDER BY fraud_alerts.detected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get markets with low integrity scores
CREATE OR REPLACE FUNCTION get_risky_markets(threshold INT DEFAULT 50)
RETURNS TABLE (
  ticker TEXT,
  score INT,
  alert_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_scores AS (
    SELECT DISTINCT ON (integrity_scores.ticker)
      integrity_scores.ticker,
      integrity_scores.score,
      integrity_scores.recorded_at
    FROM integrity_scores
    ORDER BY integrity_scores.ticker, integrity_scores.recorded_at DESC
  )
  SELECT
    ls.ticker,
    ls.score,
    COUNT(fa.id) as alert_count
  FROM latest_scores ls
  LEFT JOIN fraud_alerts fa ON ls.ticker = fa.ticker AND fa.resolved_at IS NULL
  WHERE ls.score < threshold
  GROUP BY ls.ticker, ls.score
  ORDER BY ls.score ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- Next steps:
-- 1. Copy your Supabase URL and keys to .env.local
-- 2. Run this SQL in Supabase SQL Editor
-- 3. Verify tables were created successfully

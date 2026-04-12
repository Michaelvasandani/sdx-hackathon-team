-- Sentiment Velocity Agent Schema Extensions
-- Run these commands in Supabase SQL editor to set up tables for sentiment velocity monitoring

-- Create sentiment_velocity_signals table
create table if not exists sentiment_velocity_signals (
  id bigint generated always as identity primary key,
  ticker text not null,
  signal_type text not null, -- 'price_acceleration', 'index_acceleration', 'momentum_divergence'
  severity text not null, -- 'low', 'medium', 'high', 'critical'
  confidence float not null, -- 0-100
  momentum_status text not null, -- 'stable', 'accelerating', 'diverging', 'critical'
  momentum_score float not null, -- 0-100
  window text not null, -- '5m', '15m', '1h'
  evidence jsonb not null, -- raw evidence data (acceleration, z-scores, etc)
  detected_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Create index for fast lookups
create index if not exists idx_velocity_signals_ticker_time 
on sentiment_velocity_signals(ticker, detected_at desc);

create index if not exists idx_velocity_signals_type 
on sentiment_velocity_signals(signal_type);

create index if not exists idx_velocity_signals_status 
on sentiment_velocity_signals(momentum_status);

-- Create velocity_alerts table
create table if not exists velocity_alerts (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  alert_type text not null, -- 'price_acceleration', 'index_acceleration', 'momentum_divergence'
  severity text not null, -- 'low', 'medium', 'high', 'critical'
  confidence float not null, -- 0-100
  description text,
  evidence jsonb,
  detected_at timestamptz default now(),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz default now()
);

-- Create indexes for velocity alerts
create index if not exists idx_velocity_alerts_ticker 
on velocity_alerts(ticker);

create index if not exists idx_velocity_alerts_time 
on velocity_alerts(detected_at desc);

create index if not exists idx_velocity_alerts_status 
on velocity_alerts(resolved_at) where resolved_at is null;

-- Optional: Create view for active velocity signals
create or replace view active_velocity_signals as
select * from sentiment_velocity_signals
where detected_at > now() - interval '1 hour'
order by detected_at desc;

-- Optional: Create view for active velocity alerts
create or replace view active_velocity_alerts as
select * from velocity_alerts
where resolved_at is null
order by detected_at desc;

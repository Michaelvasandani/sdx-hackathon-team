# First Mover — The Cultural Latency Arbitrage Engine

## One-Liner

Culture moves at different speeds across platforms. We detect where a trend has already spiked but hasn't been priced into Forum's attention markets yet, and flag the arbitrage window before it closes.

---

## The Thesis

Attention doesn't propagate instantly. A song goes viral on TikTok on Monday, shows up on YouTube by Wednesday, hits Google Search by Friday, and mainstream outlets cover it the following week. Forum's engagement indices aggregate across these sources, meaning there's a measurable delay between when a "fast" platform signals a trend and when the composite index fully reflects it.

That delay is the arbitrage window.

By monitoring fast-moving platforms independently and comparing them against Forum's index, we can identify cultural assets that are about to move before the market prices it in.

---

## Core Concepts

### Cultural Latency
Each platform has a characteristic "speed" for different content categories:
- **Music**: TikTok leads (viral sounds) → Spotify Charts → YouTube → Google Search → Forum Index
- **Gaming**: Twitch/YouTube leads → Reddit → Twitter → Google Search → Forum Index
- **Movies/TV**: Twitter/Reddit leads → YouTube (trailers/reactions) → Google Search → Forum Index

### Arbitrage Signal
When a cultural asset spikes on a fast platform but Forum's index/price hasn't moved yet, that's our signal. Confidence scales with:
- How historically reliable the lag pattern is for that category
- How large the spike is relative to baseline
- How much time remains in the typical lag window

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                 │
│                   Next.js + React                   │
│                                                     │
│  ┌─────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Speed   │  │  Live Arb    │  │  Backtest     │  │
│  │ Leader- │  │  Opportun-   │  │  & Historical │  │
│  │ board   │  │  ities Feed  │  │  Accuracy     │  │
│  └─────────┘  └──────────────┘  └───────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              API ROUTES (Next.js /api)               │
│                                                     │
│  /api/scan         → run arbitrage detection        │
│  /api/historical   → fetch lag analysis results     │
│  /api/leaderboard  → platform speed rankings        │
└──────────────────────┬──────────────────────────────┘
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
     ┌────────┐  ┌──────────┐  ┌──────────────┐
     │ Forum  │  │ Platform │  │  Supabase    │
     │ Market │  │ Signals  │  │  (Storage +  │
     │ API    │  │ (below)  │  │   Cron Jobs) │
     └────────┘  └──────────┘  └──────────────┘
```

---

## Tech Stack

### Frontend + API
| Tool | Why |
|------|-----|
| **Next.js 14 (App Router)** | API routes + frontend in one project, deploys to Vercel in seconds |
| **Vercel** | Zero-config deploy, edge functions, free tier is plenty for a hackathon |
| **Tailwind CSS** | Fast styling, dark Bloomberg-terminal aesthetic |
| **Recharts or Lightweight Charts** | TradingView-style candlestick and line charts. `lightweight-charts` by TradingView is free and looks professional |
| **React Query (TanStack Query)** | Polling Forum's API on intervals, caching, easy refetch |

### Backend + Data
| Tool | Why |
|------|-----|
| **Supabase** | Postgres database + cron jobs via `pg_cron` or Supabase Edge Functions on a schedule. Free tier. Stores historical lag data and computed signals |
| **Supabase Edge Functions** | Lightweight serverless functions for scheduled data pulls (every 15-30 min). Written in TypeScript/Deno |

### Data Sources
| Source | What We Get | How |
|--------|-------------|-----|
| **Forum API — Indices** | Underlying engagement scores per asset | REST, poll every 15 min |
| **Forum API — Market Data** | Prices, volume, OHLCV-style data | REST, poll every 15 min |
| **Forum API — Markets** | List of available assets + metadata | REST, poll on startup |
| **Google Trends** | Search interest over time per keyword | `serpapi.com` (free tier, 100 searches/mo) or `google-trends-api` npm package (unofficial, free, no key) |
| **Reddit** | Post volume + upvotes in relevant subreddits | Reddit JSON API (free, no auth needed: append `.json` to any subreddit URL) |
| **YouTube** | Trending videos, view velocity | YouTube Data API v3 (free, 10K units/day) |
| **Spotify** (optional) | Chart position changes | Scrape Spotify Charts page or use `spotify-web-api-node` |

---

## Data Model (Supabase/Postgres)

### `assets`
Maps Forum markets to external platform identifiers.

```sql
create table assets (
  id uuid primary key default gen_random_uuid(),
  forum_market_id text unique not null,
  name text not null,
  category text, -- 'music', 'gaming', 'movies', 'brands'
  google_trends_keyword text,
  reddit_subreddit text,
  youtube_search_term text,
  spotify_artist_id text,
  created_at timestamptz default now()
);
```

### `signals`
Raw platform signal readings, collected every 15-30 min.

```sql
create table signals (
  id bigint generated always as identity primary key,
  asset_id uuid references assets(id),
  source text not null, -- 'forum_index', 'google_trends', 'reddit', 'youtube'
  value float not null, -- normalized 0-100 engagement score
  raw_value jsonb, -- store raw response for debugging
  recorded_at timestamptz default now()
);

-- index for fast time-series queries
create index idx_signals_asset_time on signals(asset_id, recorded_at desc);
create index idx_signals_source on signals(source);
```

### `lag_profiles`
Precomputed cross-correlation results per asset and platform pair.

```sql
create table lag_profiles (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  source text not null, -- 'google_trends', 'reddit', etc.
  median_lag_hours float, -- how many hours this source leads/lags Forum
  correlation float, -- strength of the relationship
  sample_size int,
  computed_at timestamptz default now()
);
```

### `arbitrage_signals`
Detected opportunities.

```sql
create table arbitrage_signals (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),
  leading_source text not null,
  spike_magnitude float, -- z-score of the spike
  expected_lag_hours float,
  confidence float, -- 0-1
  detected_at timestamptz default now(),
  resolved_at timestamptz, -- when Forum index caught up (or didn't)
  outcome text -- 'confirmed', 'missed', 'false_positive'
);
```

---

## Core Algorithm

### 1. Normalize All Signals
Each platform has different scales. Normalize everything to z-scores on a rolling 30-day window:

```
z_score = (current_value - rolling_mean_30d) / rolling_std_30d
```

### 2. Compute Cross-Correlation (Offline/Batch)
For each (asset, platform) pair, compute the cross-correlation between the platform's z-score time series and Forum's index z-score at lags from -72h to +72h:

```python
from scipy.signal import correlate
import numpy as np

def compute_lag(platform_signal, forum_signal, max_lag_hours=72):
    correlation = correlate(forum_signal, platform_signal, mode='full')
    lags = np.arange(-max_lag_hours, max_lag_hours + 1)
    best_lag = lags[np.argmax(correlation)]
    return best_lag  # positive = platform leads Forum
```

Run this nightly as a Supabase Edge Function or a simple GitHub Action.

### 3. Real-Time Scan (Every 15 min)
For each asset:
1. Pull latest signals from all sources
2. Compute current z-score for each platform
3. Compare against Forum's current z-score
4. If any platform z-score > 2.0 AND Forum z-score < 0.5 AND historical lag profile shows that platform leads:
   → Flag as arbitrage opportunity
5. Confidence = `correlation_strength * spike_magnitude * time_remaining_in_window`

### 4. Resolution Tracking
After the expected lag window passes, check if Forum's index moved. Mark the signal as confirmed or false positive. This builds your backtest accuracy stats over time.

---

## Frontend Panels

### Panel 1: Platform Speed Leaderboard
For each cultural category (music, gaming, movies), show a ranked list of platforms by median lead time:

```
MUSIC                    GAMING
1. TikTok  → -3.2 days  1. Twitch   → -2.8 days
2. Spotify → -1.8 days  2. YouTube  → -1.5 days
3. YouTube → -1.1 days  3. Reddit   → -1.2 days
4. Reddit  → -0.5 days  4. Twitter  → -0.3 days
5. Google  → +0.2 days  5. Google   → +0.8 days
```

Negative = leads Forum. This alone is a compelling finding.

### Panel 2: Live Arbitrage Feed
Cards showing current opportunities:

```
┌──────────────────────────────────────────────┐
│  🔥 DRAKE (Music)                            │
│  Reddit spike: +3.4σ (12 hours ago)          │
│  Forum index: flat (+0.1σ)                   │
│  Historical lag: Reddit → Forum = 18h        │
│  Estimated window remaining: ~6h             │
│  Confidence: 78%                             │
│  Suggested action: LONG                      │
└──────────────────────────────────────────────┘
```

### Panel 3: Backtest / Track Record
Show historical accuracy: "Of the last 50 signals where Reddit led by 2+ sigma, Forum's index moved in the expected direction 68% of the time within 48 hours."

Simple bar chart or win/loss visualization.

---

## Hackathon Execution Plan

### Pre-Hackathon (If Allowed)
- [ ] Set up Vercel project + Supabase project
- [ ] Create the database tables
- [ ] Manually curate 15-20 assets in the `assets` table (map Forum markets to Google Trends keywords, subreddit names, etc.)
- [ ] Test Forum API endpoints, confirm response shapes

### Hour 0-4: Data Pipeline
- [ ] Write Supabase Edge Functions to poll Forum API (Indices, Market Data, Markets)
- [ ] Write scrapers/API calls for Google Trends, Reddit, YouTube
- [ ] Normalize and store in `signals` table
- [ ] Verify data is flowing

### Hour 4-8: Core Algorithm
- [ ] Implement z-score normalization
- [ ] Implement cross-correlation lag computation
- [ ] Implement real-time arbitrage scanner
- [ ] Store results in `arbitrage_signals` table

### Hour 8-14: Frontend
- [ ] Bloomberg-terminal dark theme layout
- [ ] Platform speed leaderboard component
- [ ] Live arbitrage feed with auto-refresh
- [ ] Chart component showing platform vs Forum overlay for each asset
- [ ] Backtest accuracy display

### Hour 14-16: Polish + Demo Prep
- [ ] Seed compelling example data if live data is sparse
- [ ] Add countdown timers on arbitrage cards
- [ ] Write demo script
- [ ] Record backup video in case live demo breaks

---

## Demo Script (3 min)

1. **Hook (30s)**: "Culture doesn't move at the same speed everywhere. A song goes viral on TikTok three days before the market notices. We built a tool that detects that gap and trades it."

2. **Speed Leaderboard (45s)**: Show the platform speed rankings. "We discovered that for music, TikTok leads Forum's index by an average of 3.2 days. For gaming, it's Twitch at 2.8 days. Each category has a different information hierarchy."

3. **Live Signal (60s)**: Show a current or recent arbitrage opportunity. Walk through the card. "Reddit spiked on this asset 12 hours ago. Forum hasn't moved. Based on historical patterns, we have about 6 hours before the index catches up. Confidence: 78%."

4. **Backtest (30s)**: "This isn't speculation. Over our historical data, signals with 2+ sigma spikes on leading platforms predicted Forum index movement 68% of the time."

5. **Close (15s)**: "Latency arbitrage is how quant firms make billions in traditional finance. We applied the same logic to the attention economy. First Mover finds the alpha in culture."

---

## Environment Variables

```env
# Forum Market API
FORUM_API_BASE_URL=https://api.forum.market
FORUM_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# External Data Sources
SERP_API_KEY=your_serpapi_key  # for Google Trends (optional, can use free npm package)
YOUTUBE_API_KEY=your_youtube_key
REDDIT_USER_AGENT=first-mover-hackathon/1.0

# Optional
SPOTIFY_CLIENT_ID=your_spotify_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "@supabase/supabase-js": "^2",
    "@tanstack/react-query": "^5",
    "lightweight-charts": "^4",
    "tailwindcss": "^3",
    "date-fns": "^3",
    "google-trends-api": "^4"
  }
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Forum API rate limits are tight | Cache aggressively in Supabase, poll every 15 min not every minute |
| Not enough historical data to compute reliable lags | Pre-seed with synthetic lag profiles based on reasonable assumptions, update as real data flows in. Be transparent about this in the demo |
| External APIs (Google Trends, Reddit) are flaky | Graceful fallbacks. If one source fails, the system still works with remaining sources. Reddit JSON API is the most reliable free option |
| Live data is boring during the demo | Prepare 2-3 "greatest hits" historical examples that show clear lag patterns. Lead with those, show live as bonus |
| Cross-correlation is noisy on short time series | Use category-level aggregation (all music assets together) to increase sample size for lag estimation |
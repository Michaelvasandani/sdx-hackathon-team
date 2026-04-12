# Truth Seeker — AI Market Integrity Agent for Forum

## One-Liner

An AI watchdog that monitors Forum's attention markets 24/7 to detect manipulation, fraud, and bot activity in real-time, providing integrity scores and alerts to protect traders and platform trust.

---

## The Thesis

Attention markets are vulnerable to manipulation. When cultural relevance determines asset value, bad actors can:
- Fabricate engagement through bots
- Manipulate prices without underlying attention growth
- Spoof order books to create false liquidity
- Wash trade to inflate volume
- Coordinate pump-and-dump schemes

Forum's API exposes rich market microstructure data (order books, trades, indices, funding rates) that contains fingerprints of fraudulent activity. By applying AI-powered anomaly detection across multiple signals, we can identify manipulation patterns in real-time and protect market participants.

---

## Core Concepts

### Market Integrity Signals

**High-Confidence Fraud Detection (Using Forum API Only):**

1. **Price-Index Manipulation**
   - Signal: Price moves significantly without corresponding attention index movement
   - Example: DRAKE price +30% but attention index +2%
   - Interpretation: Artificial price pump without cultural momentum

2. **Order Book Spoofing**
   - Signal: Large orders placed then immediately canceled
   - Example: 500 contract bid placed for 3 seconds, then canceled
   - Interpretation: Fake liquidity to manipulate perception

3. **Wash Trading**
   - Signal: Repetitive same-size trades, artificial volume creation
   - Example: 73% of trades are exactly 3.5 contracts
   - Interpretation: Self-trading to create false activity

4. **Bot Coordination**
   - Signal: Orders clustered at identical price points
   - Example: 15 orders all at exactly $47.23
   - Interpretation: Bot network acting in coordination

5. **Funding Rate Anomalies**
   - Signal: Funding rate diverges from price-index relationship
   - Example: Price > Index but funding is positive (should be negative)
   - Interpretation: Unnatural market positioning

6. **Cross-Market Correlation Breaks**
   - Signal: Related markets moving independently
   - Example: DRAKE and KENDRICK_LAMAR usually correlate 0.85, suddenly 0.12
   - Interpretation: Isolated manipulation vs. genuine cultural shift

### Integrity Score (0-100)

Each market receives a real-time integrity score based on:
- Order book health (organic vs. suspicious patterns)
- Trade authenticity (natural distribution vs. wash trading)
- Index-price alignment (fundamental vs. manipulated)
- Historical behavior consistency
- Funding rate normality

**Score Interpretation:**
- 80-100: High integrity, safe to trade
- 50-79: Medium risk, monitor closely
- 0-49: High fraud risk, avoid trading

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                 │
│                   Next.js + React                   │
│                                                     │
│  ┌─────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Live    │  │  Fraud Alert │  │  Investigation│  │
│  │ Integ-  │  │  Feed        │  │  Chat         │  │
│  │ rity    │  │  (Real-time) │  │  Interface    │  │
│  │ Scores  │  └──────────────┘  └───────────────┘  │
│  └─────────┘                                        │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Historical Fraud Archive                     │  │
│  │  (Past manipulation events with analysis)     │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              API ROUTES (Next.js /api)               │
│                                                     │
│  /api/integrity/scores    → Get all market scores   │
│  /api/integrity/[ticker]  → Detailed fraud analysis │
│  /api/alerts              → Real-time alert feed    │
│  /api/investigate         → AI investigation agent  │
└──────────────────────┬──────────────────────────────┘
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
     ┌────────┐  ┌──────────┐  ┌──────────────┐
     │ Forum  │  │  Fraud   │  │  Supabase    │
     │ Market │  │ Detection│  │  (Storage +  │
     │ API    │  │  Engine  │  │   AI LLM)    │
     └────────┘  └──────────┘  └──────────────┘
          │
          ▼
   ┌──────────────────┐
   │  WebSocket Feeds │
   │  - book_updates  │
   │  - trades        │
   │  - ticker_updates│
   │  - index_updates │
   │  - funding_events│
   └──────────────────┘
```

---

## Tech Stack

### Frontend + API
| Tool | Why |
|------|-----|
| **Next.js 14 (App Router)** | API routes + frontend in one project, deploys to Vercel |
| **Vercel** | Zero-config deploy, edge functions, WebSocket support |
| **Tailwind CSS** | Fast styling, security-focused dark UI aesthetic |
| **Recharts** | Real-time charts for integrity scores and price-index divergence |
| **React Query (TanStack Query)** | Real-time alert polling and state management |

### Backend + AI
| Tool | Why |
|------|-----|
| **Supabase** | Postgres database for historical fraud data, alerts archive |
| **OpenAI API** | LLM for natural language fraud explanations and conversational investigation |
| **Supabase Edge Functions** | Serverless functions for WebSocket management and fraud detection algorithms |

### Data Sources
| Source | What We Get | How |
|--------|-------------|-----|
| **Forum API — Order Book** | Order placement/cancellation patterns for spoofing detection | WebSocket `book_updates` |
| **Forum API — Trades** | Trade size, frequency, timing for wash trading detection | WebSocket `trades` |
| **Forum API — Ticker** | Real-time price movements | WebSocket `ticker_updates` |
| **Forum API — Index** | Attention index changes | WebSocket `index_updates` + REST `/indices/history` |
| **Forum API — Funding** | Funding rate data for anomaly detection | WebSocket `funding_events` + REST `/funding/history` |
| **Forum API — Markets** | List of all markets for comprehensive monitoring | REST `/markets` |
| **Forum API — Candlesticks** | Historical price data for pattern analysis | REST `/candlestick` |

---

## Data Model (Supabase/Postgres)

### `markets`
Tracks all Forum markets being monitored.

```sql
create table markets (
  id uuid primary key default gen_random_uuid(),
  ticker text unique not null,
  name text not null,
  category text, -- 'music', 'gaming', 'movies', 'brands'
  created_at timestamptz default now()
);
```

### `integrity_scores`
Real-time integrity scores for each market.

```sql
create table integrity_scores (
  id bigint generated always as identity primary key,
  ticker text not null,
  score int not null, -- 0-100
  price_index_divergence float,
  spoofing_events int,
  wash_trading_probability float,
  bot_coordination_detected boolean,
  funding_anomaly_score float,
  recorded_at timestamptz default now()
);

create index idx_integrity_ticker_time on integrity_scores(ticker, recorded_at desc);
```

### `fraud_alerts`
Detected fraud events with AI-generated explanations.

```sql
create table fraud_alerts (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  alert_type text not null, -- 'spoofing', 'wash_trading', 'price_manipulation', etc.
  severity text not null, -- 'low', 'medium', 'high', 'critical'
  confidence float not null, -- 0-100
  description text, -- AI-generated explanation
  evidence jsonb, -- Raw data supporting the alert
  detected_at timestamptz default now(),
  resolved_at timestamptz,
  resolution_notes text
);

create index idx_alerts_ticker on fraud_alerts(ticker);
create index idx_alerts_time on fraud_alerts(detected_at desc);
```

### `order_book_snapshots`
Periodic snapshots for historical spoofing analysis.

```sql
create table order_book_snapshots (
  id bigint generated always as identity primary key,
  ticker text not null,
  bids jsonb not null,
  asks jsonb not null,
  snapshot_at timestamptz default now()
);

create index idx_orderbook_ticker_time on order_book_snapshots(ticker, snapshot_at desc);
```

### `trade_history`
Trade events for wash trading detection.

```sql
create table trade_history (
  id bigint generated always as identity primary key,
  ticker text not null,
  price float not null,
  size float not null,
  side text not null, -- 'buy' or 'sell'
  traded_at timestamptz not null
);

create index idx_trades_ticker_time on trade_history(ticker, traded_at desc);
```

---

## Fraud Detection Algorithms

### 1. Price-Index Divergence Detection

Monitors the relationship between price movement and attention index movement.

```python
def detect_price_manipulation(ticker):
    # Get 24h price change
    price_change_24h = get_price_change(ticker, hours=24)

    # Get 24h index change
    index_change_24h = get_index_change(ticker, hours=24)

    # Calculate divergence
    divergence = abs(price_change_24h - index_change_24h)

    # Flag if significant divergence
    if divergence > 15:  # 15% threshold
        confidence = min(divergence / 50 * 100, 100)

        return {
            "type": "price_manipulation",
            "severity": "high" if divergence > 25 else "medium",
            "confidence": confidence,
            "description": f"Price moved {price_change_24h:.1f}% but attention index only moved {index_change_24h:.1f}%. This suggests artificial price movement without underlying cultural momentum.",
            "evidence": {
                "price_change": price_change_24h,
                "index_change": index_change_24h,
                "divergence": divergence
            }
        }
```

### 2. Order Book Spoofing Detection

Monitors for large orders that are placed and quickly canceled.

```python
def detect_spoofing(order_updates):
    suspicious_orders = []

    for order in order_updates:
        # Track large orders
        if order['size'] > median_order_size * 5:
            # Check if canceled quickly
            if order['status'] == 'canceled' and order['lifetime_seconds'] < 10:
                suspicious_orders.append(order)

    if len(suspicious_orders) > 5:  # Multiple spoofing events
        return {
            "type": "spoofing",
            "severity": "high",
            "confidence": 85,
            "description": f"Detected {len(suspicious_orders)} large orders (avg {avg_size:.1f} contracts) placed and canceled within seconds. This is classic spoofing behavior to manipulate market perception.",
            "evidence": {
                "suspicious_orders": suspicious_orders,
                "count": len(suspicious_orders)
            }
        }
```

### 3. Wash Trading Detection

Analyzes trade patterns for repetitive same-size trades.

```python
def detect_wash_trading(trades):
    # Analyze trade size distribution
    size_counts = Counter([t['size'] for t in trades])
    most_common_size, count = size_counts.most_common(1)[0]

    # Calculate what % of trades are the same size
    same_size_ratio = count / len(trades)

    if same_size_ratio > 0.7:  # 70% threshold
        return {
            "type": "wash_trading",
            "severity": "critical",
            "confidence": 75,
            "description": f"{count} out of {len(trades)} trades ({same_size_ratio*100:.1f}%) were exactly {most_common_size} contracts. This highly uniform distribution suggests wash trading to create artificial volume.",
            "evidence": {
                "total_trades": len(trades),
                "same_size_count": count,
                "common_size": most_common_size,
                "ratio": same_size_ratio
            }
        }
```

### 4. Bot Coordination Detection

Identifies orders clustered at identical price points.

```python
def detect_bot_coordination(order_book):
    # Analyze price point clustering on both sides
    bid_prices = Counter([o['price'] for o in order_book['bids']])
    ask_prices = Counter([o['price'] for o in order_book['asks']])

    suspicious_clusters = []

    # Check for clusters of 10+ orders at same price
    for price, count in bid_prices.items():
        if count >= 10:
            suspicious_clusters.append(("bid", price, count))

    for price, count in ask_prices.items():
        if count >= 10:
            suspicious_clusters.append(("ask", price, count))

    if suspicious_clusters:
        cluster_desc = ", ".join([f"{count} {side} orders at ${price}" for side, price, count in suspicious_clusters])

        return {
            "type": "bot_coordination",
            "severity": "medium",
            "confidence": 70,
            "description": f"Detected unusual order clustering: {cluster_desc}. Multiple orders at identical prices suggest bot coordination rather than organic trading.",
            "evidence": {
                "clusters": suspicious_clusters
            }
        }
```

### 5. Funding Rate Anomaly Detection

Checks if funding rate matches expected price-index relationship.

```python
def detect_funding_anomaly(ticker):
    current_price = get_current_price(ticker)
    current_index = get_current_index(ticker)
    funding_rate = get_current_funding_rate(ticker)

    # Expected funding direction
    # If price > index, longs should pay shorts (positive funding)
    # If price < index, shorts should pay longs (negative funding)

    expected_sign = 1 if current_price > current_index else -1
    actual_sign = 1 if funding_rate > 0 else -1

    if expected_sign != actual_sign:
        return {
            "type": "funding_anomaly",
            "severity": "medium",
            "confidence": 65,
            "description": f"Funding rate ({funding_rate:.4f}%) direction doesn't match price-index relationship (price: ${current_price:.2f}, index: {current_index:.2f}). This suggests unnatural market positioning.",
            "evidence": {
                "price": current_price,
                "index": current_index,
                "funding_rate": funding_rate
            }
        }
```

### 6. Cross-Market Correlation Analysis

Detects when related markets break historical correlation patterns.

```python
def detect_correlation_break(ticker1, ticker2, historical_correlation):
    # Calculate recent correlation (last 24h)
    recent_correlation = calculate_correlation(ticker1, ticker2, hours=24)

    # Check for significant correlation break
    correlation_drop = abs(historical_correlation - recent_correlation)

    if historical_correlation > 0.7 and recent_correlation < 0.3:
        return {
            "type": "correlation_break",
            "severity": "medium",
            "confidence": 60,
            "description": f"{ticker1} and {ticker2} historically move together (correlation: {historical_correlation:.2f}) but recently diverged ({recent_correlation:.2f}). This could indicate isolated manipulation on one market.",
            "evidence": {
                "historical_correlation": historical_correlation,
                "recent_correlation": recent_correlation,
                "drop": correlation_drop
            }
        }
```

---

## AI Agent Features

### 1. Live Integrity Dashboard

Real-time view of all markets with integrity scores.

```
┌─────────────────────────────────────────────────┐
│  MARKET INTEGRITY MONITOR                       │
├─────────────┬───────────┬───────────────────────┤
│ TICKER      │ SCORE     │ ALERTS                │
├─────────────┼───────────┼───────────────────────┤
│ DRAKE       │ 89 🟢    │ None                  │
│ FORTNITE    │ 76 🟡    │ Minor bot activity    │
│ KARDASHIANS │ 34 🔴    │ Wash trading detected │
│ TAYLOR      │ 92 🟢    │ None                  │
│ ELDEN_RING  │ 45 🔴    │ Spoofing + Price pump │
└─────────────┴───────────┴───────────────────────┘
```

### 2. Real-Time Fraud Alerts

Live feed of detected suspicious activity.

```
🚨 CRITICAL ALERT — KARDASHIANS — 2:34 PM
Wash trading detected: 73% of volume from repetitive 3.5 contract trades
Confidence: 75% | Integrity Score: 34/100
Recommendation: AVOID TRADING

⚠️  HIGH ALERT — ELDEN_RING — 2:31 PM
Spoofing detected: 12 large orders (500+ contracts) placed and canceled within 10 seconds
Price manipulation suspected: Price +23% but index +3%
Confidence: 85% | Integrity Score: 45/100
Recommendation: AVOID TRADING

⚠️  MEDIUM ALERT — FORTNITE — 2:28 PM
Bot coordination: 15 orders clustered at exactly $47.23
Confidence: 70% | Integrity Score: 76/100
Recommendation: MONITOR CLOSELY
```

### 3. Conversational Investigation Agent

Chat interface powered by OpenAI to investigate specific markets.

```
User: "Why is KARDASHIANS flagged as high risk?"

Agent: "⚠️ KARDASHIANS Market Analysis — Integrity Score: 34/100

I've detected multiple fraud signals:

1. Wash Trading (Critical):
   - 127 out of 174 trades (73%) in the last 2 hours were exactly 3.5 contracts
   - This highly uniform distribution is statistically improbable and suggests self-trading
   - Artificial volume: Actual unique volume likely 40% lower than reported

2. Price-Index Divergence (High):
   - Price increased 18% in the last 6 hours
   - Attention index only increased 4% in same period
   - This suggests price is being pumped without underlying cultural momentum

3. Order Book Health (Medium):
   - 7 orders clustered at $32.10 (possible bot coordination)
   - Bid-ask spread 2.3x wider than 7-day average (low liquidity)

Historical Context:
- This market had similar wash trading patterns 3 days ago, followed by a 15% price crash
- Integrity score has been below 50 for the past 18 hours

Recommendation: AVOID TRADING
This market shows strong evidence of manipulation. Wait for integrity score to recover above 70 before considering entry."

User: "Show me all markets with integrity scores below 50"

Agent: "I found 3 markets currently flagged as high fraud risk:

1. KARDASHIANS — Score: 34/100
   Primary issue: Wash trading + price manipulation

2. ELDEN_RING — Score: 45/100
   Primary issue: Order book spoofing + price-index divergence

3. CRYPTO_PUNKS — Score: 48/100
   Primary issue: Bot coordination detected

Would you like detailed analysis on any of these markets?"
```

### 4. Historical Fraud Archive

Track record of past manipulation events and outcomes.

```
PAST FRAUD EVENTS

┌──────────────────────────────────────────────────────┐
│ FORTNITE — Spoofing Event — Mar 15, 2026            │
├──────────────────────────────────────────────────────┤
│ Detection: 47 large orders (avg 800 contracts)       │
│ placed and canceled within 5 seconds                 │
│                                                      │
│ Outcome: Price crashed 22% within 3 hours of alert  │
│ Traders who avoided: Saved avg $1,240 per position  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ SABRINA_CARPENTER — Wash Trading — Mar 12, 2026     │
├──────────────────────────────────────────────────────┤
│ Detection: 89% of trades were identical 2.8 contract │
│ size over 4-hour period                              │
│                                                      │
│ Outcome: Volume collapsed 71% after detection        │
│ Market returned to normal after 2 days               │
└──────────────────────────────────────────────────────┘
```

---

## Hackathon Execution Plan

### Hour 0-2: Infrastructure Setup
- [ ] Initialize Next.js 14 project with TypeScript and Tailwind CSS
- [ ] Set up Supabase project and create database tables
- [ ] Configure environment variables (Forum API keys, OpenAI API key)
- [ ] Test Forum WebSocket connection (subscribe to book_updates, trades, ticker_updates, index_updates)

### Hour 2-5: Fraud Detection Engine
- [ ] Implement price-index divergence detection algorithm
- [ ] Implement order book spoofing detection
- [ ] Implement wash trading pattern recognition
- [ ] Implement bot coordination detection
- [ ] Implement funding rate anomaly detection
- [ ] Create integrity score calculation (weighted combination of all signals)
- [ ] Set up Supabase Edge Function to run detections every minute

### Hour 5-7: Data Pipeline & Storage
- [ ] Build WebSocket listener for real-time data ingestion
- [ ] Store order book snapshots in database
- [ ] Store trade history in database
- [ ] Store integrity scores with timestamps
- [ ] Store fraud alerts with AI-generated descriptions
- [ ] Implement alert deduplication (don't spam same alert repeatedly)

### Hour 7-9: AI Integration
- [ ] Integrate OpenAI API for natural language fraud explanations
- [ ] Build conversational investigation agent with function calling
- [ ] Create prompt templates for different fraud types
- [ ] Implement context-aware responses (references specific market data)

### Hour 9-12: Frontend
- [ ] Build live integrity dashboard with market scores
- [ ] Create real-time alert feed component
- [ ] Build chat interface for conversational investigation
- [ ] Add historical fraud archive view
- [ ] Implement auto-refresh for live data
- [ ] Add color-coded severity indicators (green/yellow/red)
- [ ] Create detailed market analysis page

### Hour 12-14: Polish & Demo Prep
- [ ] Seed database with historical fraud examples
- [ ] Test all fraud detection algorithms with edge cases
- [ ] Optimize WebSocket performance and error handling
- [ ] Add loading states and error boundaries
- [ ] Create compelling demo script
- [ ] Record backup demo video

---

## Demo Script (3 min)

**1. Hook (30s):**
"Attention markets have a trust problem. When bots can fabricate engagement and traders can manipulate prices, how do you know what's real? We built an AI watchdog that monitors every market on Forum 24/7 to detect fraud in real-time."

**2. Live Dashboard (60s):**
Show the integrity dashboard with color-coded scores. Click on a red-flagged market (e.g., KARDASHIANS at 34/100).

"Each market gets an integrity score from 0 to 100 based on six fraud signals. KARDASHIANS is flagged as high risk. Let's investigate."

**3. Investigation (45s):**
Open conversational investigation:
"Why is KARDASHIANS flagged?"

Agent responds with detailed analysis:
- Wash trading: 73% of trades same size
- Price manipulation: +18% price, +4% index
- Historical context: Similar pattern before 15% crash

"Our AI explains exactly what's suspicious and recommends avoiding the market."

**4. Real-Time Alert (30s):**
Show live alert feed. If no live alert, show historical example:

"⚠️ ELDEN_RING spoofing detected: 12 orders totaling 6,000 contracts placed and canceled in 10 seconds. This market just got flagged."

**5. Impact (15s):**
"Truth Seeker protects traders from manipulation, increases platform trust, and could be used by Forum for compliance. Market integrity through AI surveillance."

---

## Environment Variables

```env
# Forum Market API
FORUM_API_BASE_URL=https://api.forum.market
FORUM_API_KEY=your_key_here
FORUM_WSS_URL=wss://api.forum.market/ws/v1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=your_openai_key
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
    "openai": "^4",
    "ws": "^8",
    "recharts": "^2",
    "tailwindcss": "^3",
    "date-fns": "^3",
    "zod": "^3"
  }
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| False positives creating user distrust | Use confidence scores, never claim 100% certainty. Provide evidence, let users decide. |
| WebSocket connection instability | Implement reconnection logic with exponential backoff. Store last sequence number to resume. |
| Legitimate unusual trading flagged as fraud | Multi-signal approach reduces false positives. Require multiple indicators before high-severity alerts. |
| Limited historical data for pattern matching | Seed with reasonable heuristics (e.g., >70% same-size trades is suspicious regardless of history). Update models as data accumulates. |
| Detection algorithms could be gamed | Don't publicly expose exact thresholds. Periodically update detection parameters. AI can adapt to new manipulation tactics. |
| Slow AI response times during investigation | Cache common queries. Use streaming for long responses. Pre-compute integrity scores so investigation is just explanation. |

---

## Success Metrics

### For Hackathon Judging
- **Novelty**: First fraud detection agent for attention markets
- **Technical depth**: Multi-signal anomaly detection + AI explanations
- **Real utility**: Addresses genuine market integrity concern
- **Demo quality**: Live monitoring with real Forum data
- **Completeness**: Full stack working end-to-end

### For Actual Usage
- **Detection accuracy**: % of alerts that correctly identify fraud
- **False positive rate**: % of alerts that are legitimate activity
- **User trust**: Do traders check integrity scores before entering positions?
- **Market impact**: Do flagged markets see reduced volume (market self-correcting)?
- **Platform value**: Would Forum adopt this for compliance/trust?

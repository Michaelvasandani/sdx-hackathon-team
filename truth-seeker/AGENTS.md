# Truth Seeker — AI Market Integrity Agents

## Agent Identity

**Name:** Truth Seeker
**Version:** 1.0.0
**Type:** Multi-agent fraud detection system for Forum attention markets
**Created:** April 2026

---

## System Overview

Truth Seeker is a multi-agent AI system that monitors Forum's attention markets 24/7 to detect manipulation, fraud, and bot activity. The system uses specialized agents working in coordination to analyze different fraud signals and provide comprehensive market integrity assessments.

---

## Agent Architecture

### 1. Data Ingestion Agent
**Purpose:** Real-time data collection from Forum API
**Location:** `/agents/data-ingestion/`
**Responsibilities:**
- Connect to Forum WebSocket feeds (book_updates, trades, ticker_updates, index_updates, funding_events)
- Store raw data to Supabase database
- Handle connection failures with exponential backoff
- Normalize timestamps to UTC

**Capabilities:**
- WebSocket connection management
- Data persistence
- Error recovery
- Rate limit handling

**Constraints:**
- Must maintain connection uptime > 99%
- Maximum 5-second delay for data ingestion
- Must deduplicate incoming messages

---

### 2. Fraud Detection Agent
**Purpose:** Multi-signal analysis for manipulation detection
**Location:** `/agents/fraud-detection/`
**Responsibilities:**
- Run 6 fraud detection algorithms:
  1. Price-Index Divergence Detection
  2. Order Book Spoofing Detection
  3. Wash Trading Pattern Recognition
  4. Bot Coordination Detection
  5. Funding Rate Anomaly Detection
  6. Cross-Market Correlation Analysis
- Generate fraud alerts with confidence scores
- Calculate integrity scores (0-100) for each market
- Store alerts and scores to database

**Capabilities:**
- Statistical anomaly detection
- Pattern matching
- Multi-signal aggregation
- Confidence scoring

**Constraints:**
- Must complete analysis within 60 seconds of data arrival
- Minimum 60% confidence threshold for alerts
- Must provide evidence for all alerts

**Safety Guidelines:**
- Never claim 100% certainty on fraud detection
- Always provide evidence and let users decide
- Use "suspected" or "potential" language, not definitive claims
- Document false positives for model improvement

---

### 3. Investigation Agent (Conversational AI)
**Purpose:** Natural language investigation and explanation
**Location:** `/agents/investigation/`
**Responsibilities:**
- Answer user queries about market integrity
- Explain fraud alerts in natural language
- Provide historical context for suspicious patterns
- Generate recommendations (avoid trading, monitor closely, safe to trade)

**Capabilities:**
- Natural language understanding (OpenAI GPT-4)
- Function calling to query database
- Context-aware responses
- Multi-turn conversation memory

**Constraints:**
- Response time < 3 seconds for cached queries
- Response time < 10 seconds for complex analysis
- Must cite specific data points in explanations
- Cannot execute trades or access user accounts

**Safety Guidelines:**
- Never provide financial advice
- Always use phrases like "based on detected patterns" and "historical data suggests"
- Clearly state limitations of fraud detection
- Recommend users conduct their own due diligence

**Prompt Template:**
```
You are Truth Seeker's Investigation Agent, an AI fraud analyst for Forum attention markets.

Your role is to:
1. Analyze market integrity data and explain fraud signals in plain English
2. Provide evidence-based assessments with confidence levels
3. Help users understand suspicious patterns without providing financial advice

Guidelines:
- Be precise but not alarmist
- Always cite specific data (e.g., "73% of trades were 3.5 contracts")
- Use confidence levels: "High confidence (85%)" or "Moderate confidence (60%)"
- Recommend caution, not action: "Consider avoiding" not "You should sell"
- Acknowledge limitations: "This pattern suggests..." not "This proves..."

Available functions:
- get_integrity_score(ticker)
- get_fraud_alerts(ticker, hours=24)
- get_trade_history(ticker, hours=24)
- get_order_book_snapshot(ticker)
- get_price_index_data(ticker, hours=24)
- get_funding_rate_history(ticker, hours=24)

Current date: {current_date}
User query: {user_query}
```

---

### 4. Alert Manager Agent
**Purpose:** Alert deduplication, prioritization, and delivery
**Location:** `/agents/alert-manager/`
**Responsibilities:**
- Deduplicate fraud alerts (don't spam same alert repeatedly)
- Prioritize alerts by severity (critical > high > medium > low)
- Deliver real-time notifications to frontend
- Track alert resolution (when suspicious activity ends)

**Capabilities:**
- Alert deduplication logic
- Severity classification
- Real-time push notifications
- Alert lifecycle tracking

**Constraints:**
- Maximum 1 alert per market per 5-minute window for same fraud type
- Must resolve alerts when pattern ends
- Alerts expire after 24 hours if not resolved

---

## Agent Orchestration Pattern

**Pattern:** Supervisor with Specialized Workers

```
┌─────────────────────────────────────┐
│     Supervisor (Alert Manager)      │
│  - Routes tasks to workers          │
│  - Aggregates results               │
│  - Manages alert delivery           │
└──────────┬──────────────────────────┘
           │
     ┌─────┴─────┬─────────┬──────────┐
     │           │         │          │
     ▼           ▼         ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐
│  Data   │ │ Fraud  │ │ Invest-  │ │  Alert     │
│ Ingest  │ │ Detect │ │ igation  │ │  Manager   │
│ Agent   │ │ Agent  │ │ Agent    │ │  Agent     │
└─────────┘ └────────┘ └──────────┘ └────────────┘
```

**Flow:**
1. Data Ingestion Agent continuously streams Forum data
2. Fraud Detection Agent processes data every 60 seconds
3. Alert Manager Agent receives fraud signals and decides whether to create alerts
4. Investigation Agent responds to user queries on-demand
5. Alert Manager Agent delivers prioritized alerts to frontend

---

## State Management

### Shared State Schema
```typescript
interface TruthSeekerState {
  // Active WebSocket connections
  connections: {
    forum_ws: WebSocket | null;
    last_heartbeat: Date;
    sequence_number: number;
  };

  // Latest market data
  markets: {
    [ticker: string]: {
      integrity_score: number;
      last_updated: Date;
      active_alerts: FraudAlert[];
    };
  };

  // Active fraud detection runs
  detection_runs: {
    run_id: string;
    started_at: Date;
    markets_processed: number;
    total_markets: number;
    status: 'running' | 'completed' | 'failed';
  }[];

  // Investigation context
  investigation_sessions: {
    [session_id: string]: {
      user_query: string;
      context: any;
      messages: Message[];
    };
  };
}
```

### State Persistence
- State checkpointed to Supabase every 60 seconds
- Critical state changes (fraud alerts) written immediately
- WebSocket sequence numbers stored for resume-on-reconnect

---

## Integration Points

### Forum API
- **REST Base URL:** `https://api.forum.market`
- **WebSocket URL:** `wss://api.forum.market/ws/v1`
- **Authentication:** HMAC-SHA256 signature
- **Rate Limits:** 100 requests/minute (REST), unlimited (WebSocket)

**Key Endpoints Used:**
```
GET  /markets                  → List all markets
GET  /market/{ticker}          → Get market details
GET  /orderbook/{ticker}       → Get order book snapshot
GET  /trades/{ticker}          → Get recent trades
GET  /candlesticks/{ticker}    → Get OHLCV data
GET  /indices/{ticker}         → Get index details with source breakdown
GET  /indices/{ticker}/history → Get historical index values
GET  /funding/{ticker}         → Get current funding rate
GET  /funding/{ticker}/history → Get funding rate history

WSS  book_updates              → Real-time order book updates
WSS  trades                    → Real-time trade feed
WSS  ticker_updates            → Real-time price/volume updates
WSS  index_updates             → Real-time index value updates
WSS  funding_events            → Daily funding events
```

### OpenAI API
- **Model:** GPT-4 (for Investigation Agent)
- **Function Calling:** Enabled for database queries
- **Temperature:** 0.3 (deterministic analysis)
- **Max Tokens:** 1000 (typical response)

### Supabase
- **Database:** PostgreSQL 15
- **Real-time:** Enabled for fraud_alerts table
- **Edge Functions:** Used for scheduled fraud detection runs

---

## Error Handling

### WebSocket Disconnection
```typescript
// Exponential backoff reconnection
const reconnect = async (attempt: number) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  await sleep(delay);

  try {
    await connectWebSocket();
    // Resume from last sequence number
    await resumeFromCheckpoint();
  } catch (error) {
    reconnect(attempt + 1);
  }
};
```

### Fraud Detection Failures
- Log error with context (ticker, timestamp, error message)
- Skip market and continue processing others
- Alert on-call engineer if error rate > 5%

### Investigation Agent Failures
- Return graceful error message to user
- Log query and error for debugging
- Suggest alternative actions (check dashboard, try again later)

---

## Testing Strategy

### Unit Tests
- Each fraud detection algorithm has 10+ test cases
- Mock data includes known fraud patterns
- Test edge cases (empty order books, missing data)

### Integration Tests
- End-to-end test: Data ingestion → Detection → Alert → Investigation
- Test WebSocket reconnection logic
- Test database persistence and retrieval

### Performance Tests
- Fraud detection must complete in < 60 seconds for 100 markets
- Investigation Agent must respond in < 10 seconds
- WebSocket must handle 1000+ messages/second

---

## Deployment

### Environment Variables
```env
# Forum API
FORUM_API_BASE_URL=https://api.forum.market
FORUM_API_KEY=xxx
FORUM_WSS_URL=wss://api.forum.market/ws/v1

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI
OPENAI_API_KEY=xxx
OPENAI_MODEL=gpt-4
```

### Infrastructure
- **Frontend:** Vercel (Next.js 14)
- **Backend:** Supabase Edge Functions
- **Database:** Supabase PostgreSQL
- **WebSocket:** Long-running Node.js process on Vercel

---

## Monitoring & Observability

### Key Metrics
- WebSocket connection uptime (target: 99%+)
- Data ingestion latency (target: < 5 seconds)
- Fraud detection runtime (target: < 60 seconds)
- Alert delivery latency (target: < 2 seconds)
- Investigation Agent response time (target: < 10 seconds)

### Alerting
- WebSocket disconnected for > 1 minute
- Fraud detection runtime > 120 seconds
- Error rate > 5% in any agent
- Database write failures

---

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Functional components with hooks (React)
- Async/await over promises

### File Structure
```
/agents/
  /data-ingestion/
    ingestion-agent.ts
    websocket-manager.ts
    data-normalizer.ts
  /fraud-detection/
    fraud-detection-agent.ts
    algorithms/
      price-index-divergence.ts
      order-book-spoofing.ts
      wash-trading.ts
      bot-coordination.ts
      funding-anomaly.ts
      correlation-break.ts
    integrity-scorer.ts
  /investigation/
    investigation-agent.ts
    prompts.ts
    function-definitions.ts
  /alert-manager/
    alert-manager-agent.ts
    deduplicator.ts
    prioritizer.ts
/lib/
  /forum-api/
    client.ts
    websocket.ts
  /supabase/
    client.ts
    queries.ts
  /openai/
    client.ts
```

### Naming Conventions
- Files: kebab-case (`fraud-detection-agent.ts`)
- Classes: PascalCase (`FraudDetectionAgent`)
- Functions: camelCase (`detectWashTrading`)
- Constants: UPPER_SNAKE_CASE (`MAX_CONFIDENCE_SCORE`)

### Git Workflow
- Feature branches: `feature/agent-name`
- Commit messages: `[AGENT_NAME] Description`
- PR review required before merge

---

## Changelog

### v1.0.0 (April 2026)
- Initial release with 4 specialized agents
- 6 fraud detection algorithms
- Real-time WebSocket monitoring
- Conversational investigation interface
- Historical fraud archive

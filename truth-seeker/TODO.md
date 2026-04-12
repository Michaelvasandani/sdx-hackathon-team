# Truth Seeker — Hackathon TODO List

**Target:** 14 hours from start to demo-ready
**Current Phase:** Infrastructure Setup

---

## Hour 0-2: Infrastructure Setup ⏱️ 2 hours

### Project Initialization
- [ ] Initialize Next.js 14 project with TypeScript
  ```bash
  npx create-next-app@latest truth-seeker --typescript --tailwind --app --no-src-dir
  cd truth-seeker
  ```
- [ ] Install core dependencies
  ```bash
  npm install @supabase/supabase-js @tanstack/react-query openai ws recharts date-fns zod
  npm install -D @types/ws
  ```
- [ ] Set up project structure
  ```bash
  mkdir -p agents/{data-ingestion,fraud-detection,investigation,alert-manager}
  mkdir -p lib/{forum-api,supabase,openai}
  mkdir -p app/api/{integrity,alerts,investigate}
  ```

### Supabase Setup
- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy Supabase URL and anon key to `.env.local`
- [ ] Create database tables (run SQL migrations):
  - [ ] `markets` table
  - [ ] `integrity_scores` table
  - [ ] `fraud_alerts` table
  - [ ] `order_book_snapshots` table
  - [ ] `trade_history` table
- [ ] Create database indexes
- [ ] Test database connection from Next.js

### Environment Variables
- [ ] Create `.env.local` file with all required variables:
  ```env
  FORUM_API_BASE_URL=
  FORUM_API_KEY=
  FORUM_WSS_URL=
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  OPENAI_API_KEY=
  ```
- [ ] Get Forum API credentials from team member
- [ ] Get OpenAI API key
- [ ] Test all API connections

### Forum API Connection Test
- [ ] Test REST API connection (GET /markets)
- [ ] Test WebSocket connection (subscribe to ticker_updates)
- [ ] Verify data format matches expectations
- [ ] Test authentication (HMAC signature)

---

## Hour 2-5: Fraud Detection Engine ⏱️ 3 hours

### Algorithm 1: Price-Index Divergence Detection
- [ ] Create `/agents/fraud-detection/algorithms/price-index-divergence.ts`
- [ ] Implement `detectPriceManipulation(ticker)` function
- [ ] Write unit tests with mock data
- [ ] Test with real Forum data
- [ ] Tune threshold parameters (15% divergence)

### Algorithm 2: Order Book Spoofing Detection
- [ ] Create `/agents/fraud-detection/algorithms/order-book-spoofing.ts`
- [ ] Implement `detectSpoofing(orderUpdates)` function
- [ ] Track order placement and cancellation timing
- [ ] Write unit tests
- [ ] Test with real order book data

### Algorithm 3: Wash Trading Detection
- [ ] Create `/agents/fraud-detection/algorithms/wash-trading.ts`
- [ ] Implement `detectWashTrading(trades)` function
- [ ] Analyze trade size distribution
- [ ] Write unit tests
- [ ] Test with real trade data

### Algorithm 4: Bot Coordination Detection
- [ ] Create `/agents/fraud-detection/algorithms/bot-coordination.ts`
- [ ] Implement `detectBotCoordination(orderBook)` function
- [ ] Detect price clustering patterns
- [ ] Write unit tests
- [ ] Test with real order book snapshots

### Algorithm 5: Funding Rate Anomaly Detection
- [ ] Create `/agents/fraud-detection/algorithms/funding-anomaly.ts`
- [ ] Implement `detectFundingAnomaly(ticker)` function
- [ ] Check price-index-funding relationship
- [ ] Write unit tests
- [ ] Test with real funding data

### Algorithm 6: Cross-Market Correlation Analysis
- [ ] Create `/agents/fraud-detection/algorithms/correlation-break.ts`
- [ ] Implement `detectCorrelationBreak(ticker1, ticker2)` function
- [ ] Calculate rolling correlation
- [ ] Write unit tests
- [ ] Test with real market data

### Integrity Score Calculator
- [ ] Create `/agents/fraud-detection/integrity-scorer.ts`
- [ ] Implement weighted scoring across all 6 signals
- [ ] Define scoring weights (configurable)
- [ ] Write unit tests
- [ ] Validate scores make sense

### Main Fraud Detection Agent
- [ ] Create `/agents/fraud-detection/fraud-detection-agent.ts`
- [ ] Orchestrate all 6 algorithms
- [ ] Generate fraud alerts with confidence scores
- [ ] Store results to Supabase
- [ ] Add error handling and logging

---

## Hour 5-7: Data Pipeline & Storage ⏱️ 2 hours

### WebSocket Listener (Data Ingestion Agent)
- [ ] Create `/agents/data-ingestion/websocket-manager.ts`
- [ ] Implement Forum WebSocket client
- [ ] Subscribe to required channels:
  - [ ] `book_updates`
  - [ ] `trades`
  - [ ] `ticker_updates`
  - [ ] `index_updates`
  - [ ] `funding_events`
- [ ] Handle connection lifecycle (connect, disconnect, reconnect)
- [ ] Implement exponential backoff for reconnection
- [ ] Store sequence numbers for resume-on-reconnect

### Data Normalization
- [ ] Create `/agents/data-ingestion/data-normalizer.ts`
- [ ] Normalize timestamps to UTC
- [ ] Standardize data formats
- [ ] Handle missing/malformed data

### Data Persistence
- [ ] Create `/lib/supabase/queries.ts` with database operations:
  - [ ] `storeOrderBookSnapshot(ticker, bids, asks)`
  - [ ] `storeTradeHistory(ticker, trades)`
  - [ ] `storeIntegrityScore(ticker, score, signals)`
  - [ ] `storeFraudAlert(ticker, alertType, confidence, description, evidence)`
- [ ] Implement batch inserts for performance
- [ ] Add retry logic for failed writes

### Alert Deduplication
- [ ] Create `/agents/alert-manager/deduplicator.ts`
- [ ] Implement deduplication logic (same fraud type, same market, 5-min window)
- [ ] Track active alerts in memory
- [ ] Resolve alerts when pattern ends

### Background Job Scheduler
- [ ] Create Supabase Edge Function for scheduled fraud detection
- [ ] Configure cron schedule (every 60 seconds)
- [ ] Trigger fraud detection agent
- [ ] Handle job failures gracefully

---

## Hour 7-9: AI Integration ⏱️ 2 hours

### OpenAI Client Setup
- [ ] Create `/lib/openai/client.ts`
- [ ] Initialize OpenAI client with API key
- [ ] Configure model (GPT-4)
- [ ] Set temperature (0.3 for deterministic analysis)

### Function Definitions for Investigation Agent
- [ ] Create `/agents/investigation/function-definitions.ts`
- [ ] Define functions for OpenAI function calling:
  - [ ] `get_integrity_score(ticker)`
  - [ ] `get_fraud_alerts(ticker, hours)`
  - [ ] `get_trade_history(ticker, hours)`
  - [ ] `get_order_book_snapshot(ticker)`
  - [ ] `get_price_index_data(ticker, hours)`
  - [ ] `get_funding_rate_history(ticker, hours)`

### Prompt Templates
- [ ] Create `/agents/investigation/prompts.ts`
- [ ] Write system prompt for Investigation Agent
- [ ] Create prompt templates for common queries:
  - [ ] "Why is [ticker] flagged?"
  - [ ] "Show me markets with integrity < X"
  - [ ] "Has [ticker] been manipulated before?"

### Investigation Agent
- [ ] Create `/agents/investigation/investigation-agent.ts`
- [ ] Implement conversational interface with OpenAI
- [ ] Implement function calling for database queries
- [ ] Add conversation memory (context retention)
- [ ] Format responses with markdown
- [ ] Add confidence levels to all statements

### AI-Generated Alert Descriptions
- [ ] Integrate OpenAI into fraud detection agent
- [ ] Generate natural language descriptions for alerts
- [ ] Include evidence and context in descriptions
- [ ] Cache common alert descriptions

---

## Hour 9-12: Frontend ⏱️ 3 hours

### Layout & Theme
- [ ] Create dark security-themed Tailwind config
- [ ] Set up color palette (green/yellow/red for severity)
- [ ] Create main layout component
- [ ] Add navigation

### Live Integrity Dashboard
- [ ] Create `/app/page.tsx` (main dashboard)
- [ ] Fetch all markets with integrity scores
- [ ] Display in sortable table:
  - [ ] Ticker
  - [ ] Integrity Score (0-100)
  - [ ] Color-coded indicator (🟢🟡🔴)
  - [ ] Active alerts summary
- [ ] Add search/filter functionality
- [ ] Implement auto-refresh (every 30 seconds)

### Real-Time Alert Feed
- [ ] Create `/app/components/AlertFeed.tsx`
- [ ] Subscribe to fraud_alerts table via Supabase Realtime
- [ ] Display alerts in chronological order
- [ ] Color-code by severity (critical/high/medium/low)
- [ ] Show timestamp, ticker, alert type, confidence
- [ ] Add "Dismiss" functionality
- [ ] Implement alert sound (optional)

### Chat Interface (Investigation Agent)
- [ ] Create `/app/investigate/page.tsx`
- [ ] Build chat UI component
- [ ] Implement message sending
- [ ] Display AI responses with formatting
- [ ] Add example prompts for users
- [ ] Show loading state while AI processes
- [ ] Add conversation history

### Market Detail Page
- [ ] Create `/app/market/[ticker]/page.tsx`
- [ ] Display detailed integrity analysis:
  - [ ] Current integrity score
  - [ ] All active alerts
  - [ ] Price vs Index chart (Recharts)
  - [ ] Trade volume chart
  - [ ] Funding rate history
- [ ] Add "Ask AI" quick action button

### Historical Fraud Archive
- [ ] Create `/app/history/page.tsx`
- [ ] Fetch resolved fraud alerts from database
- [ ] Display past fraud events with outcomes
- [ ] Add filters (by ticker, by fraud type, by date)
- [ ] Show statistics (detection accuracy, outcomes)

### API Routes
- [ ] Create `/app/api/integrity/scores/route.ts` - Get all integrity scores
- [ ] Create `/app/api/integrity/[ticker]/route.ts` - Get detailed analysis
- [ ] Create `/app/api/alerts/route.ts` - Get real-time alerts
- [ ] Create `/app/api/investigate/route.ts` - Investigation Agent endpoint
- [ ] Add error handling and validation (Zod)

---

## Hour 12-14: Polish & Demo Prep ⏱️ 2 hours

### Database Seeding
- [ ] Create `/scripts/seed-historical-data.ts`
- [ ] Seed 20+ markets in `markets` table
- [ ] Generate historical fraud examples:
  - [ ] FORTNITE spoofing event (with outcome)
  - [ ] KARDASHIANS wash trading (with outcome)
  - [ ] SABRINA_CARPENTER price manipulation
- [ ] Create realistic integrity scores
- [ ] Add variety of alert types

### Testing
- [ ] Test WebSocket reconnection (disconnect and verify recovery)
- [ ] Test all 6 fraud detection algorithms with edge cases
- [ ] Test Investigation Agent with various queries
- [ ] Test alert deduplication logic
- [ ] Load test: Can system handle 100 markets?

### Performance Optimization
- [ ] Add database query caching
- [ ] Optimize WebSocket message handling
- [ ] Reduce OpenAI API calls with response caching
- [ ] Minimize re-renders on frontend

### Error Handling & UX
- [ ] Add loading skeletons for all components
- [ ] Add error boundaries
- [ ] Display user-friendly error messages
- [ ] Add empty states ("No alerts right now")
- [ ] Add tooltips for technical terms

### Demo Script
- [ ] Write 3-minute demo script (see project_plan.md)
- [ ] Practice demo flow
- [ ] Prepare backup examples in case live data is boring
- [ ] Create compelling narrative arc

### Documentation
- [ ] Update README.md with:
  - [ ] Project description
  - [ ] Setup instructions
  - [ ] Architecture diagram
  - [ ] Agent descriptions
- [ ] Add code comments
- [ ] Document environment variables

### Deployment
- [ ] Deploy to Vercel
- [ ] Configure environment variables on Vercel
- [ ] Test production deployment
- [ ] Verify WebSocket works on Vercel
- [ ] Set up error monitoring (Sentry optional)

### Backup Demo Video
- [ ] Record 3-minute walkthrough
- [ ] Show live dashboard with flagged markets
- [ ] Demo Investigation Agent conversation
- [ ] Show real-time alert appearing
- [ ] Export video for backup

---

## Stretch Goals (If Time Permits)

### Advanced Features
- [ ] Email/Slack notifications for critical alerts
- [ ] Export fraud reports as PDF
- [ ] Add more sophisticated ML models for fraud detection
- [ ] Implement user accounts and watchlists
- [ ] Add mobile-responsive design

### Additional Fraud Signals
- [ ] Detect "pump and dump" coordination patterns
- [ ] Analyze order book depth manipulation
- [ ] Track unusual trading hours activity
- [ ] Detect "iceberg orders" (hidden liquidity)

### Platform Enhancements
- [ ] Public API for integrity scores
- [ ] Embeddable widgets for third-party sites
- [ ] Browser extension for Forum.market
- [ ] Historical backtesting interface

---

## Team Assignments

### Person 1: Backend & Agents (Michael?)
- Forum API integration
- Fraud detection algorithms
- Data ingestion agent
- Supabase setup

### Person 2: Frontend & UI
- Dashboard components
- Chart visualizations
- Alert feed UI
- Responsive design

### Person 3: AI & Investigation Agent
- OpenAI integration
- Investigation Agent
- Prompt engineering
- Function calling implementation

*Note: Adjust assignments based on team member strengths*

---

## Risk Mitigation Checklist

- [ ] **Backup plan if Forum API is unstable:** Use mock data generator
- [ ] **Backup plan if WebSocket fails:** Fall back to REST polling
- [ ] **Backup plan if OpenAI rate limits hit:** Cache responses aggressively
- [ ] **Backup plan if live demo has no fraud:** Show historical examples
- [ ] **Backup demo video recorded:** In case live demo breaks

---

## Success Criteria

### Minimum Viable Demo (Must Have)
- [ ] Dashboard showing integrity scores for 10+ markets
- [ ] At least 1 active fraud alert visible
- [ ] Investigation Agent can answer basic queries
- [ ] Live data from Forum API flowing

### Target Demo (Should Have)
- [ ] All 6 fraud detection algorithms working
- [ ] Real-time alerts appearing during demo
- [ ] Investigation Agent provides detailed analysis
- [ ] Historical fraud archive with 3+ examples
- [ ] Polished UI with smooth animations

### Stretch Demo (Nice to Have)
- [ ] Detect actual fraud during live demo
- [ ] Investigation Agent impresses judges with insights
- [ ] Mobile-responsive design
- [ ] Public deployment judges can access
- [ ] GitHub repo with clean code

---

## Hourly Progress Tracking

### Hour 0 ✅
- [ ] Project initialized
- [ ] Dependencies installed
- [ ] Supabase created

### Hour 1 ✅
- [ ] Database tables created
- [ ] Environment variables configured
- [ ] Forum API tested

### Hour 2 ✅
- [ ] Price-Index divergence detection working
- [ ] Order book spoofing detection working

### Hour 3 ✅
- [ ] Wash trading detection working
- [ ] Bot coordination detection working

### Hour 4 ✅
- [ ] Funding anomaly detection working
- [ ] Correlation break detection working

### Hour 5 ✅
- [ ] WebSocket listener working
- [ ] Data flowing to database

### Hour 6 ✅
- [ ] Alert deduplication working
- [ ] Background scheduler configured

### Hour 7 ✅
- [ ] OpenAI client integrated
- [ ] Function calling working

### Hour 8 ✅
- [ ] Investigation Agent responding to queries
- [ ] Conversation memory working

### Hour 9 ✅
- [ ] Dashboard displaying integrity scores
- [ ] Alert feed showing real-time alerts

### Hour 10 ✅
- [ ] Chat interface functional
- [ ] Market detail pages working

### Hour 11 ✅
- [ ] Historical archive displaying
- [ ] Charts rendering

### Hour 12 ✅
- [ ] Database seeded
- [ ] All algorithms tested

### Hour 13 ✅
- [ ] UI polished
- [ ] Demo script practiced

### Hour 14 ✅
- [ ] Deployed to Vercel
- [ ] Backup video recorded
- [ ] DEMO READY! 🚀

---

**Last Updated:** April 12, 2026
**Status:** Not Started
**Estimated Completion:** 14 hours from start

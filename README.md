# Truth Seeker — AI Market Integrity Agent for Forum

An AI-powered fraud detection system that monitors Forum's attention markets 24/7 to detect manipulation, spoofing, wash trading, and bot activity.

## 🎯 Project Status

**Current Phase:** Hour 2-5 — Fraud Detection Engine
**Completed:** ✅ Infrastructure setup, all 6 fraud detection algorithms, integrity scoring
**Next:** Data ingestion agent, Investigation Agent, Frontend

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│          4 Specialized Agents        │
├─────────────────────────────────────┤
│ 1. Data Ingestion Agent             │
│    → WebSocket monitoring           │
│                                     │
│ 2. Fraud Detection Agent            │
│    → 6 detection algorithms         │
│    → Integrity scoring              │
│                                     │
│ 3. Investigation Agent (OpenAI)     │
│    → Natural language explanations  │
│                                     │
│ 4. Alert Manager Agent              │
│    → Deduplication & delivery       │
└─────────────────────────────────────┘
```

## 📦 What's Built

### ✅ Infrastructure (Hour 0-2)
- [x] Next.js 14 + TypeScript + Tailwind
- [x] Project structure (`/agents`, `/lib`, `/app/api`)
- [x] Supabase database schema ([supabase-schema.sql](supabase-schema.sql))
- [x] Forum API client ([lib/forum-api/client.ts](lib/forum-api/client.ts))
- [x] Supabase client + queries ([lib/supabase/](lib/supabase/))
- [x] OpenAI client setup ([lib/openai/client.ts](lib/openai/client.ts))

### ✅ Fraud Detection Algorithms (Hour 2-5)
- [x] **Price-Index Divergence** — Detects price manipulation without attention growth
- [x] **Order Book Spoofing** — Detects large orders placed then quickly canceled
- [x] **Wash Trading** — Detects repetitive same-size trades (artificial volume)
- [x] **Bot Coordination** — Detects orders clustered at identical prices
- [x] **Funding Anomalies** — Detects unnatural funding rate patterns
- [x] **Correlation Breaks** — Detects when related markets diverge

- [x] **Integrity Scorer** — Combines all signals into 0-100 score

Location: [`/agents/fraud-detection/algorithms/`](agents/fraud-detection/algorithms/)

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.local` and fill in your API keys:
```env
# Forum API (get from team member working on Forum integration)
FORUM_API_BASE_URL=https://api.forum.market
FORUM_API_KEY=your_key_here
FORUM_WSS_URL=wss://api.forum.market/ws/v1

# Supabase (create project at supabase.com)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=your_openai_key
```

### 3. Set Up Supabase Database
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the URL and keys to `.env.local`
3. Open the SQL Editor in Supabase
4. Run the SQL from [supabase-schema.sql](supabase-schema.sql)
5. Verify tables were created successfully

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Next Steps

See [TODO.md](TODO.md) for the complete 14-hour hackathon plan.

### Immediate Next Tasks (Hour 5-7):
1. **Build WebSocket Data Ingestion Agent**
   - Connect to Forum WebSocket feeds
   - Store order book snapshots, trades, index updates
   - Implement reconnection logic

2. **Create Main Fraud Detection Agent**
   - Orchestrate all 6 algorithms
   - Run detection every 60 seconds
   - Generate and store fraud alerts

3. **Data Pipeline**
   - Background job scheduler
   - Alert deduplication
   - Database persistence

### Then (Hour 7-9):
4. **Investigation Agent**
   - OpenAI integration with function calling
   - Conversational fraud analysis
   - Natural language explanations

### Finally (Hour 9-14):
5. **Frontend Dashboard**
   - Live integrity scores for all markets
   - Real-time alert feed
   - Chat interface for Investigation Agent
   - Charts and visualizations

6. **Polish & Demo**
   - Seed historical fraud examples
   - Test all systems
   - Deploy to Vercel
   - Record backup demo video

## 📚 Documentation

- **[AGENTS.md](AGENTS.md)** — Complete agent architecture and best practices
- **[TODO.md](TODO.md)** — Hour-by-hour hackathon checklist
- **[project_plan.md](project_plan.md)** — Full project specification

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, Recharts
- **Backend:** Next.js API Routes, Supabase Edge Functions
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4
- **Data Sources:** Forum Market API (WebSocket + REST)
- **Deployment:** Vercel

## 🔍 Fraud Detection Signals

| Signal | Description | Severity |
|--------|-------------|----------|
| **Price-Index Divergence** | Price moves ±X% but index only ±Y% | High |
| **Order Book Spoofing** | Large orders placed then quickly canceled | High |
| **Wash Trading** | 70%+ of trades are identical size | Critical |
| **Bot Coordination** | 10+ orders at exact same price | Medium |
| **Funding Anomaly** | Funding direction mismatches price-index | Medium |
| **Correlation Break** | Related markets suddenly diverge | Low-Medium |

## 🎬 Demo Script (3 min)

1. **Hook (30s):** "Attention markets are vulnerable to manipulation. We built an AI watchdog."
2. **Dashboard (60s):** Show live integrity scores, click red-flagged market
3. **Investigation (45s):** Agent explains fraud patterns with evidence
4. **Alert (30s):** Show real-time fraud alert appearing
5. **Impact (15s):** "Protects traders, increases platform trust"

## 📝 License

Built for YC W26 Hackathon — Forum (Attention Markets)

---

**Status:** In Progress ⏱️
**Team:** [Your Team Name]
**Last Updated:** April 12, 2026

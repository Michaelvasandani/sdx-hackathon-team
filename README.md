# Truth Seeker - AI Market Integrity Agent 🔍

**Real-time fraud detection for Forum attention markets powered by multi-agent AI**

![Truth Seeker Dashboard](https://img.shields.io/badge/Status-Live-success) ![Next.js](https://img.shields.io/badge/Next.js-16.2-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

> **📁 Main Application:** The complete Next.js application is located in the [`truth-seeker/`](truth-seeker/) directory.

## 🎯 Overview

Truth Seeker is a sophisticated AI-powered fraud detection system that monitors Forum's attention markets 24/7 using six specialized algorithms and an autonomous detective agent. It helps traders identify manipulation, spoofing, and wash trading before they lose money.

**Live Demo:** Run `cd truth-seeker && npm run dev` → [http://localhost:3000](http://localhost:3000)

## ✨ Key Features

### 🤖 Multi-Agent Architecture
- **Fraud Detection Agent**: Runs 6 parallel algorithms analyzing price divergence, spoofing, wash trading, bot coordination, funding anomalies, and correlation breaks
- **Investigation Agent**: GPT-4-powered autonomous detective that investigates suspicious markets and provides natural language explanations
- **Data Ingestion Agent**: Continuously fetches and normalizes data from Forum's REST API
- **Alert Manager**: Orchestrates fraud alerts with confidence scoring and deduplication

### 📊 Real-Time Monitoring
- Analyzes 39+ live Forum markets every 30 seconds
- Displays integrity scores (0-100) with color-coded risk levels
- Auto-refreshing dashboard with live alerts
- Terminal-inspired dark theme interface

### 🔬 Evidence-Based Detection
- **Mathematically verified algorithms** - not "vibe coded"
- 21 unit tests with known inputs/outputs
- Synthetic fraud scenario testing
- Real data validation against live markets

## 🚀 Quick Start

### Prerequisites
- Node.js 20.9.0 or higher
- npm or yarn
- OpenAI API key (for AI agent features)

### Installation

```bash
# Navigate to the application directory
cd truth-seeker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

The app will start on `http://localhost:3000` with hot-reloading enabled.

### Production Build

```bash
cd truth-seeker
npm run build
npm start
```

## 🧮 How It Works

### Six Fraud Detection Algorithms

**🟢 Price-Index Divergence (30% weight)**
- Detects when market price moves significantly without matching attention growth
- Compares 24h price change vs 24h index change
- Alert threshold: ≥15% divergence
- Example: Price pumps +50% while attention only grows +10% = ALERT

**🟡 Order Book Spoofing (25% weight)**
- Identifies fake liquidity where large orders are placed and quickly canceled
- Tracks rapid order book changes
- Alert threshold: 5+ spoofing events
- Example: 10,000 share bid appears for 2 seconds then cancels

**🟠 Wash Trading (20% weight)**
- Detects self-trading patterns to inflate volume
- Looks for repetitive same-size trades
- Alert threshold: ≥50% wash trading probability
- Example: 100 share trades every 30 seconds at exact same price

**🟣 Bot Coordination (10% weight)**
- Identifies coordinated bot networks placing identical orders
- Detects simultaneous orders at same price
- Example: 5 bots all place 500 share orders at $10.00 within 1 second

**🔴 Funding Anomaly (10% weight)**
- Detects unnatural funding rate patterns
- Statistical analysis vs normal market behavior
- Alert threshold: Score ≥30

**🔵 Correlation Break (5% weight)**
- Flags when a market moves independently from similar markets
- Suggests isolated manipulation rather than organic trends
- Alert threshold: Score ≥30

### Integrity Scoring Formula

```typescript
score = 100 - weighted_penalty

weighted_penalty =
  (price_index_divergence × 0.30) +
  (order_book_spoofing × 0.25) +
  (wash_trading × 0.20) +
  (bot_coordination × 0.10) +
  (funding_anomaly × 0.10) +
  (correlation_break × 0.05)

Risk Levels:
- 80-100: Safe 🟢 (minimal fraud signals)
- 50-79: Moderate 🟡 (some concerning signals)
- 30-49: High 🔴 (multiple fraud indicators)
- 0-29: Critical 🚨 (severe manipulation detected)
```

## 📁 Repository Structure

```
sdx-hackathon-team/
├── truth-seeker/              # Main Next.js Application
│   ├── app/
│   │   ├── page.tsx          # Dashboard
│   │   ├── demo/page.tsx     # Interactive fraud demo
│   │   ├── market/[ticker]/  # Market detail pages
│   │   └── api/              # API routes
│   ├── agents/
│   │   ├── fraud-detection/  # 6 detection algorithms
│   │   └── investigation/    # GPT-4 powered agent
│   ├── components/           # React components
│   ├── lib/                  # Utilities & API clients
│   └── tests/               # Verification tests
│
├── README.md                 # This file
└── [Legacy test files]       # Standalone prototypes
```

**⚠️ Important:** All active development is in the [`truth-seeker/`](truth-seeker/) directory. Root-level files are legacy prototypes.

## 🔧 Configuration

Create `truth-seeker/.env.local`:

```env
# OpenAI API (Required for AI Investigation Agent)
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4

# Forum API (Already configured - no key needed)
FORUM_API_BASE_URL=https://api.forum.market/v1
FORUM_WSS_URL=wss://api.forum.market/ws/v1

# Supabase Database (Optional - not required for demo)
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

**Note:** Only `OPENAI_API_KEY` is required. The Forum API is public and needs no authentication.

## 🧪 Testing & Verification

```bash
cd truth-seeker

# Run complete verification suite
npx tsx verify-all.ts

# Test individual algorithms
npx tsx test-unit-tests.ts

# Validate against live Forum data
npx tsx test-validate-real-data.ts

# Test synthetic fraud scenarios
npx tsx test-synthetic-fraud.ts
```

## 📊 Dashboard Pages

### 1. Main Dashboard (`/`)
- How It Works section with algorithm explanations
- Market statistics and distribution
- Sortable/filterable market table
- Real-time updates every 30 seconds

### 2. Market Detail (`/market/[ticker]`)
- 24h integrity score trend chart
- Fraud signal breakdown visualization
- Price vs Index divergence analysis
- Active fraud alerts with evidence
- AI chat for natural language explanations

### 3. Demo Page (`/demo`)
- 5 pre-built investigation scenarios
- Interactive agent playback
- Evidence visualizations
- Speed control for demonstrations

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.2, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes, TypeScript
- **AI**: OpenAI GPT-4 for Investigation Agent
- **Database**: Supabase (PostgreSQL) - optional
- **Data Source**: Forum Market API (https://api.forum.market/v1)
- **Deployment**: Vercel-ready

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to application directory
cd truth-seeker

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# - OPENAI_API_KEY
# - OPENAI_MODEL
```

Works on Vercel, Netlify, Railway, AWS Amplify, or any Node.js hosting.

## 🎨 User Interface

Features a terminal-inspired dark theme:
- Near-black background (#0a0a0a)
- Monospace fonts (Cascadia Code, Source Code Pro)
- Color-coded risk levels (green/yellow/orange/red borders)
- Uppercase headers with letter-spacing
- High-contrast white text for readability

## 📈 Performance & Results

- **Response Time:** <500ms for full market analysis
- **Real Market Testing:** 39 markets analyzed, all scored 90-100 (Safe)
- **Verification:** 21/21 unit tests passed
- **No False Positives:** Correctly identifies healthy markets

## 🔐 Security & Privacy

- ✅ No personal data collection - Only public market data
- ✅ Read-only API access - Cannot modify Forum markets
- ✅ No authentication required - Public data only
- ✅ Server-side AI calls - OpenAI key never exposed to client
- ✅ Open source - Full transparency

## 📖 Documentation

- **[truth-seeker/README.md](truth-seeker/README.md)** - Complete application documentation
- **[AGENTS.md](AGENTS.md)** - Agent architecture and best practices
- **[project_plan.md](project_plan.md)** - Full project specification
- **[TODO.md](TODO.md)** - Development roadmap

## 🤝 Contributing

See [truth-seeker/README.md](truth-seeker/README.md#-contributing) for detailed contribution guidelines.

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **Forum Team** - For building attention markets and providing API access
- **OpenAI** - For GPT-4 powering the Investigation Agent
- **YC W26 Cohort** - For feedback and support

---

**Built with ❤️ for the Forum AI Agents Hackathon**

*Truth Seeker: Making attention markets safer, one algorithm at a time.*

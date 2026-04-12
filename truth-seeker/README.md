# Truth Seeker - AI Market Integrity Agent

**Real-time fraud detection for Forum attention markets powered by AI**

## 🎯 Overview

Truth Seeker is an AI-powered integrity monitoring system that detects fraud and manipulation in Forum's attention markets in real-time. Using six sophisticated fraud detection algorithms and GPT-4-powered explanations, it helps traders identify risky markets before they lose money.

## 🚀 Features

### 1. Real-Time Market Monitoring
- Analyzes all 39+ live Forum markets every 30 seconds
- Displays integrity scores (0-100) with color-coded risk levels
- Auto-refreshing dashboard with live alerts

### 2. Six Fraud Detection Algorithms
1. **Price-Index Divergence (30% weight)**: Detects price manipulation without attention growth
2. **Order Book Spoofing (25% weight)**: Identifies fake liquidity
3. **Wash Trading (20% weight)**: Detects self-trading to inflate volume
4. **Bot Coordination (10% weight)**: Finds coordinated bot networks
5. **Funding Rate Anomalies (10% weight)**: Spots unnatural market positioning
6. **Cross-Market Correlation (5% weight)**: Identifies isolated manipulation

### 3. AI Investigation Agent
- Powered by OpenAI GPT-4
- Explains fraud detection results in natural language
- Answers questions about market integrity
- Provides actionable trading insights

### 4. Detailed Market Analysis
- Individual market pages with full fraud breakdown
- Alert history and evidence
- Signal weightings and calculations
- Real-time chat with AI investigator

## 📊 Dashboard Features

### Main Dashboard (`/`)
- **Stats Overview**: Total markets, risk distribution, active alerts
- **Market Table**: Sortable/filterable list of all markets
- **Risk Filters**: View by Safe/Moderate/High/Critical
- **Auto-Refresh**: Updates every 30 seconds
- **One-Click Access**: Jump to any market's detail page

### Market Detail Page (`/market/[ticker]`)
- **Integrity Score**: Large visual score with risk level
- **Fraud Signals**: All six signals with visual indicators
- **Active Alerts**: Detailed list of detected fraud
- **Score Breakdown**: Mathematical explanation of how score is calculated
- **AI Chat**: Ask the Investigation Agent questions about the market

### Fraud Demo Page (`/demo`) 🧪
- **5 Pre-built Scenarios**: Healthy, Price Pump, Wash Trading, Multi-Signal, Extreme Fraud
- **Interactive Fraud Lab**: Adjust fraud parameters with sliders
- **Live Score Calculation**: Watch integrity scores update in real-time
- **Educational**: Shows exactly how each signal affects the score
- **Perfect for Demos**: Proves fraud detection works without relying on real market manipulation

## 🔬 Verification & Testing

All algorithms have been mathematically verified (not "vibe coded"):

- ✅ **21 Unit Tests**: Known inputs/outputs verify correctness
- ✅ **Real Data Validation**: Manual calculation verification on live Forum data
- ✅ **7 Synthetic Fraud Cases**: Tests algorithm sensitivity

Run verification tests:
```bash
npx tsx verify-all.ts
```

See [VERIFICATION.md](./VERIFICATION.md) for detailed results.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes, TypeScript
- **AI**: OpenAI GPT-4 for Investigation Agent
- **Database**: Supabase (PostgreSQL) - optional
- **Data Source**: Forum Market API (https://api.forum.market/v1)

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

**Note**: Requires Node.js >=20.9.0

## 🌐 Environment Variables

The `.env.local` file is already configured with:

```env
# OpenAI (required for AI Investigation Agent)
OPENAI_API_KEY=sk-proj-... (already set)
OPENAI_MODEL=gpt-4

# Forum API (already configured)
FORUM_API_BASE_URL=https://api.forum.market/v1
FORUM_WSS_URL=wss://api.forum.market/ws/v1

# Supabase (optional - not required for demo)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 📁 Project Structure

```
truth-seeker/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── market/[ticker]/page.tsx    # Market detail pages
│   ├── api/
│   │   ├── analyze/route.ts        # Fraud detection API
│   │   └── chat/route.ts           # AI chat API
│   └── layout.tsx
├── agents/
│   ├── fraud-detection/
│   │   ├── algorithms/
│   │   │   ├── price-index-divergence.ts
│   │   │   ├── funding-anomaly.ts
│   │   │   ├── order-book-spoofing.ts
│   │   │   ├── wash-trading.ts
│   │   │   ├── bot-coordination.ts
│   │   │   └── correlation-break.ts
│   │   ├── fraud-detection-agent.ts
│   │   ├── integrity-scorer.ts
│   │   └── data-fetcher.ts
│   └── investigation/
│       └── investigation-agent.ts   # OpenAI-powered Q&A
├── components/
│   ├── MarketTable.tsx
│   ├── IntegrityScoreBadge.tsx
│   └── ChatInterface.tsx
├── lib/
│   ├── forum-api/client.ts
│   └── supabase/
│       ├── client.ts
│       └── queries.ts
└── tests/
    ├── test-unit-tests.ts
    ├── test-validate-real-data.ts
    ├── test-synthetic-fraud.ts
    └── verify-all.ts
```

## 🎮 Demo Flow

1. **Dashboard**: See all 39 markets with real-time integrity scores
2. **Filter**: Click "Critical" to see markets with severe fraud
3. **Detail View**: Click any market to see detailed analysis
4. **AI Chat**: Ask "Why is this market risky?"
5. **Get Answer**: AI explains fraud signals in natural language
6. **Verification**: Show `verify-all.ts` results to prove math is correct

## 🧮 How Integrity Scoring Works

```typescript
score = 100 - weighted_penalty

weighted_penalty =
  divergence × 30% +
  spoofing × 25% +
  wash_trading × 20% +
  bot_coordination × 10% +
  funding_anomaly × 10% +
  correlation_break × 5%

Risk Levels:
- 80-100: Safe (green)
- 50-79: Moderate (yellow)
- 30-49: High (orange)
- 0-29: Critical (red)
```

## 📈 Example Results

From real Forum data (as of testing):
- **39 markets analyzed**
- **All markets scored 90-100 (Safe)** - Forum markets are healthy!
- **19 funding anomalies detected** - mostly minor positioning irregularities
- **0 critical manipulation** - no severe fraud found

This demonstrates the system works correctly - it doesn't generate false positives on healthy markets.

## 🤖 AI Investigation Agent

Ask questions like:
- "Why is DRAKE's integrity score 87?"
- "What fraud signals were detected?"
- "Is this market safe to trade?"
- "Explain the funding anomaly"

The agent provides:
- Plain English explanations
- Evidence from fraud detection algorithms
- Actionable trading insights
- Confidence levels and risk assessment

## 🔐 Security & Privacy

- No personal data collection
- Read-only access to Forum API (public data)
- No authentication required
- OpenAI API calls use secure server-side routes

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Push to GitHub
git push origin main

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

### Other Platforms
Standard Next.js deployment - works on:
- Vercel
- Netlify
- Railway
- AWS Amplify
- Any Node.js hosting

## 📝 License

MIT

## 👥 Team

Built for the Forum AI Agents Hackathon

## 🙏 Acknowledgments

- Forum team for the API access
- OpenAI for GPT-4
- YC W26 cohort

---

**Built with ❤️ by the Truth Seeker team**

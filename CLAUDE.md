# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Truth Seeker** is a multi-agent AI fraud detection system for Forum's attention markets. It monitors markets 24/7 to detect manipulation, spoofing, wash trading, and bot activity using six fraud detection algorithms and OpenAI-powered investigation agents.

**Repository Structure:**
- Root level: Legacy test scripts and standalone agent prototypes
- `truth-seeker/`: Main Next.js application (primary working directory)

## Common Commands

### Development (in truth-seeker/)
```bash
cd truth-seeker
npm run dev          # Start Next.js dev server on localhost:3000
npm run build        # Build production bundle
npm start            # Start production server
npm run lint         # Run ESLint
```

### Running Tests (root or truth-seeker/)
```bash
# Run with tsx (TypeScript execution)
npx tsx test-fraud-detection.ts              # Test fraud detection algorithms
npx tsx test-forum-api.ts                     # Test Forum API client
npx tsx debug-markets.ts                      # Debug market data fetching

# In truth-seeker/
npx tsx test-synthetic-fraud.ts              # Test with synthetic fraud data
npx tsx test-validate-real-data.ts           # Validate real Forum data
npx tsx test-unit-tests.ts                   # Unit tests for algorithms
npx tsx verify-all.ts                         # Run all verification tests
npx tsx test-agent.ts                         # Test investigation agent
```

### Testing Individual Components
```bash
# Test a single fraud detection algorithm
npx tsx -e "import { detectPriceManipulation } from './agents/fraud-detection/algorithms/price-index-divergence'; console.log(detectPriceManipulation('TEST', 100, 80, 95, 90));"
```

## Architecture

### Multi-Agent System

The system uses 4 specialized agents:

1. **Data Ingestion Agent** (`agents/*/data-fetcher.ts`)
   - Fetches data from Forum REST API
   - Normalizes market data for analysis
   - No WebSocket implementation yet (planned)

2. **Fraud Detection Agent** (`agents/fraud-detection/fraud-detection-agent.ts`)
   - Orchestrates 6 detection algorithms
   - Calculates integrity scores (0-100)
   - Generates fraud alerts with confidence scores

3. **Investigation Agent** (`agents/investigation/investigation-agent.ts`)
   - OpenAI GPT-4 powered conversational analysis
   - Explains fraud patterns in natural language
   - Provides context-aware market analysis

4. **Alert Manager Agent** (not yet implemented)
   - Planned for deduplication and delivery

### Fraud Detection Algorithms

All located in `agents/fraud-detection/algorithms/`:

1. **Price-Index Divergence** (30% weight): Detects price manipulation without attention growth
2. **Order Book Spoofing** (25% weight): Detects fake liquidity via rapid order cancellations
3. **Wash Trading** (20% weight): Detects self-trading patterns (repetitive same-size trades)
4. **Bot Coordination** (10% weight): Detects clustered orders at identical prices
5. **Funding Anomaly** (10% weight): Detects unnatural funding rate patterns
6. **Correlation Break** (5% weight): Detects when related markets diverge

**Integrity Scoring** (`integrity-scorer.ts`):
- Combines all signals with weighted scoring
- Returns 0-100 score where:
  - 80-100: Safe (🟢)
  - 50-79: Moderate risk (🟡)
  - 30-49: High risk (🔴)
  - 0-29: Critical risk (🚨)

### API Routes (truth-seeker/app/api/)

- `/api/analyze`: Run fraud detection on all markets
- `/api/chat`: Chat with Investigation Agent
- `/api/agent`: Legacy agent endpoint
- Additional routes in `/api/integrity/`, `/api/alerts/`, `/api/investigate/` (planned)

### Data Sources

**Forum Market API** (documented in `forum_api.md`):
- Base URL: `https://api.forum.market/v1`
- No authentication required (public API)
- Key endpoints:
  - `GET /markets` - List all markets
  - `GET /market/{ticker}` - Get market details
  - `GET /indices/{ticker}` - Get index breakdown
  - `GET /funding/{ticker}` - Get funding rate

**Client Location**: `lib/forum-api/client.ts`

### Database (Supabase)

Schema defined in `truth-seeker/supabase-schema.sql`:
- `markets` - Forum market metadata
- `integrity_scores` - Time-series integrity scores
- `fraud_alerts` - Detected fraud events
- `order_book_snapshots` - Historical order books
- `trade_history` - Trade events

**Client Location**: `lib/supabase/client.ts` and `queries.ts`

## Development Patterns

### Agent File Structure
```
/agents/
  /fraud-detection/
    fraud-detection-agent.ts       # Main orchestrator
    data-fetcher.ts                # Forum API data fetcher
    algorithms/                    # Individual detection algorithms
      price-index-divergence.ts
      order-book-spoofing.ts
      wash-trading.ts
      bot-coordination.ts
      funding-anomaly.ts
      correlation-break.ts
    integrity-scorer.ts            # Weighted scoring
  /investigation/
    investigation-agent.ts         # OpenAI-powered investigation
```

### Code Duplication Note
There is intentional duplication between root-level files and `truth-seeker/` subdirectory. The `truth-seeker/` directory is the actively developed Next.js app, while root-level scripts are standalone prototypes and tests.

### Adding New Fraud Detection Algorithms

1. Create new file in `agents/fraud-detection/algorithms/`
2. Export a function that returns an alert object with this structure:
```typescript
{
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;  // 0-100
  description: string;
  evidence: Record<string, any>;
}
```
3. Import and call in `fraud-detection-agent.ts` `analyzeSingleMarket()`
4. Update `IntegritySignals` type in `integrity-scorer.ts`
5. Add weight to scoring formula in `calculateIntegrityScore()`

### Environment Variables

Required in `.env.local`:
```env
# Forum API
FORUM_API_BASE_URL=https://api.forum.market/v1

# Supabase (optional for MVP)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (for Investigation Agent)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4
```

### Testing Strategy

**Unit Tests** (`test-unit-tests.ts`):
- Test each algorithm with known fraud patterns
- Use synthetic data

**Integration Tests** (`test-validate-real-data.ts`):
- Test against live Forum API
- Validate data fetching and analysis pipeline

**Synthetic Fraud Tests** (`test-synthetic-fraud.ts`):
- Test with artificially created fraud scenarios
- Verify detection confidence and severity

**Verification** (`verify-all.ts`):
- Run complete end-to-end verification
- Check all systems operational

## Key Implementation Details

### Fraud Detection Process

1. **Data Fetching** (`data-fetcher.ts`):
   - Calls Forum API `/markets` endpoint
   - Fetches detailed data for each market
   - Calculates 24h price/index changes
   - Returns `MarketAnalysisData[]`

2. **Single Market Analysis** (`fraud-detection-agent.ts` → `analyzeSingleMarket`):
   - Runs all enabled algorithms
   - Collects alerts and signal scores
   - Calculates weighted integrity score
   - Returns `FraudDetectionResult`

3. **Batch Analysis** (`analyzeAllMarkets`):
   - Iterates through all markets
   - Logs progress with emoji indicators
   - Returns summary statistics

4. **Storage** (optional, commented out):
   - Store integrity scores to Supabase
   - Store fraud alerts with evidence
   - Enable real-time updates

### Investigation Agent Flow

Located in `agents/investigation/investigation-agent.ts`:

1. Accept market context (integrity score, signals, alerts)
2. Format context for OpenAI
3. Send to GPT-4 with system prompt
4. Return natural language explanation

**System Prompt Emphasizes**:
- Clear, non-technical language
- Evidence-based explanations
- Actionable insights
- Context comparison to healthy markets

## Important Constraints

### Fraud Detection Safety
- Never claim 100% certainty
- Use confidence scores and "suspected"/"potential" language
- Always provide evidence for alerts
- Let users make final trading decisions

### API Rate Limits
- Forum API: No documented rate limit (public API)
- OpenAI: Standard rate limits apply
- Handle gracefully with try/catch

### Data Availability
Current limitations (as of implementation):
- No WebSocket support yet (planned)
- Some algorithms incomplete due to missing endpoints
- Order book spoofing needs `/orderbook/{ticker}` endpoint
- Wash trading needs `/trades/{ticker}` endpoint

## Documentation References

See these files for detailed information:
- `AGENTS.md` - Complete agent architecture and best practices
- `project_plan.md` - Full project specification and hackathon plan
- `forum_api.md` - Forum API endpoint documentation
- `README.md` - Project overview and setup instructions
- `TODO.md` - Outstanding tasks and roadmap
- `VERIFICATION.md` - Verification test results

## Naming Conventions

- Files: `kebab-case.ts`
- Functions: `camelCase()`
- Types/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

## Git Workflow

Main branch: `main` (clean working tree)
When making changes, commit with descriptive messages following pattern:
`[COMPONENT] Description` (e.g., `[FRAUD_DETECTION] Add correlation break algorithm`)

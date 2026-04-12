# Vibe IPO Ranker — Design Spec

**Date:** 2026-04-12
**Status:** Approved

---

## Overview

A new section of the existing Truth Seeker app that surfaces the top 10 Forum markets with high growth velocity and low current attention — framed as "pre-IPO" assets. The goal is to find emerging trends before they peak.

---

## Goals

- Identify markets with high attention index growth velocity that haven't yet been widely discovered
- Rank them by an "IPO potential" score (0–100)
- Display as a ranked top-10 list within the existing Next.js app

---

## Non-Goals

- External data sources (Google Trends, social media) — Forum API only
- Real-time polling / WebSocket updates — page-load fetch is sufficient
- Historical tracking of IPO scores over time
- Clickable detail pages per market (future work)

---

## Architecture

Two new files added to the existing Next.js app:

```
app/
  api/
    ipo-ranker/
      route.ts        ← GET handler: fetch markets, score, return top 10
  ipo-ranker/
    page.tsx          ← React page: renders the ranked list
```

No new dependencies. Uses the existing `forumAPI.listAllMarkets()` from `lib/forum-api/client.ts`.

---

## Scoring Formula

All scoring is computed in `app/api/ipo-ranker/route.ts` at request time.

### Step 1 — Filter

Only consider markets where:
- `live === true`
- `changeIndexPercentPastDay > 0` (declining attention is not pre-IPO)

### Step 2 — Normalize each signal (min-max across filtered markets)

```
normalize(value, min, max) = max === min ? 50 : (value - min) / (max - min) * 100
```

If all filtered markets have the same value for a signal (edge case), normalize returns 50 so the score remains valid.

Three signals:

| Signal | Field | Weight | Notes |
|--------|-------|--------|-------|
| Velocity | `changeIndexPercentPastDay` | 60% | Primary signal |
| Volume | `volumePastDay` | 20% | Higher volume = more confirmation |
| Discovery | `1 / (openInterest + 1)` | 20% | Lower OI = more undiscovered |

### Step 3 — Compute IPO score

```
ipoScore = (velocityScore * 0.60) + (volumeScore * 0.20) + (discoveryScore * 0.20)
```

### Step 4 — Sort descending, take top 10

---

## Stage Labels

| Score Range | Label | Color |
|-------------|-------|-------|
| 80–100 | PRE-IPO | Green |
| 60–79 | SERIES B | Yellow |
| 40–59 | SERIES A | Purple |
| 0–39 | SEED | Gray |

---

## API Response Shape

`GET /api/ipo-ranker` returns:

```typescript
{
  updatedAt: string,       // ISO timestamp
  markets: Array<{
    rank: number,
    ticker: string,
    name: string,
    ipoScore: number,      // 0–100, rounded to 1 decimal
    stage: 'PRE-IPO' | 'SERIES B' | 'SERIES A' | 'SEED',
    changeIndexPercentPastDay: number,
    volumePastDay: number,
    openInterest: number,
    // score breakdown for tooltip
    breakdown: {
      velocityScore: number,
      volumeScore: number,
      discoveryScore: number,
    }
  }>
}
```

---

## UI — `/ipo-ranker` Page

### Layout

Vertical ranked list (Option A from design review). Each card shows:

- Rank number (`#1`, `#2`, …)
- Ticker + name
- Stage badge (color-coded)
- Key metrics: `↑ X% index/day`, `Vol Xk`, `OI X`
- IPO score (large, right-aligned, color matches stage)
- "Undiscovered" hint label when OI is in the bottom 25% of the filtered market set (same set used for scoring)

### Hover / tooltip

Score breakdown: `velocity 60% · volume 20% · discovery 20%`

### Header

- Title: "Vibe IPO Ranker"
- Subtitle: "Emerging trends with low attention but high growth velocity"
- Last updated timestamp
- Stage legend row (PRE-IPO / SERIES B / SERIES A / SEED)

### Refresh

Data fetched on page load. No auto-polling for hackathon scope.

---

## Data Flow

```
page.tsx
  → fetch('/api/ipo-ranker')
    → forumAPI.listAllMarkets()
    → filter (live + positive index change)
    → normalize signals
    → compute ipoScore
    → sort + slice top 10
  ← ranked markets JSON
→ render ranked list
```

---

## Error Handling

- If Forum API is unreachable, return a 500 with `{ error: "Failed to fetch markets" }`
- Page shows an error state with a retry button
- Empty state if no markets pass the filter (unlikely but handled)

---

## Out of Scope (Future)

- Multi-timeframe acceleration scoring (1h / 6h / 24h windows)
- Supabase persistence of historical IPO scores
- Navigation link from the main fraud detection dashboard
- Category filtering (music / gaming / brands)

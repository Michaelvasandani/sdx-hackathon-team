# IPO Ranker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/ipo-ranker` page and `/api/ipo-ranker` endpoint that surfaces the top 10 Forum markets by IPO potential — high attention-index growth velocity, scored and ranked in a styled ranked-list UI.

**Architecture:** Single `GET /api/ipo-ranker` route fetches all markets via the existing `listMarkets()` helper, filters to live markets with positive index-change velocity, normalizes three signals (velocity 60%, volume 20%, discovery 20%), and returns the top 10 scored entries. A React page fetches that endpoint and renders a ranked card list.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, existing `lib/forum.ts` client.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/forum.ts` | Add `changeIndexPercentPastDay` and `changeIndexPastDay` to `Market` interface |
| Create | `app/api/ipo-ranker/route.ts` | Score markets, return top 10 as JSON |
| Create | `app/ipo-ranker/page.tsx` | Fetch `/api/ipo-ranker` and render ranked list |

---

## Task 1: Extend the `Market` type with index change fields

The existing `Market` interface in `lib/forum.ts` is missing `changeIndexPercentPastDay`. The Forum API returns it (it's defined in `lib/forum-api/client.ts`). Add it so the scoring route can use it.

**Files:**
- Modify: `lib/forum.ts:69-89` (the `Market` interface)

- [ ] **Step 1: Add the two missing fields to the `Market` interface**

Open `lib/forum.ts`. Find the `Market` interface (starts around line 69). Add the two index-change fields after `changePastDay`:

```typescript
export interface Market {
  ticker: string;
  name: string;
  index: string;
  category: string;
  subCategory: string;
  live: boolean;
  lastPrice: number;
  bestBid: number;
  bestAsk: number;
  openInterest: number;
  volumePastDay: number;
  highPastDay: number;
  lowPastDay: number;
  changePercentPastDay: number;
  changePastDay: number;
  changeIndexPercentPastDay: number;   // ← add this
  changeIndexPastDay: number;          // ← add this
  lastFunding: string;
  movingFundingRate: number;
  lastSettledFundingRate: number;
  cumFunding: number;
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
cd /c/Users/pixel/Downloads/sdx-hackathon-team
npx tsc --noEmit
```

Expected: no errors. If the API doesn't return these fields at runtime they'll be `undefined` — that's handled in Task 2 with a fallback.

- [ ] **Step 3: Commit**

```bash
git add lib/forum.ts
git commit -m "feat: add changeIndexPercentPastDay to Market type"
```

---

## Task 2: Create the `/api/ipo-ranker` route

**Files:**
- Create: `app/api/ipo-ranker/route.ts`

- [ ] **Step 1: Verify the endpoint doesn't exist yet**

```bash
curl http://localhost:3000/api/ipo-ranker
```

Expected: 404 (Next.js "not found").

- [ ] **Step 2: Create the route file**

Create `app/api/ipo-ranker/route.ts` with this content:

```typescript
import { listMarkets } from "@/lib/forum";
import type { Market } from "@/lib/forum";

// ── Types ──────────────────────────────────────────────────────────────────

type Stage = "PRE-IPO" | "SERIES B" | "SERIES A" | "SEED";

interface IpoEntry {
  rank: number;
  ticker: string;
  name: string;
  ipoScore: number;
  stage: Stage;
  changeIndexPercentPastDay: number;
  volumePastDay: number;
  openInterest: number;
  undiscovered: boolean;
  breakdown: {
    velocityScore: number;
    volumeScore: number;
    discoveryScore: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

function getStage(score: number): Stage {
  if (score >= 80) return "PRE-IPO";
  if (score >= 60) return "SERIES B";
  if (score >= 40) return "SERIES A";
  return "SEED";
}

function scoreMarkets(markets: Market[]): IpoEntry[] {
  // Filter: live markets with positive index velocity
  // Fall back to changePercentPastDay if changeIndexPercentPastDay is missing
  const candidates = markets.filter(
    (m) =>
      m.live &&
      (m.changeIndexPercentPastDay ?? m.changePercentPastDay) > 0
  );

  if (candidates.length === 0) return [];

  // Compute per-candidate signals
  const velocities = candidates.map(
    (m) => m.changeIndexPercentPastDay ?? m.changePercentPastDay
  );
  const volumes = candidates.map((m) => m.volumePastDay);
  const discoveries = candidates.map((m) => 1 / (m.openInterest + 1));

  const minV = Math.min(...velocities);
  const maxV = Math.max(...velocities);
  const minVol = Math.min(...volumes);
  const maxVol = Math.max(...volumes);
  const minD = Math.min(...discoveries);
  const maxD = Math.max(...discoveries);

  // Threshold for "undiscovered" label: bottom 25% of open interest
  const sortedOI = [...candidates.map((m) => m.openInterest)].sort(
    (a, b) => a - b
  );
  const oiP25 = sortedOI[Math.floor(sortedOI.length * 0.25)];

  const scored = candidates.map((m, i) => {
    const velocityScore = normalize(velocities[i], minV, maxV);
    const volumeScore = normalize(volumes[i], minVol, maxVol);
    const discoveryScore = normalize(discoveries[i], minD, maxD);
    const ipoScore =
      velocityScore * 0.6 + volumeScore * 0.2 + discoveryScore * 0.2;

    return {
      ticker: m.ticker,
      name: m.name,
      ipoScore: Math.round(ipoScore * 10) / 10,
      stage: getStage(ipoScore),
      changeIndexPercentPastDay:
        m.changeIndexPercentPastDay ?? m.changePercentPastDay,
      volumePastDay: m.volumePastDay,
      openInterest: m.openInterest,
      undiscovered: m.openInterest <= oiP25,
      breakdown: {
        velocityScore: Math.round(velocityScore * 10) / 10,
        volumeScore: Math.round(volumeScore * 10) / 10,
        discoveryScore: Math.round(discoveryScore * 10) / 10,
      },
    };
  });

  // Sort descending, take top 10, add rank
  return scored
    .sort((a, b) => b.ipoScore - a.ipoScore)
    .slice(0, 10)
    .map((entry, i) => ({ rank: i + 1, ...entry }));
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const markets = await listMarkets();
    const ranked = scoreMarkets(markets);
    return Response.json({ updatedAt: new Date().toISOString(), markets: ranked });
  } catch (err) {
    console.error("/api/ipo-ranker error:", err);
    return Response.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Start the dev server if not already running**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000

- [ ] **Step 4: Hit the endpoint and verify the response shape**

```bash
curl -s http://localhost:3000/api/ipo-ranker | npx tsx -e "
const raw = require('fs').readFileSync('/dev/stdin','utf8');
const data = JSON.parse(raw);
console.log('updatedAt:', data.updatedAt);
console.log('count:', data.markets?.length);
console.log('top entry:', JSON.stringify(data.markets?.[0], null, 2));
"
```

Expected output shape:
```json
{
  "rank": 1,
  "ticker": "SOME_TICKER",
  "name": "Some Market",
  "ipoScore": 87.3,
  "stage": "PRE-IPO",
  "changeIndexPercentPastDay": 43.2,
  "volumePastDay": 12400,
  "openInterest": 340,
  "undiscovered": true,
  "breakdown": { "velocityScore": 95.1, "volumeScore": 72.0, "discoveryScore": 88.4 }
}
```

If `markets` is an empty array, the Forum API may have no live markets with positive index change — check the raw market data:

```bash
curl -s http://localhost:3000/api/markets | npx tsx -e "
const raw = require('fs').readFileSync('/dev/stdin','utf8');
const { markets } = JSON.parse(raw);
const live = markets.filter(m => m.live);
console.log('live markets:', live.length);
console.log('sample fields:', Object.keys(live[0] ?? {}));
"
```

If `changeIndexPercentPastDay` is absent from the real API response, the fallback to `changePercentPastDay` kicks in automatically.

- [ ] **Step 5: Commit**

```bash
git add app/api/ipo-ranker/route.ts
git commit -m "feat: add /api/ipo-ranker endpoint with IPO potential scoring"
```

---

## Task 3: Create the `/ipo-ranker` page

**Files:**
- Create: `app/ipo-ranker/page.tsx`

- [ ] **Step 1: Create the page file**

Create `app/ipo-ranker/page.tsx`:

```tsx
export const dynamic = "force-dynamic";

interface IpoEntry {
  rank: number;
  ticker: string;
  name: string;
  ipoScore: number;
  stage: "PRE-IPO" | "SERIES B" | "SERIES A" | "SEED";
  changeIndexPercentPastDay: number;
  volumePastDay: number;
  openInterest: number;
  undiscovered: boolean;
  breakdown: {
    velocityScore: number;
    volumeScore: number;
    discoveryScore: number;
  };
}

interface ApiResponse {
  updatedAt: string;
  markets: IpoEntry[];
  error?: string;
}

async function getRanking(): Promise<ApiResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/ipo-ranker`,
    { cache: "no-store" }
  );
  if (!res.ok) return { updatedAt: new Date().toISOString(), markets: [], error: "Failed to load" };
  return res.json();
}

const STAGE_STYLES: Record<IpoEntry["stage"], { badge: string; score: string; border: string }> = {
  "PRE-IPO":  { badge: "bg-green-900/40 text-green-400",   score: "text-green-400",  border: "border-green-500/20" },
  "SERIES B": { badge: "bg-yellow-900/40 text-yellow-400", score: "text-yellow-400", border: "border-zinc-700" },
  "SERIES A": { badge: "bg-purple-900/40 text-purple-400", score: "text-purple-400", border: "border-zinc-700" },
  "SEED":     { badge: "bg-zinc-800 text-zinc-400",         score: "text-zinc-400",   border: "border-zinc-800" },
};

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function RankCard({ entry }: { entry: IpoEntry }) {
  const s = STAGE_STYLES[entry.stage];
  return (
    <div
      className={`flex items-center gap-4 rounded-lg border bg-zinc-900 px-4 py-3 ${s.border}`}
      title={`Velocity ${entry.breakdown.velocityScore} · Volume ${entry.breakdown.volumeScore} · Discovery ${entry.breakdown.discoveryScore}`}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center text-xl font-black text-zinc-600">
        #{entry.rank}
      </div>

      {/* Ticker + signals */}
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="truncate font-bold text-white">{entry.ticker}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.badge}`}>
            {entry.stage}
          </span>
          {entry.undiscovered && (
            <span className="shrink-0 rounded-full bg-green-900/20 px-2 py-0.5 text-[9px] font-medium text-green-500">
              undiscovered
            </span>
          )}
        </div>
        <div className="flex gap-4 text-xs text-zinc-400">
          <span className="text-green-400 font-medium">
            ↑ {entry.changeIndexPercentPastDay.toFixed(1)}% index/day
          </span>
          <span>Vol {formatVolume(entry.volumePastDay)}</span>
          <span>OI {formatVolume(entry.openInterest)}</span>
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div className={`text-2xl font-black leading-none ${s.score}`}>
          {entry.ipoScore.toFixed(0)}
        </div>
        <div className="mt-0.5 text-[9px] uppercase tracking-widest text-zinc-600">
          IPO Score
        </div>
      </div>
    </div>
  );
}

export default async function IpoRankerPage() {
  const { updatedAt, markets, error } = await getRanking();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-1 flex items-baseline gap-3">
            <h1 className="text-2xl font-black tracking-tight">IPO Ranker</h1>
            <span className="text-xs text-zinc-500">
              Updated {new Date(updatedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Emerging trends with low attention but high growth velocity — ranked by IPO potential
          </p>
        </div>

        {/* Stage legend */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(["PRE-IPO", "SERIES B", "SERIES A", "SEED"] as const).map((stage) => (
            <span
              key={stage}
              className={`rounded-full px-3 py-1 text-xs font-bold ${STAGE_STYLES[stage].badge}`}
            >
              {stage} {stage === "PRE-IPO" ? "80–100" : stage === "SERIES B" ? "60–79" : stage === "SERIES A" ? "40–59" : "0–39"}
            </span>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!error && markets.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
            No markets with positive velocity right now. Check back soon.
          </div>
        )}

        {/* Ranked list */}
        {markets.length > 0 && (
          <div className="flex flex-col gap-2">
            {markets.map((entry) => (
              <RankCard key={entry.ticker} entry={entry} />
            ))}
          </div>
        )}

        {/* Score tooltip hint */}
        {markets.length > 0 && (
          <p className="mt-4 text-center text-xs text-zinc-600">
            Hover any card to see score breakdown: velocity 60% · volume 20% · discovery 20%
          </p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Open the page in the browser**

Navigate to http://localhost:3000/ipo-ranker

Expected: page loads showing top 10 ranked cards with colored stage badges, IPO scores, and signal metrics. No build errors in the terminal.

- [ ] **Step 3: Verify error state renders correctly**

Temporarily break the API URL to test the error state. In `page.tsx`, change the fetch URL to `http://localhost:3000/api/ipo-ranker-broken`, reload the page, confirm the red error message appears. Revert the URL.

- [ ] **Step 4: Commit**

```bash
git add app/ipo-ranker/page.tsx
git commit -m "feat: add /ipo-ranker page with ranked IPO potential cards"
```

---

## Self-Review Checklist

- [x] **Spec coverage**
  - "top 10 picks" → `slice(0, 10)` in `scoreMarkets()` ✓
  - "growth velocity first" → 60% weight on `changeIndexPercentPastDay` ✓
  - "Forum market data only" → only uses `listMarkets()` ✓
  - "new section" → `app/ipo-ranker/page.tsx` route ✓
  - "ranked list layout" → `RankCard` components in vertical flex column ✓
  - Stage labels PRE-IPO/SERIES B/SERIES A/SEED → `getStage()` + `STAGE_STYLES` ✓
  - "undiscovered" hint for bottom 25% OI → `oiP25` threshold ✓
  - Normalize guard for max===min → `if (max === min) return 50` ✓
  - Error state → handled in page ✓
  - Empty state → handled in page ✓
  - Score breakdown on hover → `title` attribute on `RankCard` ✓

- [x] **No placeholders** — all steps have complete code

- [x] **Type consistency**
  - `IpoEntry` defined in route and re-defined in page (no shared import needed — they're identical)
  - `Stage` type used consistently across `getStage()`, `STAGE_STYLES`, and `IpoEntry`
  - `scoreMarkets()` returns `IpoEntry[]` — matches what `GET()` serializes

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
        <div className="mb-0.5 flex items-center gap-2">
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
        <div className="mb-1 text-xs text-zinc-500 truncate">{entry.name}</div>
        <div className="flex gap-4 text-xs text-zinc-400">
          <span className="text-green-400 font-medium">
            ↑ {(entry.changeIndexPercentPastDay ?? 0).toFixed(1)}% index/day
          </span>
          <span>Vol {formatVolume(entry.volumePastDay ?? 0)}</span>
          <span>OI {formatVolume(entry.openInterest ?? 0)}</span>
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div className={`text-2xl font-black leading-none ${s.score}`}>
          {(entry.ipoScore ?? 0).toFixed(0)}
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
            <h1 className="text-2xl font-black tracking-tight">Vibe IPO Ranker</h1>
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

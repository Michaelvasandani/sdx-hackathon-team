import { listMarkets, getIndexHistory } from "@/lib/forum";

/**
 * GET /api/leaderboard
 * Returns markets grouped by category with their 24h momentum,
 * sorted by changePercentPastDay descending — used for the
 * Platform Speed Leaderboard panel on the frontend.
 */
export async function GET() {
  try {
    const markets = await listMarkets();

    // Group by category
    const grouped: Record<
      string,
      {
        ticker: string;
        name: string;
        category: string;
        lastPrice: number;
        changePercent24h: number;
        volumePastDay: number;
        openInterest: number;
        indexMomentum?: number;
      }[]
    > = {};

    for (const m of markets) {
      if (!m.live) continue;
      const cat = m.category ?? "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        ticker: m.ticker,
        name: m.name,
        category: m.category,
        lastPrice: m.lastPrice,
        changePercent24h: m.changePercentPastDay,
        volumePastDay: m.volumePastDay,
        openInterest: m.openInterest,
      });
    }

    // Sort each category by 24h change descending
    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a, b) => b.changePercent24h - a.changePercent24h);
    }

    // Optionally enrich top 3 per category with index history for trend line
    const TOP_N = 3;
    await Promise.allSettled(
      Object.values(grouped)
        .flatMap((items) => items.slice(0, TOP_N))
        .map(async (item) => {
          try {
            const history = await getIndexHistory(`${item.ticker}-IDX`);
            const values = (history?.values ?? []).map((v) => v.value);
            if (values.length >= 2) {
              // Simple momentum: % change over the last 10 index readings
              const window = values.slice(-10);
              item.indexMomentum =
                ((window.at(-1)! - window[0]) / window[0]) * 100;
            }
          } catch {
            // Index name might differ — silently skip enrichment
          }
        })
    );

    return Response.json({ leaderboard: grouped });
  } catch (err) {
    console.error("/api/leaderboard error:", err);
    return Response.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}

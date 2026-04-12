import { listMarkets } from "@/lib/forum";
import { scoreMarkets } from "@/lib/ipo-scorer";

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

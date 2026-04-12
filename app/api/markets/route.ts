import { listMarkets, getMarket, getCandles, getFundingRate } from "@/lib/forum";

/**
 * GET /api/markets
 * Returns all live markets.
 *
 * GET /api/markets?ticker=DRAKE
 * Returns a single market with candles and funding rate.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");

  try {
    if (ticker) {
      // Single market with enriched data
      const [market, candles, funding] = await Promise.all([
        getMarket(ticker),
        getCandles(ticker, 500),
        getFundingRate(ticker),
      ]);
      return Response.json({ market, candles, funding });
    }

    // All markets
    const markets = await listMarkets();
    return Response.json({ markets });
  } catch (err) {
    console.error("/api/markets error:", err);
    return Response.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}

import { getIndexHistory, getCandles } from "@/lib/forum";

/**
 * GET /api/historical?ticker=DRAKE&indexName=DRAKE-IDX
 * Returns index history + candle data for a market, used to
 * render the platform vs Forum overlay chart on the frontend.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const indexName = searchParams.get("indexName");

  if (!ticker || !indexName) {
    return Response.json(
      { error: "ticker and indexName are required" },
      { status: 400 }
    );
  }

  try {
    const [indexHistory, candles] = await Promise.all([
      getIndexHistory(indexName),
      getCandles(ticker, 2500),
    ]);

    return Response.json({ indexHistory, candles });
  } catch (err) {
    console.error("/api/historical error:", err);
    return Response.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { getMarket, getIndexHistory } from "@/lib/forum";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// --- Google Trends helper ---

async function getGoogleTrendsValue(keyword: string): Promise<number | null> {
  try {
    const googleTrends = await import("google-trends-api").then(
      (m) => m.default ?? m
    );
    const raw = await googleTrends.interestOverTime({
      keyword,
      startTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });
    const parsed = JSON.parse(raw);
    const timeline = parsed?.default?.timelineData ?? [];
    return timeline.at(-1)?.value?.[0] ?? null;
  } catch {
    console.warn(`Google Trends unavailable for "${keyword}"`);
    return null;
  }
}

// --- Z-score on a number series ---

function zScore(series: number[]): number {
  if (series.length < 2) return 0;
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const std = Math.sqrt(
    series.reduce((a, b) => a + (b - mean) ** 2, 0) / series.length
  );
  return std === 0 ? 0 : (series.at(-1)! - mean) / std;
}

// --- Claude analysis (only called when signal detected) ---

async function analyzeWithClaude(signals: {
  asset: string;
  category: string;
  forumIndexZ: number;
  googleTrendsZ: number | null;
  forumPrice: number;
  forumChange24h: number;
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system:
      "You are a cultural arbitrage analyst. Given platform signal z-scores and market data, identify if an arbitrage opportunity exists and explain it in 2-3 concise sentences. Focus on the lead/lag relationship between external signals and Forum's index. Be direct and specific.",
    messages: [
      {
        role: "user",
        content: `Asset: ${signals.asset} (${signals.category})
Forum Index Z-Score: ${signals.forumIndexZ.toFixed(2)}
Google Trends Z-Score: ${signals.googleTrendsZ !== null ? signals.googleTrendsZ.toFixed(2) : "unavailable"}
Forum Price: ${signals.forumPrice}
24h Price Change: ${signals.forumChange24h}%

Is there a latency arbitrage signal here? If Google Trends is spiking but Forum index is flat, that's a buy signal.`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

// --- POST /api/scan ---

export interface ScanAsset {
  ticker: string;
  indexName: string;
  trendsKeyword: string;
  category: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const assets: ScanAsset[] = body.assets;

    if (!assets?.length) {
      return Response.json({ error: "No assets provided" }, { status: 400 });
    }

    const results = await Promise.allSettled(
      assets.map(async (asset) => {
        const [marketData, indexHistory, trendsValue] = await Promise.all([
          getMarket(asset.ticker),
          getIndexHistory(asset.indexName),
          getGoogleTrendsValue(asset.trendsKeyword),
        ]);

        const indexSeries = (indexHistory?.values ?? [])
          .slice(-30)
          .map((v) => v.value);

        const forumIndexZ = zScore(indexSeries);

        // Baseline of 50 until we have stored historical Trends values in Supabase
        const googleTrendsZ =
          trendsValue !== null
            ? zScore([...Array(29).fill(50), trendsValue])
            : null;

        const isArbitrageSignal =
          googleTrendsZ !== null &&
          googleTrendsZ > 2.0 &&
          forumIndexZ < 0.5;

        const claudeAnalysis = isArbitrageSignal
          ? await analyzeWithClaude({
              asset: asset.ticker,
              category: asset.category,
              forumIndexZ,
              googleTrendsZ,
              forumPrice: marketData.lastPrice,
              forumChange24h: marketData.changePercentPastDay,
            })
          : null;

        return {
          ticker: asset.ticker,
          category: asset.category,
          forumIndexZ: +forumIndexZ.toFixed(3),
          googleTrendsZ:
            googleTrendsZ !== null ? +googleTrendsZ.toFixed(3) : null,
          forumPrice: marketData.lastPrice,
          forumChange24h: marketData.changePercentPastDay,
          isArbitrageSignal,
          claudeAnalysis,
          scannedAt: new Date().toISOString(),
        };
      })
    );

    const signals = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);

    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message);

    return Response.json({
      signals,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error("/api/scan error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

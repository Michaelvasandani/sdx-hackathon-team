/**
 * Sentiment Velocity API Route
 * GET /api/sentiment-velocity - Get all latest momentum signals
 * GET /api/sentiment-velocity?ticker=TICKER - Get specific ticker's signals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestVelocitySignals, getVelocitySignals, getAllMarkets } from '@/lib/supabase/queries';
import { analyzeSentimentVelocity, SentimentVelocityResult } from '@/agents/sentiment-velocity';

// Mock data fetcher (same from fraud-detection)
async function fetchMarketCandlesticks(
  ticker: string,
  limit: number = 100
): Promise<number[]> {
  // In production, this would fetch from Forum API
  // For now, return mock data for demonstration
  const basePrice = 45 + Math.random() * 10;
  const prices: number[] = [];

  for (let i = 0; i < limit; i++) {
    const change = (Math.random() - 0.5) * 0.5;
    prices.push(basePrice + change * i);
  }

  return prices;
}

async function fetchMarketIndex(ticker: string, limit: number = 100): Promise<number[]> {
  // In production, fetch from Forum API
  // For now, return mock data
  const baseIndex = 50 + Math.random() * 5;
  const indices: number[] = [];

  for (let i = 0; i < limit; i++) {
    const change = (Math.random() - 0.5) * 0.2;
    indices.push(baseIndex + change * i);
  }

  return indices;
}

// Generate baseline accelerations from historical data
function generateBaselineAccelerations(dataLength: number): number[] {
  // Mock baseline: normal distribution around 0 with small variance
  const baseline: number[] = [];
  for (let i = 0; i < Math.max(10, dataLength - 2); i++) {
    baseline.push((Math.random() - 0.5) * 0.1);
  }
  return baseline;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam ? parseInt(hoursParam) : 24;

    if (ticker) {
      // Get signals for specific ticker
      const signals = await getVelocitySignals(ticker, hours);

      return NextResponse.json({
        success: true,
        ticker,
        signal_count: signals.length,
        signals,
      });
    }

    // Get all latest signals
    const allSignals = await getLatestVelocitySignals();

    // Group by ticker and momentum_status for summary
    const summary = new Map<string, { stable: number; accelerating: number; diverging: number; critical: number }>();

    allSignals.forEach((signal) => {
      if (!summary.has(signal.ticker)) {
        summary.set(signal.ticker, { stable: 0, accelerating: 0, diverging: 0, critical: 0 });
      }

      const stats = summary.get(signal.ticker)!;
      const status = signal.momentum_status as keyof typeof stats;
      stats[status]++;
    });

    return NextResponse.json({
      success: true,
      total_signals: allSignals.length,
      markets_with_signals: summary.size,
      summary: Object.fromEntries(summary),
      signals: allSignals.slice(0, 50), // Return top 50
    });
  } catch (error) {
    console.error('Sentiment velocity GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sentiment velocity signals',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Manually trigger velocity analysis for a specific ticker
 * Body: { ticker: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { ticker } = await request.json();

    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Ticker required' },
        { status: 400 }
      );
    }

    // Fetch current market data
    const priceHistory = await fetchMarketCandlesticks(ticker, 60);
    const indexHistory = await fetchMarketIndex(ticker, 60);
    const baselinePriceAccelerations = generateBaselineAccelerations(priceHistory.length);
    const baselineIndexAccelerations = generateBaselineAccelerations(indexHistory.length);

    // Run sentiment velocity analysis
    const result = await analyzeSentimentVelocity(
      ticker,
      priceHistory,
      indexHistory,
      baselinePriceAccelerations,
      baselineIndexAccelerations
    );

    // Store result in database
    if (result.overall_momentum_score < 70) {
      // Only store if there's significant signal
      await Promise.all([
        ...result.velocity_analysis.price_signals.map((signal) =>
          storeVelocitySignal(
            ticker,
            signal.type,
            signal.severity,
            signal.confidence,
            result.momentum_status,
            result.overall_momentum_score,
            signal.window,
            signal.evidence
          )
        ),
        ...result.velocity_analysis.index_signals.map((signal) =>
          storeVelocitySignal(
            ticker,
            signal.type,
            signal.severity,
            signal.confidence,
            result.momentum_status,
            result.overall_momentum_score,
            signal.window,
            signal.evidence
          )
        ),
        ...result.divergence_alerts.map((alert) =>
          storeVelocityAlert(
            ticker,
            alert.type,
            alert.severity,
            alert.confidence,
            alert.description,
            alert.evidence
          )
        ),
      ]);
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Sentiment velocity POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze sentiment velocity',
      },
      { status: 500 }
    );
  }
}

// Re-export for internal use
async function storeVelocitySignal(
  ticker: string,
  signalType: any,
  severity: any,
  confidence: number,
  momentumStatus: any,
  momentumScore: number,
  window: any,
  evidence: any
) {
  const { storeVelocitySignal } = await import('@/lib/supabase/queries');
  return storeVelocitySignal(
    ticker,
    signalType,
    severity,
    confidence,
    momentumStatus,
    momentumScore,
    window,
    evidence
  );
}

async function storeVelocityAlert(
  ticker: string,
  alertType: any,
  severity: any,
  confidence: number,
  description: string,
  evidence: any
) {
  const { storeVelocityAlert } = await import('@/lib/supabase/queries');
  return storeVelocityAlert(ticker, alertType, severity, confidence, description, evidence);
}

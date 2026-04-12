/**
 * API Route: Analyze All Markets
 *
 * Runs fraud detection on all live Forum markets and returns integrity scores
 */

import { NextResponse } from 'next/server';
import { forumAPI } from '../../../lib/forum-api/client';
import { analyzeSingleMarket } from '../../../agents/fraud-detection/fraud-detection-agent';
import { fetchAllMarketsData } from '../../../agents/fraud-detection/data-fetcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[API] Starting market analysis...');

    // Fetch and prepare all market data
    const marketsData = await fetchAllMarketsData();

    console.log(`[API] Analyzing ${marketsData.length} markets...`);

    // Run fraud detection on all markets
    const results = await Promise.all(
      marketsData.map(async (marketData) => {
        const analysis = await analyzeSingleMarket(marketData);
        return analysis;
      })
    );

    // Sort by integrity score (lowest first - most risky)
    results.sort((a, b) => a.integrityScore.score - b.integrityScore.score);

    console.log('[API] Analysis complete');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      marketCount: results.length,
      results,
    });
  } catch (error) {
    console.error('[API] Error analyzing markets:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

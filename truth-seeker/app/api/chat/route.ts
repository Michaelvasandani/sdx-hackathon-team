/**
 * Chat API Route
 *
 * Handles conversation with the Investigation Agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { investigateMarket, investigateGeneralQuestion } from '../../../agents/investigation/investigation-agent';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, marketContext } = body;

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      );
    }

    let response: string;

    // If market context is provided, use market-specific investigation
    if (marketContext) {
      response = await investigateMarket(marketContext, question);
    } else {
      // General question about fraud detection
      response = await investigateGeneralQuestion(question);
    }

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

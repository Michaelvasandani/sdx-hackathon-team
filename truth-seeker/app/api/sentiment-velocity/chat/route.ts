/**
 * Sentiment Velocity Investigation Chat Route
 * POST /api/sentiment-velocity/chat
 * Body: { question: string, ticker?: string, velocityContext?: VelocityContext }
 */

import { NextRequest, NextResponse } from 'next/server';
import { investigateVelocity } from '@/agents/investigation/investigation-agent';
import { getVelocitySignals } from '@/lib/supabase/queries';

interface RequestBody {
  question: string;
  ticker?: string;
  velocityContext?: {
    ticker: string;
    name: string;
    momentum_status: 'stable' | 'accelerating' | 'diverging' | 'critical';
    momentum_score: number;
    price_signals: Array<{
      window: string;
      severity: string;
      confidence: number;
      acceleration: number;
    }>;
    index_signals: Array<{
      window: string;
      severity: string;
      confidence: number;
      acceleration: number;
    }>;
    divergence_alerts: Array<{
      severity: string;
      window: string;
      price_direction: string;
      index_direction: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { question, ticker, velocityContext }: RequestBody = await request.json();

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question required' },
        { status: 400 }
      );
    }

    // If no context provided and ticker is specified, try to fetch from database
    let context = velocityContext;

    if (!context && ticker) {
      try {
        const signals = await getVelocitySignals(ticker, 24);

        if (signals.length > 0) {
          // Build context from database signals
          const priceSignals = signals
            .filter((s) => s.signal_type === 'price_acceleration')
            .map((s) => ({
              window: s.window,
              severity: s.severity,
              confidence: s.confidence,
              acceleration: s.evidence?.acceleration || 0,
            }));

          const indexSignals = signals
            .filter((s) => s.signal_type === 'index_acceleration')
            .map((s) => ({
              window: s.window,
              severity: s.severity,
              confidence: s.confidence,
              acceleration: s.evidence?.acceleration || 0,
            }));

          const divergenceAlerts = signals
            .filter((s) => s.signal_type === 'momentum_divergence')
            .map((s) => ({
              severity: s.severity,
              window: s.window,
              price_direction: s.evidence?.price_direction || 'unknown',
              index_direction: s.evidence?.index_direction || 'unknown',
            }));

          context = {
            ticker: signals[0]?.ticker || ticker,
            name: ticker,
            momentum_status: signals[0]?.momentum_status || 'stable',
            momentum_score: signals[0]?.momentum_score || 50,
            price_signals: priceSignals,
            index_signals: indexSignals,
            divergence_alerts: divergenceAlerts,
          };
        }
      } catch (error) {
        // Continue without context if database fetch fails
        console.warn('Could not fetch velocity signals:', error);
      }
    }

    // If still no context, provide generic response
    if (!context) {
      return NextResponse.json({
        success: true,
        response:
          'I need more context to analyze momentum patterns. Please provide either a velocity context or a specific ticker to investigate.',
      });
    }

    // Run investigation
    const response = await investigateVelocity(context, question);

    return NextResponse.json({
      success: true,
      response,
      context_used: !!context,
    });
  } catch (error) {
    console.error('Velocity chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate velocity analysis',
      },
      { status: 500 }
    );
  }
}

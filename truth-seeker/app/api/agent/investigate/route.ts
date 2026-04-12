/**
 * Agent Investigation API
 *
 * Triggers detective agent investigation and returns live updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectiveAgent, InvestigationUpdate } from '@/agents/detective-agent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/agent/investigate
 * Triggers a new investigation cycle
 */
export async function POST(request: NextRequest) {
  try {
    // Run investigation and collect updates
    const updates: InvestigationUpdate[] = [];

    // Subscribe to updates during this investigation
    const unsubscribe = detectiveAgent.onUpdate((update) => {
      updates.push(update);
    });

    // Run investigation
    await detectiveAgent.runInvestigationCycle();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      updates,
    });
  } catch (error) {
    console.error('[Agent API] Investigation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/investigate
 * Server-Sent Events stream of live investigation
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Subscribe to agent updates
      detectiveAgent.onUpdate((update) => {
        const data = JSON.stringify(update);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      // Start investigation
      detectiveAgent.runInvestigationCycle().catch((error) => {
        const errorUpdate = {
          type: 'error',
          timestamp: new Date(),
          content: error instanceof Error ? error.message : 'Unknown error',
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorUpdate)}\n\n`));
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

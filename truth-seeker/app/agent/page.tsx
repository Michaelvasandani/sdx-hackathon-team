'use client';

/**
 * Live Agent Investigation Dashboard
 *
 * Watch the Detective Agent investigate markets in real-time
 */

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface InvestigationUpdate {
  type: 'thought' | 'tool_call' | 'finding' | 'alert' | 'connected' | 'error';
  timestamp: string;
  content: string;
  data?: any;
}

export default function AgentDashboard() {
  const [updates, setUpdates] = useState<InvestigationUpdate[]>([]);
  const [investigating, setInvestigating] = useState(false);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const updatesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new updates arrive
  useEffect(() => {
    updatesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [updates]);

  const startInvestigation = async () => {
    setInvestigating(true);
    setUpdates([]);
    setConnected(false);

    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create Server-Sent Events connection
      const eventSource = new EventSource('/api/agent/investigate');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);

          if (update.type === 'connected') {
            setConnected(true);
            return;
          }

          setUpdates((prev) => [...prev, update]);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setInvestigating(false);
        setConnected(false);
        eventSource.close();

        setUpdates((prev) => [
          ...prev,
          {
            type: 'error',
            timestamp: new Date().toISOString(),
            content: 'Connection lost. Click "Start Investigation" to reconnect.',
          },
        ]);
      };
    } catch (error) {
      console.error('Investigation error:', error);
      setInvestigating(false);
      setUpdates((prev) => [
        ...prev,
        {
          type: 'error',
          timestamp: new Date().toISOString(),
          content: error instanceof Error ? error.message : 'Unknown error',
        },
      ]);
    }
  };

  const stopInvestigation = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setInvestigating(false);
    setConnected(false);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'thought':
        return '💭';
      case 'tool_call':
        return '🔧';
      case 'finding':
        return '🎯';
      case 'alert':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  };

  const getUpdateBgColor = (type: string) => {
    switch (type) {
      case 'thought':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'tool_call':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'finding':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'alert':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                🕵️ Detective Agent
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Watch the AI agent investigate markets in real-time
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              {!investigating ? (
                <button
                  onClick={startInvestigation}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  ▶ Start Investigation
                </button>
              ) : (
                <button
                  onClick={stopInvestigation}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  ⏹ Stop Investigation
                </button>
              )}
            </div>
          </div>

          {/* Connection Status */}
          {investigating && (
            <div className="mt-4 flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {connected ? 'Connected to agent' : 'Connecting...'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Empty State */}
        {updates.length === 0 && !investigating && (
          <div className="text-center py-32">
            <div className="text-6xl mb-4">🕵️</div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              No Active Investigation
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Click "Start Investigation" to watch the Detective Agent analyze markets
            </p>
            <button
              onClick={startInvestigation}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ▶ Start Investigation
            </button>
          </div>
        )}

        {/* Investigation Feed */}
        {updates.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-4 border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                Live Investigation Feed
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {updates.length} updates
              </p>
            </div>

            {updates.map((update, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6 border ${getUpdateBgColor(
                  update.type
                )}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">{getUpdateIcon(update.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        {update.type}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-900 dark:text-white whitespace-pre-wrap">
                      {update.content}
                    </p>
                    {update.data && (
                      <details className="mt-3">
                        <summary className="text-xs font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200">
                          View data
                        </summary>
                        <pre className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
                          {JSON.stringify(update.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div ref={updatesEndRef} />
          </div>
        )}

        {/* Loading State */}
        {investigating && updates.length === 0 && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Connecting to agent...
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

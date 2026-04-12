/**
 * Sentiment Velocity Dashboard
 * Real-time market momentum monitoring and analysis
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VelocitySignal {
  id: number;
  ticker: string;
  signal_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  momentum_status: 'stable' | 'accelerating' | 'diverging' | 'critical';
  momentum_score: number;
  window: string;
  detected_at: string;
}

interface VelocityAlert {
  id: string;
  ticker: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string | null;
  detected_at: string;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-900 text-red-100 border-red-700';
    case 'high':
      return 'bg-orange-900 text-orange-100 border-orange-700';
    case 'medium':
      return 'bg-yellow-900 text-yellow-100 border-yellow-700';
    default:
      return 'bg-gray-700 text-gray-100 border-gray-600';
  }
};

const getMomentumBadgeColor = (status: string) => {
  switch (status) {
    case 'critical':
      return 'bg-red-600';
    case 'diverging':
      return 'bg-orange-600';
    case 'accelerating':
      return 'bg-yellow-600';
    default:
      return 'bg-green-600';
  }
};

export default function SentimentVelocityPage() {
  const [signals, setSignals] = useState<VelocitySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [updateTime, setUpdateTime] = useState<string>('');

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/sentiment-velocity');
        const data = await response.json();

        if (data.success) {
          setSignals(data.signals || []);
          setUpdateTime(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error fetching velocity signals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = signals.filter((signal) => {
    if (filter === 'all') return true;
    return signal.severity === filter;
  });

  const stats = {
    total: signals.length,
    critical: signals.filter((s) => s.severity === 'critical').length,
    high: signals.filter((s) => s.severity === 'high').length,
    medium: signals.filter((s) => s.severity === 'medium').length,
  };

  const groupedByTicker = filteredSignals.reduce(
    (acc, signal) => {
      if (!acc[signal.ticker]) {
        acc[signal.ticker] = [];
      }
      acc[signal.ticker].push(signal);
      return acc;
    },
    {} as Record<string, VelocitySignal[]>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">🚀 Sentiment Velocity Monitor</h1>
              <p className="text-gray-400">Real-time market momentum detection and analysis</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated: {updateTime}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Total Signals</div>
              <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            </div>
            <div className="bg-gray-800 border border-red-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Critical 🔴</div>
              <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
            </div>
            <div className="bg-gray-800 border border-orange-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">High 🟠</div>
              <div className="text-2xl font-bold text-orange-400">{stats.high}</div>
            </div>
            <div className="bg-gray-800 border border-yellow-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Medium 🟡</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.medium}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(['all', 'critical', 'high', 'medium'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading momentum signals...</p>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-gray-400">No momentum signals detected</p>
            <p className="text-gray-500 text-sm mt-2">Markets appear stable</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByTicker).map(([ticker, tickerSignals]) => {
              const maxSeverity = tickerSignals.reduce((max, current) => {
                const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
                return severityOrder[current.severity] > severityOrder[max.severity]
                  ? current
                  : max;
              });

              const avgScore = Math.round(
                tickerSignals.reduce((sum, s) => sum + s.momentum_score, 0) /
                  tickerSignals.length
              );

              const latestStatus = tickerSignals[0]?.momentum_status || 'stable';

              return (
                <div
                  key={ticker}
                  className={`border rounded-lg p-6 ${getSeverityColor(maxSeverity.severity)}`}
                >
                  {/* Market Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/market/${ticker}`}
                        className="text-2xl font-bold hover:text-blue-400 transition"
                      >
                        {ticker}
                      </Link>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getMomentumBadgeColor(latestStatus)}`}
                      >
                        {latestStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Momentum Score</div>
                      <div className="text-2xl font-bold">{avgScore}/100</div>
                    </div>
                  </div>

                  {/* Signals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tickerSignals.map((signal) => (
                      <div
                        key={signal.id}
                        className="bg-black bg-opacity-40 rounded border border-current border-opacity-30 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold capitalize">
                            {signal.signal_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                            {signal.window}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Confidence: {signal.confidence.toFixed(0)}%</span>
                          <span>{signal.severity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/market/${ticker}`}
                      className="flex-1 px-4 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded text-center text-sm"
                    >
                      View Details
                    </Link>
                    <button className="flex-1 px-4 py-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded text-sm">
                      Investigate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-gray-500 text-sm">
          <h3 className="font-semibold mb-2">Understanding Momentum Signals:</h3>
          <ul className="space-y-1">
            <li>
              <strong>Price Acceleration:</strong> How quickly price velocity is changing
            </li>
            <li>
              <strong>Index Acceleration:</strong> How quickly attention index velocity is changing
            </li>
            <li>
              <strong>Momentum Divergence:</strong> When price and index momentum move in opposite
              directions (red flag)
            </li>
            <li>
              <strong>Momentum Status:</strong> Stable (normal), Accelerating (potential trend),
              Diverging (risky), Critical (warning)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

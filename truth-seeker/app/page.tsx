'use client';

/**
 * Truth Seeker - Main Dashboard
 *
 * Real-time market integrity monitoring for Forum attention markets
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarketTable } from '../components/MarketTable';
import { MarketDistributionChart } from '../components/MarketDistributionChart';

interface FraudAlert {
  type: string;
  severity: string;
  confidence: number;
  description: string;
  evidence: any;
}

interface IntegrityScore {
  score: number;
  risk_level: 'safe' | 'moderate' | 'high' | 'critical';
  signals: any;
}

interface MarketResult {
  ticker: string;
  name: string;
  category: string;
  integrityScore: IntegrityScore;
  alerts: FraudAlert[];
  timestamp: string;
}

interface AnalysisResponse {
  success: boolean;
  timestamp: string;
  marketCount: number;
  results: MarketResult[];
}

export default function Dashboard() {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analyze');
      const json = await response.json();

      if (json.success) {
        setData(json);
        setLastUpdate(new Date());
      } else {
        setError(json.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const stats = data
    ? {
        total: data.results.length,
        safe: data.results.filter((m) => m.integrityScore.risk_level === 'safe').length,
        moderate: data.results.filter((m) => m.integrityScore.risk_level === 'moderate').length,
        high: data.results.filter((m) => m.integrityScore.risk_level === 'high').length,
        critical: data.results.filter((m) => m.integrityScore.risk_level === 'critical').length,
        totalAlerts: data.results.reduce((sum, m) => sum + m.alerts.length, 0),
      }
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                Truth Seeker
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                AI Market Integrity Agent for Forum Attention Markets
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/agent"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                🕵️ Live Agent
              </Link>
              <Link
                href="/demo"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                🧪 Fraud Demo
              </Link>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '⏸ Auto-refresh OFF'}
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-zinc-600 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Analyzing...' : 'Refresh Now'}
              </button>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">
              Error
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Analyzing markets...
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total Markets
              </div>
              <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                {stats.total}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                Safe
              </div>
              <div className="mt-2 text-3xl font-bold text-green-700 dark:text-green-400">
                {stats.safe}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Moderate
              </div>
              <div className="mt-2 text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                {stats.moderate}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                High Risk
              </div>
              <div className="mt-2 text-3xl font-bold text-orange-700 dark:text-orange-400">
                {stats.high}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="text-sm font-medium text-red-600 dark:text-red-400">
                Critical
              </div>
              <div className="mt-2 text-3xl font-bold text-red-700 dark:text-red-400">
                {stats.critical}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total Alerts
              </div>
              <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
                {stats.totalAlerts}
              </div>
            </div>
          </div>
        )}

        {/* Market Distribution Charts */}
        {data && data.results.length > 0 && (
          <div className="mb-8 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                📊 Market Overview
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Distribution of integrity scores and risk levels across all markets
              </p>
            </div>
            <div className="p-6">
              <MarketDistributionChart markets={data.results} />
            </div>
          </div>
        )}

        {/* Markets Table */}
        {data && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Market Integrity Scores
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Real-time fraud detection analysis across all Forum markets
              </p>
            </div>
            <div className="p-6">
              <MarketTable markets={data.results} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

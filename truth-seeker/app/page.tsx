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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b-2 border-red-600 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                TRUTH SEEKER
              </h1>
              <p className="mt-1 text-sm text-gray-400 uppercase tracking-wide">
                AI Market Integrity Agent for Forum Attention Markets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/agent"
                className="px-4 py-2 bg-terminal-blue border border-blue-500 text-white text-sm font-medium hover:bg-blue-700 transition-colors uppercase tracking-wide"
              >
                Live Agent
              </Link>
              <Link
                href="/demo"
                className="px-4 py-2 bg-terminal-red border border-red-500 text-white text-sm font-medium hover:bg-red-700 transition-colors uppercase tracking-wide"
              >
                Fraud Demo
              </Link>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 border text-sm font-medium transition-colors uppercase tracking-wide ${
                  autoRefresh
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-[#0f0f0f] border-gray-600 text-gray-400'
                }`}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-[#0f0f0f] border border-gray-600 text-gray-300 text-sm font-medium hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wide"
              >
                {loading ? 'Analyzing...' : 'Refresh Now'}
              </button>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="mt-4 text-xs text-gray-500 uppercase tracking-wide">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-[#0f0f0f] border-2 border-red-600">
            <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide">
              ERROR
            </h3>
            <p className="mt-1 text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <p className="mt-4 text-gray-400 uppercase tracking-wide">
                Analyzing markets...
              </p>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="mb-8 bg-[#0f0f0f] border-2 border-blue-600 p-6">
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">
            🔍 How Fraud Detection Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">1. Data Collection</h3>
              <p className="text-xs text-gray-300">
                Continuously fetch market data from Forum API including prices, volumes, order books, and funding rates.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">2. Multi-Algorithm Analysis</h3>
              <p className="text-xs text-gray-300">
                Run 6 specialized fraud detection algorithms: Price-Index Divergence (30%), Order Book Spoofing (25%), Wash Trading (20%), Bot Coordination (10%), Funding Anomaly (10%), and Correlation Break (5%).
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">3. Integrity Scoring</h3>
              <p className="text-xs text-gray-300">
                Calculate weighted integrity scores (0-100) and generate fraud alerts with confidence levels. AI agent provides natural language explanations.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Detection Algorithms Explained:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-black border border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📈</span>
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-wide">Price-Index Divergence (30%)</h4>
                </div>
                <p className="text-xs text-gray-300">
                  Detects when market price moves significantly without matching attention growth. Alerts when price changes ≥15% more than the underlying index.
                </p>
              </div>

              <div className="bg-black border border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📋</span>
                  <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Order Book Spoofing (25%)</h4>
                </div>
                <p className="text-xs text-gray-300">
                  Identifies fake liquidity where large orders are placed and quickly canceled to manipulate prices. Tracks rapid order book changes.
                </p>
              </div>

              <div className="bg-black border border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔄</span>
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wide">Wash Trading (20%)</h4>
                </div>
                <p className="text-xs text-gray-300">
                  Detects self-trading patterns where the same entity buys and sells to inflate volume. Looks for repetitive same-size trades.
                </p>
              </div>

              <div className="bg-black border border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide">Bot Coordination (10%)</h4>
                </div>
                <p className="text-xs text-gray-300">
                  Identifies coordinated bot networks placing identical orders at the same price simultaneously to manipulate markets.
                </p>
              </div>

              <div className="bg-black border border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💰</span>
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide">Funding Anomaly (10%)</h4>
                </div>
                <p className="text-xs text-gray-300">
                  Detects unnatural funding rate patterns that don't match normal market behavior, indicating potential manipulation.
                </p>
              </div>

              <div className="bg-black border border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔗</span>
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide">Correlation Break (5%)</h4>
                </div>
                <p className="text-xs text-gray-300">
                  Flags when a market moves independently from similar markets, suggesting isolated manipulation rather than organic trends.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-[#0f0f0f] border-2 border-gray-700 p-6">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total Markets
              </div>
              <div className="mt-2 text-3xl font-bold text-white">
                {stats.total}
              </div>
            </div>

            <div className="bg-[#0f0f0f] border-2 border-green-600 p-6">
              <div className="text-sm font-medium text-green-500 uppercase tracking-wide">
                Safe
              </div>
              <div className="mt-2 text-3xl font-bold text-green-400">
                {stats.safe}
              </div>
            </div>

            <div className="bg-[#0f0f0f] border-2 border-yellow-600 p-6">
              <div className="text-sm font-medium text-yellow-500 uppercase tracking-wide">
                Moderate
              </div>
              <div className="mt-2 text-3xl font-bold text-yellow-400">
                {stats.moderate}
              </div>
            </div>

            <div className="bg-[#0f0f0f] border-2 border-orange-600 p-6">
              <div className="text-sm font-medium text-orange-500 uppercase tracking-wide">
                High Risk
              </div>
              <div className="mt-2 text-3xl font-bold text-orange-400">
                {stats.high}
              </div>
            </div>

            <div className="bg-[#0f0f0f] border-2 border-red-600 p-6">
              <div className="text-sm font-medium text-red-500 uppercase tracking-wide">
                Critical
              </div>
              <div className="mt-2 text-3xl font-bold text-red-400">
                {stats.critical}
              </div>
            </div>

            <div className="bg-[#0f0f0f] border-2 border-gray-700 p-6">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total Alerts
              </div>
              <div className="mt-2 text-3xl font-bold text-white">
                {stats.totalAlerts}
              </div>
            </div>
          </div>
        )}

        {/* Market Distribution Charts */}
        {data && data.results.length > 0 && (
          <div className="mb-8 bg-[#0f0f0f] border-2 border-gray-700">
            <div className="px-6 py-4 border-b-2 border-gray-700">
              <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
                Market Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500 uppercase tracking-wide">
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
          <div className="bg-[#0f0f0f] border-2 border-red-600">
            <div className="px-6 py-4 border-b-2 border-red-600">
              <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
                Market Integrity Scores
              </h2>
              <p className="mt-1 text-sm text-gray-500 uppercase tracking-wide">
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

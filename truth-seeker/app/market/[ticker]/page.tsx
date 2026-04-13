'use client';

/**
 * Market Detail Page
 *
 * Shows detailed fraud analysis for a specific market
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { IntegrityScoreBadge, RiskLevelBadge } from '../../../components/IntegrityScoreBadge';
import { ChatInterface } from '../../../components/ChatInterface';
import { FraudSignalChart } from '../../../components/FraudSignalChart';
import { DivergenceChart } from '../../../components/DivergenceChart';
import { IntegrityTrendChart } from '../../../components/IntegrityTrendChart';

interface FraudAlert {
  type: string;
  severity: string;
  confidence: number;
  description: string;
  evidence: any;
}

interface IntegritySignals {
  price_index_divergence: number;
  spoofing_events: number;
  wash_trading_probability: number;
  bot_coordination_detected: boolean;
  funding_anomaly_score: number;
  correlation_break_score: number;
}

interface IntegrityScore {
  score: number;
  risk_level: 'safe' | 'moderate' | 'high' | 'critical';
  signals: IntegritySignals;
}

interface MarketResult {
  ticker: string;
  name: string;
  category: string;
  integrityScore: IntegrityScore;
  alerts: FraudAlert[];
  timestamp: string;
}

interface MarketData {
  currentPrice: number;
  priceChange24h: number;
  currentIndex: number;
  indexChange24h: number;
}

export default function MarketDetailPage() {
  const params = useParams();
  const ticker = params.ticker as string;

  const [market, setMarket] = useState<MarketResult | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all markets and find this one
        const response = await fetch('/api/analyze');
        const json = await response.json();

        if (json.success) {
          const found = json.results.find((m: MarketResult) => m.ticker === ticker);
          if (found) {
            setMarket(found);

            // Fetch additional market data from Forum API
            try {
              const marketResponse = await fetch(`https://api.forum.market/v1/market/${ticker}`);
              if (!marketResponse.ok) {
                throw new Error(`HTTP error! status: ${marketResponse.status}`);
              }
              const marketJson = await marketResponse.json();

              setMarketData({
                currentPrice: marketJson.lastPrice || 100,
                priceChange24h: (marketJson.changePercentPastDay || 0.052) * 100,
                currentIndex: marketJson.lastIndexValue || 95,
                indexChange24h: (marketJson.changeIndexPercentPastDay || 0.018) * 100,
              });
            } catch (apiError) {
              console.error('Failed to fetch market data from Forum API:', apiError);
              // Use mock data if API fails
              setMarketData({
                currentPrice: 100,
                priceChange24h: 5.2,
                currentIndex: 95,
                indexChange24h: 1.8,
              });
            }
          } else {
            setError('Market not found');
          }
        } else {
          setError(json.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [ticker]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
              {error || 'Market not found'}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const { integrityScore, alerts } = market;
  const signals = integrityScore.signals;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                {market.ticker}
              </h1>
              <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">
                {market.name}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500 capitalize">
                {market.category}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <IntegrityScoreBadge
                score={integrityScore.score}
                riskLevel={integrityScore.risk_level}
                size="lg"
              />
              <RiskLevelBadge riskLevel={integrityScore.risk_level} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visualization Section */}
        <div className="mb-6 space-y-6">
          {/* Integrity Trend Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              📈 Integrity Score Trend (24 Hours)
            </h2>
            <IntegrityTrendChart
              currentScore={integrityScore.score}
              currentSignals={signals}
              riskLevel={integrityScore.risk_level}
            />
          </div>

          {/* Fraud Signals Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              📊 Fraud Detection Signal Breakdown
            </h2>
            <FraudSignalChart signals={signals} />
          </div>

          {/* Divergence Chart (if marketData is available) */}
          {marketData && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                🔍 Price vs Index Divergence Analysis
              </h2>
              <DivergenceChart
                currentPrice={marketData.currentPrice}
                priceChange24h={marketData.priceChange24h}
                currentIndex={marketData.currentIndex}
                indexChange24h={marketData.indexChange24h}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fraud Signals */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Fraud Detection Signals
            </h2>
            <div className="space-y-4">
              <SignalItem
                label="Price-Index Divergence"
                value={signals.price_index_divergence}
                unit="%"
                weight={30}
                description="Measures if price moves without underlying attention growth"
              />
              <SignalItem
                label="Order Book Spoofing"
                value={signals.spoofing_events}
                unit=" events"
                weight={25}
                description="Detects fake liquidity in the order book"
              />
              <SignalItem
                label="Wash Trading Probability"
                value={signals.wash_trading_probability * 100}
                unit="%"
                weight={20}
                description="Likelihood of self-trading to inflate volume"
              />
              <SignalItem
                label="Bot Coordination"
                value={signals.bot_coordination_detected ? 100 : 0}
                unit=""
                weight={10}
                description="Detects coordinated bot networks"
                boolean={true}
              />
              <SignalItem
                label="Funding Rate Anomaly"
                value={signals.funding_anomaly_score}
                unit=""
                weight={10}
                description="Unnatural funding rate patterns"
              />
              <SignalItem
                label="Correlation Break"
                value={signals.correlation_break_score}
                unit=""
                weight={5}
                description="Isolated price movements vs similar markets"
              />
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Active Alerts ({alerts.length})
            </h2>
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <AlertCard key={index} alert={alert} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                <p className="text-5xl mb-4">✓</p>
                <p>No fraud alerts detected</p>
                <p className="text-sm mt-2">This market appears healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Score Calculation
          </h2>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
            <p>
              The integrity score is calculated using a weighted average of all fraud detection signals:
            </p>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded p-4 font-mono text-xs">
              <div>score = 100 - weighted_penalty</div>
              <div className="mt-2">where weighted_penalty =</div>
              <div className="ml-4">
                divergence × 30% +<br />
                spoofing × 25% +<br />
                wash_trading × 20% +<br />
                bot_coordination × 10% +<br />
                funding_anomaly × 10% +<br />
                correlation_break × 5%
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="text-xs uppercase text-zinc-500 dark:text-zinc-500">Risk Levels</div>
                <div className="mt-2 space-y-1 text-xs">
                  <div>80-100: Safe</div>
                  <div>50-79: Moderate</div>
                  <div>30-49: High</div>
                  <div>0-29: Critical</div>
                </div>
              </div>
              <div className="col-span-3">
                <div className="text-xs uppercase text-zinc-500 dark:text-zinc-500">Current Score</div>
                <div className="mt-2">
                  <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                    {integrityScore.score}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {integrityScore.risk_level === 'safe' && 'Market appears healthy with no significant fraud signals'}
                    {integrityScore.risk_level === 'moderate' && 'Some fraud signals detected, monitor closely'}
                    {integrityScore.risk_level === 'high' && 'Multiple fraud signals detected, high risk'}
                    {integrityScore.risk_level === 'critical' && 'Severe manipulation detected, avoid trading'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Investigation Agent */}
        <div className="mt-6">
          <ChatInterface
            marketContext={{
              ticker: market.ticker,
              name: market.name,
              category: market.category,
              integrityScore: integrityScore.score,
              riskLevel: integrityScore.risk_level,
              signals,
              alerts,
            }}
          />
        </div>
      </main>
    </div>
  );
}

function SignalItem({
  label,
  value,
  unit,
  weight,
  description,
  boolean = false,
}: {
  label: string;
  value: number;
  unit: string;
  weight: number;
  description: string;
  boolean?: boolean;
}) {
  const severity = boolean
    ? value > 0 ? 'high' : 'safe'
    : value > 50 ? 'high' : value > 25 ? 'medium' : value > 10 ? 'low' : 'safe';

  const colorClass = {
    safe: 'bg-green-100 dark:bg-green-900/20',
    low: 'bg-yellow-100 dark:bg-yellow-900/20',
    medium: 'bg-orange-100 dark:bg-orange-900/20',
    high: 'bg-red-100 dark:bg-red-900/20',
  }[severity];

  return (
    <div className={`p-4 rounded-lg ${colorClass}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium text-zinc-900 dark:text-white">{label}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-zinc-900 dark:text-white">
            {boolean ? (value > 0 ? 'YES' : 'NO') : value.toFixed(1) + unit}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{weight}% weight</div>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: FraudAlert }) {
  const severityColor = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    high: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  }[alert.severity] || 'border-zinc-300 bg-zinc-50 dark:bg-zinc-800';

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${severityColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-zinc-900 dark:text-white capitalize">
          {alert.type.replace(/_/g, ' ')}
        </div>
        <div className="text-xs uppercase font-medium text-zinc-500 dark:text-zinc-400">
          {alert.severity}
        </div>
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">{alert.description}</p>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        Confidence: {alert.confidence.toFixed(1)}%
      </div>
    </div>
  );
}

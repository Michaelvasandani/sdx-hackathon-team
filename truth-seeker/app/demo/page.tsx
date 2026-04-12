'use client';

/**
 * Fraud Simulation Demo Page
 *
 * Interactive demonstration of fraud detection capabilities
 */

import { useState } from 'react';
import Link from 'next/link';
import { calculateIntegrityScore, IntegritySignals } from '../../agents/fraud-detection/integrity-scorer';
import { IntegrityScoreBadge, RiskLevelBadge } from '../../components/IntegrityScoreBadge';

// Pre-built fraud scenarios
const SCENARIOS = [
  {
    name: 'Healthy Market',
    ticker: 'HEALTHY',
    description: 'Normal market with organic price movement',
    signals: {
      price_index_divergence: 0,
      spoofing_events: 0,
      wash_trading_probability: 0,
      bot_coordination_detected: false,
      funding_anomaly_score: 0,
      correlation_break_score: 0,
    },
    expectedScore: 100,
    emoji: '✅',
  },
  {
    name: 'Price Pump',
    ticker: 'PUMP',
    description: 'Price pumped 45% without attention growth',
    signals: {
      price_index_divergence: 45,
      spoofing_events: 0,
      wash_trading_probability: 0,
      bot_coordination_detected: false,
      funding_anomaly_score: 0,
      correlation_break_score: 0,
    },
    expectedScore: 87,
    emoji: '⚠️',
  },
  {
    name: 'Wash Trading',
    ticker: 'WASH',
    description: '70% wash trading + bot coordination',
    signals: {
      price_index_divergence: 0,
      spoofing_events: 0,
      wash_trading_probability: 0.7,
      bot_coordination_detected: true,
      funding_anomaly_score: 0,
      correlation_break_score: 0,
    },
    expectedScore: 81,
    emoji: '🤖',
  },
  {
    name: 'Multi-Signal Attack',
    ticker: 'MULTI',
    description: 'Divergence + spoofing + funding anomaly',
    signals: {
      price_index_divergence: 30,
      spoofing_events: 4,
      wash_trading_probability: 0,
      bot_coordination_detected: false,
      funding_anomaly_score: 70,
      correlation_break_score: 0,
    },
    expectedScore: 74,
    emoji: '🚨',
  },
  {
    name: 'Extreme Manipulation',
    ticker: 'SCAM',
    description: 'All fraud signals at maximum',
    signals: {
      price_index_divergence: 100,
      spoofing_events: 15,
      wash_trading_probability: 0.95,
      bot_coordination_detected: true,
      funding_anomaly_score: 100,
      correlation_break_score: 80,
    },
    expectedScore: 7,
    emoji: '⛔',
  },
];

export default function DemoPage() {
  // Interactive fraud lab state
  const [labSignals, setLabSignals] = useState<IntegritySignals>({
    price_index_divergence: 0,
    spoofing_events: 0,
    wash_trading_probability: 0,
    bot_coordination_detected: false,
    funding_anomaly_score: 0,
    correlation_break_score: 0,
  });

  const labScore = calculateIntegrityScore(labSignals);

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
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              🧪 Fraud Detection Demo
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Interactive demonstration of fraud detection algorithms
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fraud Scenarios */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Fraud Scenarios
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Pre-built scenarios showing how different fraud patterns affect integrity scores
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {SCENARIOS.map((scenario) => {
              const score = calculateIntegrityScore(scenario.signals);
              return (
                <div
                  key={scenario.ticker}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6"
                >
                  <div className="text-4xl mb-3">{scenario.emoji}</div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    {scenario.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    {scenario.description}
                  </p>

                  <div className="mb-4">
                    <IntegrityScoreBadge
                      score={score.score}
                      riskLevel={score.risk_level}
                      size="lg"
                    />
                  </div>

                  <div className="text-xs space-y-1 text-zinc-500 dark:text-zinc-400">
                    <div>Divergence: {scenario.signals.price_index_divergence}%</div>
                    <div>Spoofing: {scenario.signals.spoofing_events}</div>
                    <div>Wash: {(scenario.signals.wash_trading_probability * 100).toFixed(0)}%</div>
                    <div>Bots: {scenario.signals.bot_coordination_detected ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Fraud Lab */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            ⚗️ Interactive Fraud Lab
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Adjust fraud parameters and watch the integrity score update in real-time
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                Fraud Parameters
              </h3>

              {/* Price-Index Divergence */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Price-Index Divergence: {labSignals.price_index_divergence}%
                  <span className="text-xs text-zinc-500 ml-2">(30% weight)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={labSignals.price_index_divergence}
                  onChange={(e) =>
                    setLabSignals({ ...labSignals, price_index_divergence: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Measures if price moves without attention growth
                </p>
              </div>

              {/* Spoofing Events */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Spoofing Events: {labSignals.spoofing_events}
                  <span className="text-xs text-zinc-500 ml-2">(25% weight)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={labSignals.spoofing_events}
                  onChange={(e) =>
                    setLabSignals({ ...labSignals, spoofing_events: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Fake liquidity in the order book
                </p>
              </div>

              {/* Wash Trading */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Wash Trading: {(labSignals.wash_trading_probability * 100).toFixed(0)}%
                  <span className="text-xs text-zinc-500 ml-2">(20% weight)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={labSignals.wash_trading_probability * 100}
                  onChange={(e) =>
                    setLabSignals({
                      ...labSignals,
                      wash_trading_probability: Number(e.target.value) / 100,
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Self-trading to inflate volume
                </p>
              </div>

              {/* Bot Coordination */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={labSignals.bot_coordination_detected}
                    onChange={(e) =>
                      setLabSignals({ ...labSignals, bot_coordination_detected: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Bot Coordination Detected
                    <span className="text-xs text-zinc-500 ml-2">(10% weight)</span>
                  </span>
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-6">
                  Coordinated bot networks detected
                </p>
              </div>

              {/* Funding Anomaly */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Funding Anomaly: {labSignals.funding_anomaly_score}
                  <span className="text-xs text-zinc-500 ml-2">(10% weight)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={labSignals.funding_anomaly_score}
                  onChange={(e) =>
                    setLabSignals({ ...labSignals, funding_anomaly_score: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Unnatural funding rate patterns
                </p>
              </div>

              {/* Correlation Break */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Correlation Break: {labSignals.correlation_break_score}
                  <span className="text-xs text-zinc-500 ml-2">(5% weight)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={labSignals.correlation_break_score}
                  onChange={(e) =>
                    setLabSignals({ ...labSignals, correlation_break_score: Number(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Isolated price movements
                </p>
              </div>

              <button
                onClick={() =>
                  setLabSignals({
                    price_index_divergence: 0,
                    spoofing_events: 0,
                    wash_trading_probability: 0,
                    bot_coordination_detected: false,
                    funding_anomaly_score: 0,
                    correlation_break_score: 0,
                  })
                }
                className="w-full px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Reset All
              </button>
            </div>

            {/* Results */}
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                Live Results
              </h3>

              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="text-6xl font-bold text-zinc-900 dark:text-white mb-2">
                    {labScore.score}
                  </div>
                  <RiskLevelBadge riskLevel={labScore.risk_level} size="lg" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Divergence Penalty:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      -{(labSignals.price_index_divergence * 0.3).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Spoofing Penalty:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      -{(Math.min(labSignals.spoofing_events < 5 ? labSignals.spoofing_events * 10 : 50 + (labSignals.spoofing_events - 5) * 6, 100) * 0.25).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Wash Trading Penalty:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      -{(labSignals.wash_trading_probability * 100 * 0.2).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Bot Penalty:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      -{labSignals.bot_coordination_detected ? '5.0' : '0.0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Funding Penalty:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      -{(labSignals.funding_anomaly_score * 0.1).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Correlation Penalty:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      -{(labSignals.correlation_break_score * 0.05).toFixed(1)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-300 dark:border-zinc-600 flex justify-between font-semibold">
                    <span className="text-zinc-900 dark:text-white">Final Score:</span>
                    <span className="text-zinc-900 dark:text-white">{labScore.score}/100</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                  💡 Understanding the Score
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <div>• 80-100: Safe - Market appears healthy</div>
                  <div>• 50-79: Moderate - Monitor closely</div>
                  <div>• 30-49: High - Multiple fraud signals</div>
                  <div>• 0-29: Critical - Severe manipulation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

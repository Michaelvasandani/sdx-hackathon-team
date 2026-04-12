'use client';

/**
 * Market Table Component
 *
 * Displays all markets with integrity scores in a sortable table
 */

import { useState } from 'react';
import Link from 'next/link';
import { IntegrityScoreBadge, RiskLevelBadge } from './IntegrityScoreBadge';

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

interface MarketTableProps {
  markets: MarketResult[];
}

type SortKey = 'ticker' | 'score' | 'alerts' | 'risk';
type SortDirection = 'asc' | 'desc';

export function MarketTable({ markets }: MarketTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedMarkets = [...markets].sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case 'ticker':
        comparison = a.ticker.localeCompare(b.ticker);
        break;
      case 'score':
        comparison = a.integrityScore.score - b.integrityScore.score;
        break;
      case 'alerts':
        comparison = a.alerts.length - b.alerts.length;
        break;
      case 'risk':
        const riskOrder = { critical: 0, high: 1, moderate: 2, safe: 3 };
        comparison = riskOrder[a.integrityScore.risk_level] - riskOrder[b.integrityScore.risk_level];
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const filteredMarkets = filterRisk === 'all'
    ? sortedMarkets
    : sortedMarkets.filter(m => m.integrityScore.risk_level === filterRisk);

  const riskCounts = {
    safe: markets.filter(m => m.integrityScore.risk_level === 'safe').length,
    moderate: markets.filter(m => m.integrityScore.risk_level === 'moderate').length,
    high: markets.filter(m => m.integrityScore.risk_level === 'high').length,
    critical: markets.filter(m => m.integrityScore.risk_level === 'critical').length,
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterRisk('all')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            filterRisk === 'all'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
              : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
          }`}
        >
          All ({markets.length})
        </button>
        <button
          onClick={() => setFilterRisk('safe')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            filterRisk === 'safe'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          Safe ({riskCounts.safe})
        </button>
        <button
          onClick={() => setFilterRisk('moderate')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            filterRisk === 'moderate'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}
        >
          Moderate ({riskCounts.moderate})
        </button>
        <button
          onClick={() => setFilterRisk('high')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            filterRisk === 'high'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
          }`}
        >
          High ({riskCounts.high})
        </button>
        <button
          onClick={() => setFilterRisk('critical')}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            filterRisk === 'critical'
              ? 'bg-red-600 text-white'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          Critical ({riskCounts.critical})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSort('ticker')}
              >
                Market {sortKey === 'ticker' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Category
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSort('score')}
              >
                Score {sortKey === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSort('risk')}
              >
                Risk {sortKey === 'risk' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSort('alerts')}
              >
                Alerts {sortKey === 'alerts' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredMarkets.map((market) => (
              <tr
                key={market.ticker}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {market.ticker}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {market.name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                    {market.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <IntegrityScoreBadge
                    score={market.integrityScore.score}
                    riskLevel={market.integrityScore.risk_level}
                  />
                </td>
                <td className="px-4 py-3">
                  <RiskLevelBadge riskLevel={market.integrityScore.risk_level} size="sm" />
                </td>
                <td className="px-4 py-3">
                  {market.alerts.length > 0 ? (
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {market.alerts.length} alert{market.alerts.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-400 dark:text-zinc-600">
                      None
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/market/${market.ticker}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMarkets.length === 0 && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          No markets found with the selected filter.
        </div>
      )}
    </div>
  );
}

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
          className={`px-3 py-1.5 text-sm font-medium transition-colors uppercase tracking-wide border ${
            filterRisk === 'all'
              ? 'bg-white text-black border-white'
              : 'bg-[#0f0f0f] text-gray-300 border-gray-600 hover:border-gray-400'
          }`}
        >
          All ({markets.length})
        </button>
        <button
          onClick={() => setFilterRisk('safe')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors uppercase tracking-wide border ${
            filterRisk === 'safe'
              ? 'bg-green-600 text-white border-green-500'
              : 'bg-[#0f0f0f] text-green-400 border-green-600 hover:bg-green-900/20'
          }`}
        >
          Safe ({riskCounts.safe})
        </button>
        <button
          onClick={() => setFilterRisk('moderate')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors uppercase tracking-wide border ${
            filterRisk === 'moderate'
              ? 'bg-yellow-600 text-white border-yellow-500'
              : 'bg-[#0f0f0f] text-yellow-400 border-yellow-600 hover:bg-yellow-900/20'
          }`}
        >
          Moderate ({riskCounts.moderate})
        </button>
        <button
          onClick={() => setFilterRisk('high')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors uppercase tracking-wide border ${
            filterRisk === 'high'
              ? 'bg-orange-600 text-white border-orange-500'
              : 'bg-[#0f0f0f] text-orange-400 border-orange-600 hover:bg-orange-900/20'
          }`}
        >
          High ({riskCounts.high})
        </button>
        <button
          onClick={() => setFilterRisk('critical')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors uppercase tracking-wide border ${
            filterRisk === 'critical'
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-[#0f0f0f] text-red-400 border-red-600 hover:bg-red-900/20'
          }`}
        >
          Critical ({riskCounts.critical})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-2 border-gray-700">
        <table className="w-full">
          <thead className="bg-[#0f0f0f] border-b-2 border-gray-700">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('ticker')}
              >
                Market {sortKey === 'ticker' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide">
                Category
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('score')}
              >
                Score {sortKey === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('risk')}
              >
                Risk {sortKey === 'risk' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide cursor-pointer hover:bg-gray-800"
                onClick={() => handleSort('alerts')}
              >
                Alerts {sortKey === 'alerts' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-white uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredMarkets.map((market) => (
              <tr
                key={market.ticker}
                className="hover:bg-gray-900 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-white uppercase tracking-wide">
                      {market.ticker}
                    </div>
                    <div className="text-sm text-gray-400">
                      {market.name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-300 capitalize">
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
                    <span className="text-sm font-medium text-red-400">
                      {market.alerts.length} alert{market.alerts.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">
                      None
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/market/${market.ticker}`}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 uppercase tracking-wide"
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
        <div className="text-center py-12 text-gray-400 uppercase tracking-wide">
          No markets found with the selected filter.
        </div>
      )}
    </div>
  );
}

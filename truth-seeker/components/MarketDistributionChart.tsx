'use client';

/**
 * Market Distribution Chart Component
 *
 * Shows distribution of integrity scores across all markets
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

interface MarketResult {
  ticker: string;
  name: string;
  integrityScore: {
    score: number;
    risk_level: 'safe' | 'moderate' | 'high' | 'critical';
  };
}

interface MarketDistributionChartProps {
  markets: MarketResult[];
}

export function MarketDistributionChart({ markets }: MarketDistributionChartProps) {
  // Calculate distribution by score ranges
  const ranges = [
    { range: '90-100', min: 90, max: 100, color: '#22c55e' },
    { range: '80-89', min: 80, max: 89, color: '#84cc16' },
    { range: '70-79', min: 70, max: 79, color: '#eab308' },
    { range: '60-69', min: 60, max: 69, color: '#f59e0b' },
    { range: '50-59', min: 50, max: 59, color: '#f97316' },
    { range: '40-49', min: 40, max: 49, color: '#ef4444' },
    { range: '30-39', min: 30, max: 39, color: '#dc2626' },
    { range: '0-29', min: 0, max: 29, color: '#991b1b' },
  ];

  const distributionData = ranges.map(({ range, min, max, color }) => {
    const count = markets.filter(
      (m) => m.integrityScore.score >= min && m.integrityScore.score <= max
    ).length;
    return {
      range,
      count,
      color,
    };
  }).filter(d => d.count > 0); // Only show ranges with markets

  // Calculate risk level distribution for pie chart
  const riskCounts = {
    safe: markets.filter((m) => m.integrityScore.risk_level === 'safe').length,
    moderate: markets.filter((m) => m.integrityScore.risk_level === 'moderate').length,
    high: markets.filter((m) => m.integrityScore.risk_level === 'high').length,
    critical: markets.filter((m) => m.integrityScore.risk_level === 'critical').length,
  };

  const pieData = [
    { name: 'Safe', value: riskCounts.safe, color: '#22c55e' },
    { name: 'Moderate', value: riskCounts.moderate, color: '#eab308' },
    { name: 'High', value: riskCounts.high, color: '#f97316' },
    { name: 'Critical', value: riskCounts.critical, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white">
            {data.name || data.payload.range}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Markets: <span className="font-bold">{data.value || data.payload.count}</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {((( data.value || data.payload.count) / markets.length) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart - Score Distribution */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          Score Distribution
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={distributionData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
              <XAxis
                dataKey="range"
                tick={{ fill: '#71717a', fontSize: 11 }}
                label={{ value: 'Integrity Score Range', position: 'insideBottom', offset: -10, fill: '#71717a' }}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 12 }}
                label={{ value: 'Number of Markets', angle: -90, position: 'insideLeft', fill: '#71717a' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart - Risk Level Distribution */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          Risk Level Distribution
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {value}: {entry.payload.value} markets
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

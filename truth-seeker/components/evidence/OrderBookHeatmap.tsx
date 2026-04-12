'use client';

/**
 * Order Book Heatmap
 *
 * Shows order clustering at specific price levels
 * Highlights bot coordination when many orders cluster at identical prices
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export interface PriceLevel {
  price: number;
  orderCount: number;
  totalSize: number;
  suspicious: boolean;
}

interface OrderBookHeatmapProps {
  levels: PriceLevel[];
  suspiciousPrice: number;
  suspiciousCount: number;
  totalOrders: number;
}

export function OrderBookHeatmap({
  levels,
  suspiciousPrice,
  suspiciousCount,
  totalOrders,
}: OrderBookHeatmapProps) {
  // Sort by price for better visualization
  const sortedLevels = [...levels].sort((a, b) => a.price - b.price);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">
            ${data.price.toFixed(2)}
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="text-zinc-600 dark:text-zinc-400">
              Orders: <span className="font-bold">{data.orderCount}</span>
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Total Size: <span className="font-bold">{data.totalSize.toFixed(1)}</span> contracts
            </p>
          </div>
          {data.suspicious && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                🚨 BOT CLUSTER: {data.orderCount} orders at identical price
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Get color based on order count (heatmap style)
  const getBarColor = (orderCount: number, suspicious: boolean) => {
    if (suspicious) return '#ef4444'; // red for suspicious clusters
    if (orderCount >= 5) return '#f97316'; // orange for high concentration
    if (orderCount >= 3) return '#eab308'; // yellow for medium
    return '#22c55e'; // green for normal
  };

  return (
    <div className="w-full">
      {/* Alert Header */}
      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-lg">🤖</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              Bot Coordination Detected
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              {suspiciousCount} orders clustered at exactly ${suspiciousPrice.toFixed(2)}
              - unnatural precision indicates automated bot network
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedLevels}
            margin={{ top: 20, right: 30, bottom: 20, left: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
            <XAxis
              dataKey="price"
              tick={{ fill: '#71717a', fontSize: 10 }}
              label={{ value: 'Price Level ($)', position: 'insideBottom', offset: -10, fill: '#71717a' }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              label={{
                value: 'Number of Orders',
                angle: -90,
                position: 'insideLeft',
                fill: '#71717a',
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference line at suspicious price */}
            <ReferenceLine
              x={suspiciousPrice}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Bot Cluster at $${suspiciousPrice.toFixed(2)}`,
                fill: '#ef4444',
                fontSize: 10,
                position: 'top',
              }}
            />

            <Bar
              dataKey="orderCount"
              radius={[4, 4, 0, 0]}
            >
              {sortedLevels.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.orderCount, entry.suspicious)}
                  fillOpacity={entry.suspicious ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">
            Bot Cluster ({suspiciousCount} orders at ${suspiciousPrice.toFixed(2)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500 opacity-70"></div>
          <span className="text-zinc-600 dark:text-zinc-400">Normal Distribution (1-2 orders)</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <p className="text-xs text-zinc-700 dark:text-zinc-300">
          <strong>💡 Why this is suspicious:</strong> Human traders naturally place orders at varied price levels based on their analysis. Finding {suspiciousCount} orders at the exact same price (${suspiciousPrice.toFixed(2)}) suggests a coordinated bot network or single actor using multiple accounts. This clustering creates artificial support/resistance levels and can manipulate market perception.
        </p>
      </div>
    </div>
  );
}

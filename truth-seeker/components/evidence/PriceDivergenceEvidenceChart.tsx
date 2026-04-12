'use client';

/**
 * Price Divergence Evidence Chart
 *
 * Shows price vs index movement over time to visualize manipulation
 * Highlights the divergence gap where price decouples from fundamentals
 */

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface PriceIndexDataPoint {
  hour: number;
  time: string;
  priceChange: number; // % change from start
  indexChange: number; // % change from start
  divergence: number; // Absolute difference
}

interface PriceDivergenceEvidenceChartProps {
  data: PriceIndexDataPoint[];
  finalPriceChange: number;
  finalIndexChange: number;
  maxDivergence: number;
}

export function PriceDivergenceEvidenceChart({
  data,
  finalPriceChange,
  finalIndexChange,
  maxDivergence,
}: PriceDivergenceEvidenceChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length >= 2) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm mb-2">
            {data.time}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-blue-600 dark:text-blue-400">Price Change:</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {data.priceChange >= 0 ? '+' : ''}{data.priceChange.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-purple-600 dark:text-purple-400">Index Change:</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {data.indexChange >= 0 ? '+' : ''}{data.indexChange.toFixed(1)}%
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">Divergence:</span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {data.divergence.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Alert Header */}
      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              Price Manipulation Detected
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Price rose {finalPriceChange >= 0 ? '+' : ''}{finalPriceChange.toFixed(1)}% while attention index only moved {finalIndexChange >= 0 ? '+' : ''}{finalIndexChange.toFixed(1)}%
              ({maxDivergence.toFixed(1)}% divergence) - indicates artificial price movement
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
          >
            <defs>
              <linearGradient id="divergenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#71717a', fontSize: 10 }}
              label={{ value: 'Time', position: 'insideBottom', offset: -10, fill: '#71717a' }}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              label={{
                value: '% Change from Start',
                angle: -90,
                position: 'insideLeft',
                fill: '#71717a',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />

            {/* Reference line at 0% */}
            <ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" strokeWidth={1} />

            {/* Divergence gap area */}
            <Area
              type="monotone"
              dataKey="divergence"
              fill="url(#divergenceGradient)"
              stroke="none"
              name="Divergence Gap"
            />

            {/* Price line */}
            <Line
              type="monotone"
              dataKey="priceChange"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Price Change %"
            />

            {/* Index line */}
            <Line
              type="monotone"
              dataKey="indexChange"
              stroke="#a855f7"
              strokeWidth={3}
              dot={{ fill: '#a855f7', r: 4 }}
              activeDot={{ r: 6 }}
              name="Index Change %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Final Price Change</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            {finalPriceChange >= 0 ? '+' : ''}{finalPriceChange.toFixed(1)}%
          </div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Final Index Change</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
            {finalIndexChange >= 0 ? '+' : ''}{finalIndexChange.toFixed(1)}%
          </div>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Max Divergence</div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
            {maxDivergence.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <p className="text-xs text-zinc-700 dark:text-zinc-300">
          <strong>💡 Why this is suspicious:</strong> In attention markets, price should track attention index closely - cultural momentum drives value. When price spikes significantly above index growth, it indicates coordinated buying/manipulation rather than organic demand. The orange shaded area shows the "artificial premium" not justified by attention metrics.
        </p>
      </div>
    </div>
  );
}

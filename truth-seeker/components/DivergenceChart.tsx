'use client';

/**
 * Divergence Chart Component
 *
 * Dual-axis line chart showing price vs index movement over 24 hours
 * Visualizes the divergence that triggers fraud alerts
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DivergenceChartProps {
  currentPrice: number;
  priceChange24h: number;
  currentIndex: number;
  indexChange24h: number;
}

export function DivergenceChart({
  currentPrice,
  priceChange24h,
  currentIndex,
  indexChange24h,
}: DivergenceChartProps) {
  // Calculate 24h ago values
  const price24hAgo = currentPrice / (1 + priceChange24h / 100);
  const index24hAgo = currentIndex / (1 + indexChange24h / 100);

  // Generate 24 hourly data points
  const data = Array.from({ length: 25 }, (_, i) => {
    const progress = i / 24; // 0 to 1

    // Add some realistic noise/volatility
    const priceNoise = (Math.sin(i * 0.5) * 0.02 + Math.random() * 0.01 - 0.005);
    const indexNoise = (Math.sin(i * 0.3) * 0.015 + Math.random() * 0.008 - 0.004);

    // Interpolate with noise
    const price = price24hAgo + (currentPrice - price24hAgo) * progress + (currentPrice * priceNoise);
    const index = index24hAgo + (currentIndex - index24hAgo) * progress + (currentIndex * indexNoise);

    return {
      hour: i,
      time: i === 0 ? '24h ago' : i === 24 ? 'Now' : `-${24 - i}h`,
      price: Math.max(0, price),
      index: Math.max(0, index),
      // Normalized values (percentage change from start)
      priceChange: ((price - price24hAgo) / price24hAgo) * 100,
      indexChange: ((index - index24hAgo) / index24hAgo) * 100,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length >= 2) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white mb-2">
            {data.time}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-600 dark:text-blue-400">Price Change:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {data.priceChange >= 0 ? '+' : ''}{data.priceChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-purple-600 dark:text-purple-400">Index Change:</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {data.indexChange >= 0 ? '+' : ''}{data.indexChange.toFixed(2)}%
              </span>
            </div>
            <div className="pt-1 mt-1 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-600 dark:text-zinc-400">Divergence:</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  {Math.abs(data.priceChange - data.indexChange).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if divergence exceeds threshold
  const divergence = Math.abs(priceChange24h - indexChange24h);
  const isDivergent = divergence > 15;

  return (
    <div className="w-full">
      {/* Alert Banner */}
      {isDivergent && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                Significant Divergence Detected
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Price changed {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(1)}% while index changed {indexChange24h >= 0 ? '+' : ''}{indexChange24h.toFixed(1)}%
                ({divergence.toFixed(1)}% divergence)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#71717a', fontSize: 11 }}
              interval={4}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#71717a', fontSize: 12 }}
              label={{
                value: '% Change',
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
            <ReferenceLine yAxisId="left" y={0} stroke="#71717a" strokeDasharray="3 3" />

            {/* Divergence threshold lines */}
            {isDivergent && (
              <>
                <ReferenceLine
                  yAxisId="left"
                  y={15}
                  stroke="#f97316"
                  strokeDasharray="5 5"
                  label={{ value: 'Alert Threshold', fill: '#f97316', fontSize: 10 }}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={-15}
                  stroke="#f97316"
                  strokeDasharray="5 5"
                />
              </>
            )}

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="priceChange"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Price Change %"
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="indexChange"
              stroke="#a855f7"
              strokeWidth={3}
              name="Index Change %"
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Price Change (24h)</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
          </div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Index Change (24h)</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
            {indexChange24h >= 0 ? '+' : ''}{indexChange24h.toFixed(2)}%
          </div>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Divergence</div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
            {divergence.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}

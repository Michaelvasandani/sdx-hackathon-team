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
        <div className="bg-[#0f0f0f] border-2 border-gray-600 p-3 shadow-lg">
          <p className="font-semibold text-white mb-2 uppercase tracking-wide">
            {data.time}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-400">Price Change:</span>
              <span className="font-mono font-bold text-blue-400">
                {data.priceChange >= 0 ? '+' : ''}{data.priceChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-purple-400">Index Change:</span>
              <span className="font-mono font-bold text-purple-400">
                {data.indexChange >= 0 ? '+' : ''}{data.indexChange.toFixed(2)}%
              </span>
            </div>
            <div className="pt-1 mt-1 border-t border-gray-700">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-300">Divergence:</span>
                <span className="font-mono font-bold text-orange-400">
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
        <div className="mb-4 p-3 bg-[#0f0f0f] border-2 border-orange-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-white uppercase tracking-wide">
                Significant Divergence Detected
              </p>
              <p className="text-xs text-gray-300">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#ffffff', fontSize: 11 }}
              interval={4}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#ffffff', fontSize: 12 }}
              label={{
                value: '% Change',
                angle: -90,
                position: 'insideLeft',
                fill: '#ffffff',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />

            {/* Reference line at 0% */}
            <ReferenceLine yAxisId="left" y={0} stroke="#ffffff" strokeDasharray="3 3" />

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
        <div className="p-3 bg-black border-2 border-blue-600">
          <div className="text-xs text-blue-400 font-medium uppercase tracking-wide">Price Change (24h)</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
          </div>
        </div>
        <div className="p-3 bg-black border-2 border-purple-600">
          <div className="text-xs text-purple-400 font-medium uppercase tracking-wide">Index Change (24h)</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {indexChange24h >= 0 ? '+' : ''}{indexChange24h.toFixed(2)}%
          </div>
        </div>
        <div className="p-3 bg-black border-2 border-orange-600">
          <div className="text-xs text-orange-400 font-medium uppercase tracking-wide">Divergence</div>
          <div className="text-2xl font-bold text-orange-400 mt-1">
            {divergence.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}

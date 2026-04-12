'use client';

/**
 * Spoofing Timeline Chart
 *
 * Shows order placement and cancellation events over time
 * Highlights large orders that appear and vanish quickly (phantom liquidity)
 */

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export interface SpoofingEvent {
  orderId: string;
  placedTime: string;
  canceledTime: string;
  price: number;
  size: number;
  lifetimeSeconds: number;
  suspicious: boolean;
}

interface SpoofingTimelineChartProps {
  events: SpoofingEvent[];
  totalEvents: number;
  suspiciousCount: number;
  avgLifetime: number;
}

export function SpoofingTimelineChart({
  events,
  totalEvents,
  suspiciousCount,
  avgLifetime,
}: SpoofingTimelineChartProps) {
  // Convert events to chart data points
  const dataPoints = events.flatMap((event, idx) => [
    {
      event: `Order ${idx + 1}`,
      time: event.placedTime,
      price: event.price,
      size: event.size,
      type: 'placed',
      suspicious: event.suspicious,
      lifetimeSeconds: event.lifetimeSeconds,
      displayTime: parseTime(event.placedTime),
    },
    {
      event: `Order ${idx + 1}`,
      time: event.canceledTime,
      price: event.price,
      size: event.size,
      type: 'canceled',
      suspicious: event.suspicious,
      lifetimeSeconds: event.lifetimeSeconds,
      displayTime: parseTime(event.canceledTime),
    },
  ]);

  function parseTime(timeStr: string): number {
    // Convert "14:23:10" to minutes since start
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    return (hours - 14) * 60 + minutes + seconds / 60; // Assuming start is 14:00
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">
            {data.event} - {data.type === 'placed' ? 'Placed' : 'Canceled'}
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="text-zinc-600 dark:text-zinc-400">
              Time: {data.time}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Price: ${data.price}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Size: {data.size} contracts
            </p>
            {data.type === 'canceled' && (
              <p className="text-zinc-600 dark:text-zinc-400">
                Lifetime: {data.lifetimeSeconds.toFixed(1)}s
              </p>
            )}
          </div>
          {data.suspicious && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                🚨 SPOOFING: Large order canceled in &lt; 10 seconds
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Alert Header */}
      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-lg">🎭</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
              Order Book Spoofing Detected
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              {suspiciousCount} large orders placed and canceled within {avgLifetime.toFixed(1)} seconds on average
              - classic spoofing to create false liquidity
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
            <XAxis
              dataKey="displayTime"
              type="number"
              name="Time"
              tick={{ fill: '#71717a', fontSize: 10 }}
              label={{ value: 'Minutes Elapsed', position: 'insideBottom', offset: -10, fill: '#71717a' }}
              domain={[0, 'auto']}
            />
            <YAxis
              dataKey="price"
              type="number"
              name="Price"
              tick={{ fill: '#71717a', fontSize: 11 }}
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', fill: '#71717a' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              content={() => (
                <div className="flex justify-center gap-6 text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-zinc-600 dark:text-zinc-400">Spoofing Orders (&lt; 10s lifetime)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 opacity-50"></div>
                    <span className="text-zinc-600 dark:text-zinc-400">Normal Orders</span>
                  </div>
                </div>
              )}
            />
            <Scatter
              data={dataPoints}
              fill="#8884d8"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.type === 'placed') {
                  // Upward triangle for placed orders
                  return (
                    <path
                      d={`M ${cx},${cy - 6} L ${cx + 5},${cy + 4} L ${cx - 5},${cy + 4} Z`}
                      fill={payload.suspicious ? '#ef4444' : '#22c55e'}
                      fillOpacity={payload.suspicious ? 0.9 : 0.4}
                    />
                  );
                } else {
                  // Downward triangle for canceled orders
                  return (
                    <path
                      d={`M ${cx},${cy + 6} L ${cx + 5},${cy - 4} L ${cx - 5},${cy - 4} Z`}
                      fill={payload.suspicious ? '#ef4444' : '#22c55e'}
                      fillOpacity={payload.suspicious ? 0.9 : 0.4}
                    />
                  );
                }
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for shapes */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="text-base">▲</span>
          <span>Order Placed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">▼</span>
          <span>Order Canceled</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <p className="text-xs text-zinc-700 dark:text-zinc-300">
          <strong>💡 Why this is suspicious:</strong> Spoofing involves placing large orders to create the illusion of liquidity or support/resistance, then canceling them before execution. Orders that appear (▲) and quickly vanish (▼) within seconds manipulate other traders' perception of market depth, often causing them to trade at disadvantageous prices.
        </p>
      </div>
    </div>
  );
}

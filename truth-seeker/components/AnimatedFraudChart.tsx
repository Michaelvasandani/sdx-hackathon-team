'use client';

/**
 * Animated Fraud Chart Component
 *
 * Shows fraud signals animating in real-time as investigation progresses
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FraudSignals {
  price_index_divergence?: number;
  spoofing_events?: number;
  wash_trading_probability?: number;
  bot_coordination_detected?: boolean;
  funding_anomaly_score?: number;
  correlation_break_score?: number;
}

interface AnimatedFraudChartProps {
  signals: FraudSignals;
  showAnimation?: boolean;
}

export function AnimatedFraudChart({ signals, showAnimation = true }: AnimatedFraudChartProps) {
  // Convert spoofing events to 0-100 score
  function spoofingToScore(events: number): number {
    if (events === 0) return 0;
    if (events < 5) return events * 10;
    if (events < 10) return 50 + (events - 5) * 6;
    return Math.min(80 + (events - 10) * 4, 100);
  }

  // Transform signals into chart data
  const data = [
    {
      name: 'Price\nDivergence',
      value: signals.price_index_divergence || 0,
      fullName: 'Price-Index Divergence',
      weight: 30,
    },
    {
      name: 'Order Book\nSpoofing',
      value: spoofingToScore(signals.spoofing_events || 0),
      fullName: 'Order Book Spoofing',
      weight: 25,
    },
    {
      name: 'Wash\nTrading',
      value: (signals.wash_trading_probability || 0) * 100,
      fullName: 'Wash Trading',
      weight: 20,
    },
    {
      name: 'Bot\nCoordination',
      value: signals.bot_coordination_detected ? 100 : 0,
      fullName: 'Bot Coordination',
      weight: 10,
    },
    {
      name: 'Funding\nAnomaly',
      value: signals.funding_anomaly_score || 0,
      fullName: 'Funding Anomaly',
      weight: 10,
    },
    {
      name: 'Correlation\nBreak',
      value: signals.correlation_break_score || 0,
      fullName: 'Correlation Break',
      weight: 5,
    },
  ];

  // Determine bar color based on value
  const getBarColor = (value: number) => {
    if (value >= 50) return '#ef4444'; // red-500 - critical
    if (value >= 25) return '#f97316'; // orange-500 - high
    if (value >= 10) return '#eab308'; // yellow-500 - medium
    return '#22c55e'; // green-500 - safe
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">
            {data.fullName}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Risk Score: <span className="font-bold">{data.value.toFixed(1)}</span>/100
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            Weight in calculation: {data.weight}%
          </p>
          <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {data.value >= 50 && '🚨 Critical - High fraud risk'}
              {data.value >= 25 && data.value < 50 && '⚠️ High - Concerning signals'}
              {data.value >= 10 && data.value < 25 && '⚡ Medium - Monitor closely'}
              {data.value < 10 && '✅ Safe - Normal activity'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#71717a', fontSize: 10 }}
            interval={0}
            angle={0}
            textAnchor="middle"
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 11 }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            animationDuration={showAnimation ? 800 : 0}
            isAnimationActive={showAnimation}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

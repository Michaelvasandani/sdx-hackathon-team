'use client';

/**
 * Fraud Signal Chart Component
 *
 * Visualizes all 6 fraud detection signals as a bar chart with color-coded severity
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface IntegritySignals {
  price_index_divergence: number;
  spoofing_events: number;
  wash_trading_probability: number;
  bot_coordination_detected: boolean;
  funding_anomaly_score: number;
  correlation_break_score: number;
}

interface FraudSignalChartProps {
  signals: IntegritySignals;
}

export function FraudSignalChart({ signals }: FraudSignalChartProps) {
  // Transform signals into chart data
  const data = [
    {
      name: 'Price-Index\nDivergence',
      value: signals.price_index_divergence,
      weight: 30,
      threshold: 30,
    },
    {
      name: 'Order Book\nSpoofing',
      value: Math.min(spoofingToScore(signals.spoofing_events), 100),
      weight: 25,
      threshold: 40,
    },
    {
      name: 'Wash\nTrading',
      value: signals.wash_trading_probability * 100,
      weight: 20,
      threshold: 50,
    },
    {
      name: 'Bot\nCoordination',
      value: signals.bot_coordination_detected ? 100 : 0,
      weight: 10,
      threshold: 50,
    },
    {
      name: 'Funding\nAnomaly',
      value: signals.funding_anomaly_score,
      weight: 10,
      threshold: 30,
    },
    {
      name: 'Correlation\nBreak',
      value: signals.correlation_break_score,
      weight: 5,
      threshold: 30,
    },
  ];

  // Helper function to convert spoofing events to score
  function spoofingToScore(events: number): number {
    if (events === 0) return 0;
    if (events < 5) return events * 10;
    if (events < 10) return 50 + (events - 5) * 6;
    return Math.min(80 + (events - 10) * 4, 100);
  }

  // Determine bar color based on value
  const getBarColor = (value: number) => {
    if (value >= 50) return '#ef4444'; // red-500 - high risk
    if (value >= 25) return '#f97316'; // orange-500 - medium risk
    if (value >= 10) return '#eab308'; // yellow-500 - low risk
    return '#22c55e'; // green-500 - safe
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f0f0f] border-2 border-gray-600 p-3 shadow-lg">
          <p className="font-semibold text-white uppercase tracking-wide">
            {data.name.replace('\n', ' ')}
          </p>
          <p className="text-sm text-gray-300">
            Score: <span className="font-bold">{data.value.toFixed(1)}</span>/100
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Weight: {data.weight}% | Threshold: {data.threshold}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#ffffff', fontSize: 11 }}
            interval={0}
            angle={0}
            textAnchor="middle"
          />
          <YAxis
            tick={{ fill: '#ffffff', fontSize: 12 }}
            domain={[0, 100]}
            label={{ value: 'Risk Score (0-100)', angle: -90, position: 'insideLeft', fill: '#ffffff' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            content={() => (
              <div className="flex justify-center gap-4 text-xs mb-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-white">0-10: Safe</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span className="text-white">10-25: Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-500"></div>
                  <span className="text-white">25-50: Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-white">50+: High</span>
                </div>
              </div>
            )}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

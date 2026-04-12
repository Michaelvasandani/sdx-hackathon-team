'use client';

/**
 * Integrity Trend Chart Component
 *
 * Shows integrity score over time with historical trends
 */

import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { generateHistoricalScores } from '../lib/mock-timeseries';

interface IntegritySignals {
  price_index_divergence: number;
  spoofing_events: number;
  wash_trading_probability: number;
  bot_coordination_detected: boolean;
  funding_anomaly_score: number;
  correlation_break_score: number;
}

interface IntegrityTrendChartProps {
  currentScore: number;
  currentSignals: IntegritySignals;
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  hours?: number;
}

export function IntegrityTrendChart({
  currentScore,
  currentSignals,
  riskLevel,
  hours = 24,
}: IntegrityTrendChartProps) {
  const data = generateHistoricalScores(currentScore, currentSignals, hours);

  // Get fill color based on risk level
  const getFillColor = (level: string) => {
    switch (level) {
      case 'safe': return '#22c55e20'; // green with transparency
      case 'moderate': return '#eab30820'; // yellow with transparency
      case 'high': return '#f9731620'; // orange with transparency
      case 'critical': return '#ef444420'; // red with transparency
      default: return '#71717a20';
    }
  };

  const getStrokeColor = (level: string) => {
    switch (level) {
      case 'safe': return '#22c55e';
      case 'moderate': return '#eab308';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#71717a';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const riskLevel =
        data.score >= 80 ? 'Safe' :
        data.score >= 50 ? 'Moderate' :
        data.score >= 30 ? 'High' : 'Critical';

      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white mb-2">
            {data.time}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Integrity Score:</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {data.score}
              </span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              Risk Level: {riskLevel}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate min/max for better Y-axis scaling
  const scores = data.map(d => d.score);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);

  return (
    <div className="w-full">
      {/* Current Status Banner */}
      <div className={`mb-4 p-3 rounded-lg ${
        riskLevel === 'safe' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
        riskLevel === 'moderate' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
        riskLevel === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' :
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Current Integrity Score: {currentScore}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {riskLevel === 'safe' && 'Market appears healthy with minimal fraud signals'}
              {riskLevel === 'moderate' && 'Some concerning signals detected, monitor closely'}
              {riskLevel === 'high' && 'Multiple fraud indicators present, trade with caution'}
              {riskLevel === 'critical' && 'Severe fraud signals detected, high risk environment'}
            </p>
          </div>
          <div className={`text-3xl font-bold ${
            riskLevel === 'safe' ? 'text-green-600 dark:text-green-400' :
            riskLevel === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' :
            riskLevel === 'high' ? 'text-orange-600 dark:text-orange-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {currentScore}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getStrokeColor(riskLevel)} stopOpacity={0.3} />
                <stop offset="95%" stopColor={getStrokeColor(riskLevel)} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#71717a', fontSize: 11 }}
              interval={3}
            />
            <YAxis
              domain={[Math.floor(minScore / 10) * 10, Math.ceil(maxScore / 10) * 10]}
              tick={{ fill: '#71717a', fontSize: 12 }}
              label={{
                value: 'Integrity Score',
                angle: -90,
                position: 'insideLeft',
                fill: '#71717a',
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Risk level threshold lines */}
            <ReferenceLine
              y={80}
              stroke="#22c55e"
              strokeDasharray="3 3"
              label={{ value: 'Safe (80)', fill: '#22c55e', fontSize: 10, position: 'right' }}
            />
            <ReferenceLine
              y={50}
              stroke="#eab308"
              strokeDasharray="3 3"
              label={{ value: 'Moderate (50)', fill: '#eab308', fontSize: 10, position: 'right' }}
            />
            <ReferenceLine
              y={30}
              stroke="#f97316"
              strokeDasharray="3 3"
              label={{ value: 'High (30)', fill: '#f97316', fontSize: 10, position: 'right' }}
            />

            <Area
              type="monotone"
              dataKey="score"
              stroke={getStrokeColor(riskLevel)}
              strokeWidth={3}
              fill="url(#scoreGradient)"
              name="Integrity Score"
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Current</div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{currentScore}</div>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">24h High</div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{Math.max(...scores)}</div>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">24h Low</div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{Math.min(...scores)}</div>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">24h Change</div>
          <div className={`text-xl font-bold mt-1 ${
            data[data.length - 1].score > data[0].score
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {data[data.length - 1].score > data[0].score ? '+' : ''}
            {data[data.length - 1].score - data[0].score}
          </div>
        </div>
      </div>
    </div>
  );
}

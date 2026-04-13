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
        <div className="bg-[#0f0f0f] border-2 border-gray-600 p-3 shadow-lg">
          <p className="font-semibold text-white mb-2 uppercase tracking-wide">
            {data.time}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm text-gray-300">Integrity Score:</span>
              <span className="text-lg font-bold text-white">
                {data.score}
              </span>
            </div>
            <div className="text-xs text-gray-300">
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
      <div className={`mb-4 p-3 ${
        riskLevel === 'safe' ? 'bg-[#0f0f0f] border-2 border-green-600' :
        riskLevel === 'moderate' ? 'bg-[#0f0f0f] border-2 border-yellow-600' :
        riskLevel === 'high' ? 'bg-[#0f0f0f] border-2 border-orange-600' :
        'bg-[#0f0f0f] border-2 border-red-600'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              Current Integrity Score: {currentScore}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {riskLevel === 'safe' && 'Market appears healthy with minimal fraud signals'}
              {riskLevel === 'moderate' && 'Some concerning signals detected, monitor closely'}
              {riskLevel === 'high' && 'Multiple fraud indicators present, trade with caution'}
              {riskLevel === 'critical' && 'Severe fraud signals detected, high risk environment'}
            </p>
          </div>
          <div className={`text-3xl font-bold ${
            riskLevel === 'safe' ? 'text-green-400' :
            riskLevel === 'moderate' ? 'text-yellow-400' :
            riskLevel === 'high' ? 'text-orange-400' :
            'text-red-400'
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
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#ffffff', fontSize: 11 }}
              interval={3}
            />
            <YAxis
              domain={[Math.floor(minScore / 10) * 10, Math.ceil(maxScore / 10) * 10]}
              tick={{ fill: '#ffffff', fontSize: 12 }}
              label={{
                value: 'Integrity Score',
                angle: -90,
                position: 'insideLeft',
                fill: '#ffffff',
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
        <div className="p-3 bg-black border border-gray-700">
          <div className="text-xs text-gray-300">Current</div>
          <div className="text-xl font-bold text-white mt-1">{currentScore}</div>
        </div>
        <div className="p-3 bg-black border border-gray-700">
          <div className="text-xs text-gray-300">24h High</div>
          <div className="text-xl font-bold text-white mt-1">{Math.max(...scores)}</div>
        </div>
        <div className="p-3 bg-black border border-gray-700">
          <div className="text-xs text-gray-300">24h Low</div>
          <div className="text-xl font-bold text-white mt-1">{Math.min(...scores)}</div>
        </div>
        <div className="p-3 bg-black border border-gray-700">
          <div className="text-xs text-gray-300">24h Change</div>
          <div className={`text-xl font-bold mt-1 ${
            data[data.length - 1].score > data[0].score
              ? 'text-green-400'
              : 'text-red-400'
          }`}>
            {data[data.length - 1].score > data[0].score ? '+' : ''}
            {data[data.length - 1].score - data[0].score}
          </div>
        </div>
      </div>
    </div>
  );
}

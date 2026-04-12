'use client';

/**
 * Live Integrity Chart Component
 *
 * Shows integrity score decreasing in real-time as fraud is discovered
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface LiveIntegrityChartProps {
  currentScore: number;
  stepNumber: number;
  totalSteps: number;
  riskLevel?: 'safe' | 'moderate' | 'high' | 'critical';
  showAnimation?: boolean;
}

export function LiveIntegrityChart({
  currentScore,
  stepNumber,
  totalSteps,
  riskLevel,
  showAnimation = true,
}: LiveIntegrityChartProps) {
  // Generate data points showing score decay over investigation steps
  const data = Array.from({ length: stepNumber + 1 }, (_, i) => {
    // Start at 100, gradually decrease to current score
    const progress = i / Math.max(stepNumber, 1);
    const score = 100 - (100 - currentScore) * progress;

    return {
      step: i,
      score: Math.round(score),
      label: i === 0 ? 'Start' : i === stepNumber ? 'Now' : '',
    };
  });

  // Determine color based on risk level or current score
  const getStrokeColor = () => {
    if (riskLevel === 'critical' || currentScore < 30) return '#ef4444'; // red
    if (riskLevel === 'high' || currentScore < 50) return '#f97316'; // orange
    if (riskLevel === 'moderate' || currentScore < 80) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  const getFillGradient = () => {
    if (riskLevel === 'critical' || currentScore < 30) return 'url(#criticalGradient)';
    if (riskLevel === 'high' || currentScore < 50) return 'url(#highGradient)';
    if (riskLevel === 'moderate' || currentScore < 80) return 'url(#moderateGradient)';
    return 'url(#safeGradient)';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const riskText =
        data.score >= 80 ? '✅ Safe' :
        data.score >= 50 ? '⚠️ Moderate Risk' :
        data.score >= 30 ? '🔴 High Risk' : '🚨 Critical Risk';

      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white">
            Step {data.step} / {totalSteps}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Integrity Score: <span className="font-bold text-lg">{data.score}</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            {riskText}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="moderateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
          <XAxis
            dataKey="step"
            tick={{ fill: '#71717a', fontSize: 10 }}
            label={{ value: 'Investigation Steps', position: 'insideBottom', offset: -5, fill: '#71717a', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 30, 50, 80, 100]}
            tick={{ fill: '#71717a', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Risk level threshold lines */}
          <ReferenceLine
            y={80}
            stroke="#22c55e"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{ value: 'Safe', fill: '#22c55e', fontSize: 9, position: 'right' }}
          />
          <ReferenceLine
            y={50}
            stroke="#eab308"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{ value: 'Moderate', fill: '#eab308', fontSize: 9, position: 'right' }}
          />
          <ReferenceLine
            y={30}
            stroke="#f97316"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{ value: 'High', fill: '#f97316', fontSize: 9, position: 'right' }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke={getStrokeColor()}
            strokeWidth={3}
            fill={getFillGradient()}
            animationDuration={showAnimation ? 800 : 0}
            isAnimationActive={showAnimation}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

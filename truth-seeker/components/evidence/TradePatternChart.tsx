'use client';

/**
 * Trade Pattern Chart - Evidence Visualization
 *
 * Shows actual trade sizes over time to visualize wash trading patterns
 * Highlights identical-size trades that indicate manipulation
 */

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export interface TradeDataPoint {
  time: string;
  size: number;
  suspicious: boolean;
  tradeNumber?: number;
}

interface TradePatternChartProps {
  trades: TradeDataPoint[];
  dominantSize: number;
  suspiciousCount: number;
  totalCount: number;
}

export function TradePatternChart({
  trades,
  dominantSize,
  suspiciousCount,
  totalCount,
}: TradePatternChartProps) {
  // Add trade numbers if not provided
  const dataWithNumbers = trades.map((trade, idx) => ({
    ...trade,
    tradeNumber: trade.tradeNumber || idx + 1,
  }));

  const suspiciousRatio = (suspiciousCount / totalCount * 100).toFixed(1);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">
            Trade #{data.tradeNumber}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Time: {data.time}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Size: <span className="font-bold">{data.size}</span> contracts
          </p>
          {data.suspicious && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                🚨 SUSPICIOUS: Identical size ({dominantSize} contracts)
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
          <span className="text-lg">🚨</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
              Wash Trading Pattern Detected
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              {suspiciousCount} out of {totalCount} trades ({suspiciousRatio}%) are exactly {dominantSize} contracts
              - statistically impossible in organic trading
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-zinc-700" />
            <XAxis
              dataKey="tradeNumber"
              type="number"
              name="Trade #"
              tick={{ fill: '#71717a', fontSize: 11 }}
              label={{ value: 'Trade Number', position: 'insideBottom', offset: -10, fill: '#71717a' }}
            />
            <YAxis
              dataKey="size"
              type="number"
              name="Size"
              tick={{ fill: '#71717a', fontSize: 11 }}
              label={{ value: 'Trade Size (contracts)', angle: -90, position: 'insideLeft', fill: '#71717a' }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference line for dominant size */}
            <ReferenceLine
              y={dominantSize}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{
                value: `Wash Trading Size: ${dominantSize}`,
                fill: '#ef4444',
                fontSize: 11,
                position: 'right',
              }}
            />

            <Scatter
              data={dataWithNumbers}
              fill="#8884d8"
            >
              {dataWithNumbers.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.suspicious ? '#ef4444' : '#22c55e'}
                  fillOpacity={entry.suspicious ? 0.8 : 0.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-zinc-600 dark:text-zinc-400">
            Suspicious ({suspiciousCount} trades at {dominantSize} contracts)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-50"></div>
          <span className="text-zinc-600 dark:text-zinc-400">
            Normal ({totalCount - suspiciousCount} varied sizes)
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <p className="text-xs text-zinc-700 dark:text-zinc-300">
          <strong>💡 Why this is suspicious:</strong> In organic trading, traders use different position sizes based on their risk appetite, capital, and market conditions. Having {suspiciousRatio}% of trades be exactly {dominantSize} contracts suggests a single actor (or coordinated group) trading with themselves to inflate volume metrics.
        </p>
      </div>
    </div>
  );
}

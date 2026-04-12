'use client';

/**
 * Investigation Playback Component
 *
 * Animated playback of simulated agent fraud investigations
 * Shows step-by-step how the agent thinks, uses tools, and reaches conclusions
 */

import { useEffect, useState, useRef } from 'react';
import { SimulatedInvestigation } from '../lib/simulatedInvestigations';
import { TradePatternChart } from './evidence/TradePatternChart';
import { PriceDivergenceEvidenceChart } from './evidence/PriceDivergenceEvidenceChart';
import { SpoofingTimelineChart } from './evidence/SpoofingTimelineChart';
import { OrderBookHeatmap } from './evidence/OrderBookHeatmap';

interface InvestigationPlaybackProps {
  investigation: SimulatedInvestigation;
  autoPlay?: boolean;
  speed?: number; // 1x, 2x, 5x
  onComplete?: () => void;
}

export function InvestigationPlayback({
  investigation,
  autoPlay = true,
  speed = 1,
  onComplete,
}: InvestigationPlaybackProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest step
  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStepIndex]);

  // Playback engine
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    if (currentStepIndex >= investigation.steps.length - 1) {
      setIsPlaying(false);
      onComplete?.();
      return;
    }

    const nextIndex = currentStepIndex + 1;
    const nextStep = investigation.steps[nextIndex];
    const delay = nextStep.delay / speed;

    timeoutRef.current = setTimeout(() => {
      setCurrentStepIndex(nextIndex);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentStepIndex, isPlaying, isPaused, investigation.steps, speed, onComplete]);

  const handlePlay = () => {
    if (currentStepIndex >= investigation.steps.length - 1) {
      // Restart from beginning
      setCurrentStepIndex(-1);
    }
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleReset = () => {
    setCurrentStepIndex(-1);
    setIsPlaying(false);
    setIsPaused(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const visibleSteps = investigation.steps.slice(0, currentStepIndex + 1);
  const progress = ((currentStepIndex + 1) / investigation.steps.length) * 100;

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'thought':
        return '💭';
      case 'tool_call':
        return '🔧';
      case 'tool_result':
        return '📊';
      case 'conclusion':
        return '🎯';
      case 'alert':
        return '🚨';
      default:
        return '📝';
    }
  };

  const getStepBgColor = (type: string) => {
    switch (type) {
      case 'thought':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'tool_call':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'tool_result':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'conclusion':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'alert':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Investigation Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{investigation.emoji}</div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {investigation.name}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {investigation.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Final Score
            </div>
            <div className={`text-3xl font-bold ${
              investigation.finalScore >= 80
                ? 'text-green-600'
                : investigation.finalScore >= 50
                ? 'text-yellow-600'
                : investigation.finalScore >= 30
                ? 'text-orange-600'
                : 'text-red-600'
            }`}>
              {investigation.finalScore}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Progress
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {currentStepIndex + 1} / {investigation.steps.length} steps
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying || isPaused ? (
            <button
              onClick={handlePlay}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {currentStepIndex >= investigation.steps.length - 1 ? '↻ Replay' : '▶ Play'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              ⏸ Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            ⏹ Reset
          </button>
          <div className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
            Speed: {speed}x
          </div>
        </div>
      </div>

      {/* Investigation Steps */}
      <div className="space-y-3">
        {visibleSteps.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-12 border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="text-6xl mb-4">{investigation.emoji}</div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Ready to Watch Agent Investigation
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Click "Play" to see how the agent investigates this market step-by-step
            </p>
            <button
              onClick={handlePlay}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ▶ Start Investigation
            </button>
          </div>
        )}

        {visibleSteps.map((step, index) => (
          <div
            key={index}
            className={`bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-4 border animate-fadeIn ${getStepBgColor(
              step.type
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{getStepIcon(step.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                    {step.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    Step {index + 1}
                  </span>
                </div>
                <div className="text-sm text-zinc-900 dark:text-white whitespace-pre-wrap">
                  {step.content}
                </div>

                {/* Evidence-based visualizations */}
                {step.visualizationData && (
                  <div className="mt-4">
                    {step.visualizationData.type === 'trade_pattern' && (
                      <TradePatternChart
                        trades={step.visualizationData.trades}
                        dominantSize={step.visualizationData.dominantSize}
                        suspiciousCount={step.visualizationData.suspiciousCount}
                        totalCount={step.visualizationData.totalCount}
                      />
                    )}
                    {step.visualizationData.type === 'price_divergence' && (
                      <PriceDivergenceEvidenceChart
                        data={step.visualizationData.data}
                        finalPriceChange={step.visualizationData.finalPriceChange}
                        finalIndexChange={step.visualizationData.finalIndexChange}
                        maxDivergence={step.visualizationData.maxDivergence}
                      />
                    )}
                    {step.visualizationData.type === 'spoofing_timeline' && (
                      <SpoofingTimelineChart
                        events={step.visualizationData.events}
                        totalEvents={step.visualizationData.totalEvents}
                        suspiciousCount={step.visualizationData.suspiciousCount}
                        avgLifetime={step.visualizationData.avgLifetime}
                      />
                    )}
                    {step.visualizationData.type === 'order_book_heatmap' && (
                      <OrderBookHeatmap
                        levels={step.visualizationData.levels}
                        suspiciousPrice={step.visualizationData.suspiciousPrice}
                        suspiciousCount={step.visualizationData.suspiciousCount}
                        totalOrders={step.visualizationData.totalOrders}
                      />
                    )}
                  </div>
                )}

                {step.data && step.type !== 'conclusion' && (
                  <details className="mt-3">
                    <summary className="text-xs font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200">
                      View raw data
                    </summary>
                    <pre className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={stepsEndRef} />
      </div>
    </div>
  );
}

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
        return 'bg-[#0f0f0f] border-2 border-blue-600';
      case 'tool_call':
        return 'bg-[#0f0f0f] border-2 border-purple-600';
      case 'tool_result':
        return 'bg-[#0f0f0f] border-2 border-green-600';
      case 'conclusion':
        return 'bg-[#0f0f0f] border-2 border-yellow-600';
      case 'alert':
        return 'bg-[#0f0f0f] border-2 border-red-600';
      default:
        return 'bg-[#0f0f0f] border-2 border-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Investigation Header */}
      <div className="bg-[#0f0f0f] p-6 border-2 border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{investigation.emoji}</div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                {investigation.name}
              </h3>
              <p className="text-sm text-gray-400">
                {investigation.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              Final Score
            </div>
            <div className={`text-3xl font-bold ${
              investigation.finalScore >= 80
                ? 'text-green-400'
                : investigation.finalScore >= 50
                ? 'text-yellow-400'
                : investigation.finalScore >= 30
                ? 'text-orange-400'
                : 'text-red-400'
            }`}>
              {investigation.finalScore}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Progress
            </span>
            <span className="text-xs text-gray-400">
              {currentStepIndex + 1} / {investigation.steps.length} steps
            </span>
          </div>
          <div className="w-full bg-gray-700 h-2">
            <div
              className="bg-blue-600 h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying || isPaused ? (
            <button
              onClick={handlePlay}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors border border-blue-500 uppercase tracking-wide"
            >
              {currentStepIndex >= investigation.steps.length - 1 ? '↻ Replay' : '▶ Play'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium hover:bg-yellow-700 transition-colors border border-yellow-500 uppercase tracking-wide"
            >
              ⏸ Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-[#0f0f0f] text-white text-sm font-medium hover:bg-gray-900 transition-colors border border-gray-600 uppercase tracking-wide"
          >
            ⏹ Reset
          </button>
          <div className="ml-auto text-xs text-gray-400 uppercase tracking-wide">
            Speed: {speed}x
          </div>
        </div>
      </div>

      {/* Investigation Steps */}
      <div className="space-y-3">
        {visibleSteps.length === 0 && (
          <div className="bg-[#0f0f0f] p-12 border-2 border-gray-700 text-center">
            <div className="text-6xl mb-4">{investigation.emoji}</div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
              Ready to Watch Agent Investigation
            </h3>
            <p className="text-gray-400 mb-6">
              Click "Play" to see how the agent investigates this market step-by-step
            </p>
            <button
              onClick={handlePlay}
              className="px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors border border-blue-500 uppercase tracking-wide"
            >
              ▶ Start Investigation
            </button>
          </div>
        )}

        {visibleSteps.map((step, index) => (
          <div
            key={index}
            className={`p-4 animate-fadeIn ${getStepBgColor(
              step.type
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{getStepIcon(step.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                    {step.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">
                    Step {index + 1}
                  </span>
                </div>
                <div className="text-sm text-white whitespace-pre-wrap">
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
                    <summary className="text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-300 uppercase tracking-wide">
                      View raw data
                    </summary>
                    <pre className="mt-2 p-3 bg-black border border-gray-700 text-xs overflow-x-auto text-gray-300">
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

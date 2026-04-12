'use client';

/**
 * Fraud Investigation Demo Page
 *
 * Watch the Detective Agent investigate fraud in real-time with simulated scenarios
 */

import { useState } from 'react';
import Link from 'next/link';
import { InvestigationPlayback } from '../../components/InvestigationPlayback';
import { ALL_INVESTIGATIONS, INVESTIGATIONS_BY_ID } from '../../lib/simulatedInvestigations';

export default function DemoPage() {
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(
    'wash-trading'
  );
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const selectedInvestigation = selectedInvestigationId
    ? INVESTIGATIONS_BY_ID[selectedInvestigationId]
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                🕵️ Agent Investigation Demo
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Watch the Detective Agent investigate fraud step-by-step in real-time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Speed:
              </label>
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Investigation Selector */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
            Choose Investigation Scenario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_INVESTIGATIONS.map((investigation) => (
              <button
                key={investigation.id}
                onClick={() => setSelectedInvestigationId(investigation.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedInvestigationId === investigation.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">{investigation.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                      {investigation.name}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                  {investigation.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {investigation.steps.length} steps
                  </span>
                  <span
                    className={`font-bold ${
                      investigation.finalScore >= 80
                        ? 'text-green-600'
                        : investigation.finalScore >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    Score: {investigation.finalScore}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Investigation Playback */}
        {selectedInvestigation && (
          <InvestigationPlayback
            key={`${selectedInvestigation.id}-${playbackSpeed}`}
            investigation={selectedInvestigation}
            autoPlay={false}
            speed={playbackSpeed}
          />
        )}

        {/* Explanation */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
            💡 How This Works
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>These are simulated investigations</strong> showing how the Detective Agent
              operates. Each investigation demonstrates:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>💭 Agent Reasoning</strong> - The LLM thinks through what to investigate
                and why
              </li>
              <li>
                <strong>🔧 Tool Selection</strong> - Agent autonomously chooses which investigation
                tools to use
              </li>
              <li>
                <strong>📊 Evidence Gathering</strong> - Tools return market data that the agent
                analyzes
              </li>
              <li>
                <strong>🎯 Synthesis</strong> - Agent combines evidence from multiple sources to
                reach conclusions
              </li>
              <li>
                <strong>🚨 Action</strong> - Agent generates fraud alerts with confidence levels
              </li>
            </ul>
            <p className="pt-2">
              <strong>Want to see the REAL agent?</strong>{' '}
              <Link href="/agent" className="font-bold underline hover:text-blue-600">
                Visit the Live Agent page
              </Link>{' '}
              to watch it investigate actual Forum markets using GPT-4.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

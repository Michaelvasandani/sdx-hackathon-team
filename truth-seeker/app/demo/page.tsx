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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b-2 border-red-600 bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 uppercase tracking-wide">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                AGENT INVESTIGATION DEMO
              </h1>
              <p className="mt-1 text-sm text-gray-400 uppercase tracking-wide">
                Watch the Detective Agent investigate fraud step-by-step in real-time
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Speed:
              </label>
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1 text-xs font-medium transition-colors border uppercase tracking-wide ${
                    playbackSpeed === speed
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#0f0f0f] text-gray-300 border-gray-600 hover:border-gray-400'
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
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">
            Choose Investigation Scenario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_INVESTIGATIONS.map((investigation) => (
              <button
                key={investigation.id}
                onClick={() => setSelectedInvestigationId(investigation.id)}
                className={`text-left p-4 border-2 transition-all ${
                  selectedInvestigationId === investigation.id
                    ? 'border-red-600 bg-[#0f0f0f]'
                    : 'border-gray-700 bg-[#0f0f0f] hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">{investigation.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-white uppercase tracking-wide">
                      {investigation.name}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {investigation.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 uppercase tracking-wide">
                    {investigation.steps.length} steps
                  </span>
                  <span
                    className={`font-bold ${
                      investigation.finalScore >= 80
                        ? 'text-green-400'
                        : investigation.finalScore >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
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
        <div className="mt-12 bg-[#0f0f0f] border-2 border-blue-600 p-6">
          <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">
            💡 How This Works
          </h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <strong className="text-white">These are simulated investigations</strong> showing how the Detective Agent
              operates. Each investigation demonstrates:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong className="text-white">💭 Agent Reasoning</strong> - The LLM thinks through what to investigate
                and why
              </li>
              <li>
                <strong className="text-white">🔧 Tool Selection</strong> - Agent autonomously chooses which investigation
                tools to use
              </li>
              <li>
                <strong className="text-white">📊 Evidence Gathering</strong> - Tools return market data that the agent
                analyzes
              </li>
              <li>
                <strong className="text-white">🎯 Synthesis</strong> - Agent combines evidence from multiple sources to
                reach conclusions
              </li>
              <li>
                <strong className="text-white">🚨 Action</strong> - Agent generates fraud alerts with confidence levels
              </li>
            </ul>
            <p className="pt-2">
              <strong className="text-white">Want to see the REAL agent?</strong>{' '}
              <Link href="/agent" className="font-bold underline text-blue-400 hover:text-blue-300">
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

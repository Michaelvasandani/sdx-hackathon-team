import type { Market } from "@/lib/forum";

// ── Types ──────────────────────────────────────────────────────────────────

export type Stage = "PRE-IPO" | "SERIES B" | "SERIES A" | "SEED";

export interface IpoEntry {
  rank: number;
  ticker: string;
  name: string;
  ipoScore: number;
  stage: Stage;
  changeIndexPercentPastDay: number;
  volumePastDay: number;
  openInterest: number;
  undiscovered: boolean;
  breakdown: {
    velocityScore: number;
    volumeScore: number;
    discoveryScore: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

function getStage(score: number): Stage {
  if (score >= 80) return "PRE-IPO";
  if (score >= 60) return "SERIES B";
  if (score >= 40) return "SERIES A";
  return "SEED";
}

export function scoreMarkets(markets: Market[]): IpoEntry[] {
  const candidates = markets.filter(
    (m) =>
      m.live &&
      (m.changeIndexPercentPastDay ?? m.changePercentPastDay) > 0
  );

  if (candidates.length === 0) return [];

  const velocities = candidates.map(
    (m) => m.changeIndexPercentPastDay ?? m.changePercentPastDay
  );
  const volumes = candidates.map((m) => m.volumePastDay);
  const discoveries = candidates.map((m) => 1 / (m.openInterest + 1));

  const minV = velocities.reduce((a, b) => Math.min(a, b));
  const maxV = velocities.reduce((a, b) => Math.max(a, b));
  const minVol = volumes.reduce((a, b) => Math.min(a, b));
  const maxVol = volumes.reduce((a, b) => Math.max(a, b));
  const minD = discoveries.reduce((a, b) => Math.min(a, b));
  const maxD = discoveries.reduce((a, b) => Math.max(a, b));

  const sortedOI = [...candidates.map((m) => m.openInterest)].sort(
    (a, b) => a - b
  );
  const oiP25 = sortedOI[Math.floor(sortedOI.length * 0.25)];

  const scored = candidates.map((m, i) => {
    const velocityScore = normalize(velocities[i], minV, maxV);
    const volumeScore = normalize(volumes[i], minVol, maxVol);
    const discoveryScore = normalize(discoveries[i], minD, maxD);
    const ipoScore =
      velocityScore * 0.6 + volumeScore * 0.2 + discoveryScore * 0.2;
    const roundedScore = Math.round(ipoScore * 10) / 10;

    return {
      ticker: m.ticker,
      name: m.name,
      ipoScore: roundedScore,
      stage: getStage(roundedScore),
      changeIndexPercentPastDay:
        m.changeIndexPercentPastDay ?? m.changePercentPastDay,
      volumePastDay: m.volumePastDay,
      openInterest: m.openInterest,
      undiscovered: candidates.length > 1 && m.openInterest <= oiP25,
      breakdown: {
        velocityScore: Math.round(velocityScore * 10) / 10,
        volumeScore: Math.round(volumeScore * 10) / 10,
        discoveryScore: Math.round(discoveryScore * 10) / 10,
      },
    };
  });

  return scored
    .sort((a, b) => b.ipoScore - a.ipoScore)
    .slice(0, 10)
    .map((entry, i) => ({ rank: i + 1, ...entry }));
}

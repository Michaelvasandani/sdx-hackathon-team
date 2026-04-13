/**
 * Integrity Score Badge Component
 *
 * Displays integrity score with color-coded risk level
 */

interface IntegrityScoreBadgeProps {
  score: number;
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  size?: 'sm' | 'md' | 'lg';
}

export function IntegrityScoreBadge({ score, riskLevel, size = 'md' }: IntegrityScoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const colorClasses = {
    safe: 'bg-[#0f0f0f] text-green-400 border border-green-600',
    moderate: 'bg-[#0f0f0f] text-yellow-400 border border-yellow-600',
    high: 'bg-[#0f0f0f] text-orange-400 border border-orange-600',
    critical: 'bg-[#0f0f0f] text-red-400 border border-red-600',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide ${sizeClasses[size]} ${colorClasses[riskLevel]}`}>
      <span>{score}</span>
    </div>
  );
}

interface RiskLevelBadgeProps {
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  size?: 'sm' | 'md' | 'lg';
}

export function RiskLevelBadge({ riskLevel, size = 'md' }: RiskLevelBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const colorClasses = {
    safe: 'bg-[#0f0f0f] text-green-400 border border-green-600',
    moderate: 'bg-[#0f0f0f] text-yellow-400 border border-yellow-600',
    high: 'bg-[#0f0f0f] text-orange-400 border border-orange-600',
    critical: 'bg-[#0f0f0f] text-red-400 border border-red-600',
  };

  const labels = {
    safe: 'SAFE',
    moderate: 'WATCH',
    high: 'HIGH',
    critical: 'AVOID',
  };

  return (
    <span className={`inline-block font-medium uppercase tracking-wide ${sizeClasses[size]} ${colorClasses[riskLevel]}`}>
      {labels[riskLevel]}
    </span>
  );
}

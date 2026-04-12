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
    safe: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const emoji = {
    safe: '✓',
    moderate: '⚠',
    high: '⚠',
    critical: '🚨',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses[size]} ${colorClasses[riskLevel]}`}>
      <span>{emoji[riskLevel]}</span>
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
    safe: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`inline-block rounded-full font-medium uppercase ${sizeClasses[size]} ${colorClasses[riskLevel]}`}>
      {riskLevel}
    </span>
  );
}

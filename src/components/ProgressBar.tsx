"use client";

interface ProgressBarProps {
  completedMatches: number;
  totalMatches: number;
  remainingJobs: number;
}

export default function ProgressBar({
  completedMatches,
  totalMatches,
  remainingJobs,
}: ProgressBarProps) {
  const percentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <div className="mb-8 bg-soft-white neo-border neo-shadow py-3 px-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-bold uppercase tracking-wider">
          Progress: {completedMatches} / {totalMatches} matches
        </span>
        <span className="text-sm font-bold uppercase tracking-wider">
          {remainingJobs} jobs remaining
        </span>
      </div>
      <div className="w-full bg-warm-tan neo-border h-4 rounded-full overflow-hidden">
        <div
          className="bg-sage-green h-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

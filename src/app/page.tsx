"use client";

import { useState } from "react";
import { jobs } from "@/data/jobs";
import { BracketState } from "@/types/bracket";
import {
  initializeBracket,
  selectWinner,
  getBracketProgress,
} from "@/lib/bracketLogic";
import MatchView from "@/components/MatchView";
import ProgressBar from "@/components/ProgressBar";
import Results from "@/components/Results";

export default function Home() {
  const [bracketState, setBracketState] = useState<BracketState | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const startBracket = () => {
    setBracketState(initializeBracket(jobs));
    setIsStarted(true);
  };

  const handleSelectWinner = (jobId: number) => {
    if (!bracketState || !bracketState.currentMatch) return;

    const winner =
      bracketState.currentMatch.job1?.id === jobId
        ? bracketState.currentMatch.job1
        : bracketState.currentMatch.job2;

    if (winner) {
      const newState = selectWinner(bracketState, winner);
      setBracketState(newState);
    }
  };

  const handleRestart = () => {
    setBracketState(null);
    setIsStarted(false);
  };

  if (!isStarted || !bracketState) {
    return (
      <div className="min-h-screen bg-sage-green flex items-center justify-center p-4">
        <div className="text-center max-w-2xl bg-soft-white neo-border neo-shadow p-12">
          <h1 className="text-7xl neo-title mb-6">
            Job Bracket Challenge
          </h1>
          <p className="text-2xl font-bold mb-8">
            Discover your ideal career through a fun tournament! Compare 128 different
            jobs head-to-head in a double-elimination bracket. Each job gets two
            chances before being eliminated.
          </p>
          <button
            onClick={startBracket}
            className="neo-button bg-pale-salmon text-2xl uppercase"
          >
            Start Tournament
          </button>
        </div>
      </div>
    );
  }

  const progress = getBracketProgress(bracketState);
  const isComplete = !bracketState.currentMatch;

  if (isComplete) {
    // Get top jobs based on how far they made it
    const winnerMatches = bracketState.matches.filter((m) => m.winner);
    const jobWinCounts = new Map<number, number>();

    winnerMatches.forEach((match) => {
      if (match.winner) {
        const count = jobWinCounts.get(match.winner.id) || 0;
        jobWinCounts.set(match.winner.id, count + 1);
      }
    });

    const topJobs = Array.from(jobWinCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([jobId]) => jobs.find((j) => j.id === jobId)!)
      .filter(Boolean);

    return (
      <div className="min-h-screen bg-warm-tan p-8">
        <Results topJobs={topJobs} onRestart={handleRestart} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-wood p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-6xl neo-title">
            Job Bracket
          </h1>
          <button
            onClick={handleRestart}
            className="neo-button bg-soft-white text-sm py-2 px-4"
          >
            Restart
          </button>
        </div>

        <ProgressBar
          completedMatches={progress.completedMatches}
          totalMatches={progress.totalMatches}
          remainingJobs={progress.remainingJobs}
        />

        {bracketState.currentMatch && (
          <MatchView
            match={bracketState.currentMatch}
            onSelectWinner={handleSelectWinner}
          />
        )}
      </div>
    </div>
  );
}

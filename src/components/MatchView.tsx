"use client";

import { Match } from "@/types/bracket";
import JobCard from "./JobCard";

interface MatchViewProps {
  match: Match;
  onSelectWinner: (jobId: number) => void;
}

export default function MatchView({ match, onSelectWinner }: MatchViewProps) {
  if (!match.job1 || !match.job2) {
    return (
      <div className="text-center py-12 bg-white neo-border neo-shadow">
        <h2 className="text-3xl font-black text-black uppercase">No active match</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8 bg-soft-white neo-border neo-shadow py-4 px-6">
        <h2 className="text-4xl neo-title mb-1">
          {match.bracket === "winners" ? "Winners" : "Losers"} Bracket - Round {match.round}
        </h2>
        <p className="text-lg font-bold uppercase tracking-wide">Which job interests you more?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <JobCard
          job={match.job1}
          onSelect={() => onSelectWinner(match.job1!.id)}
        />
        <JobCard
          job={match.job2}
          onSelect={() => onSelectWinner(match.job2!.id)}
        />
      </div>
    </div>
  );
}

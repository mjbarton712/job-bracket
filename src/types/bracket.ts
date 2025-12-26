import { Job } from "@/data/jobs";

export interface Match {
  id: string;
  job1: Job | null;
  job2: Job | null;
  winner: Job | null;
  round: number;
  bracket: "winners" | "losers";
  position: number;
}

export interface BracketState {
  matches: Match[];
  currentMatch: Match | null;
  completedJobs: Set<number>; // Jobs eliminated after their second loss
  lossCounts: Map<number, number>; // Tracks number of losses per job
  eliminationOrder: Job[]; // Jobs in the order they were eliminated
  history: BracketState[]; // For undo functionality
  winners: Job[]; // Top 5 jobs at the end
  placements: Map<number, number>; // Maps job ID to placement (1-5 for top 5)
}

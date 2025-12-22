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
  completedJobs: Set<number>; // Jobs eliminated twice
  losersQueue: Job[]; // Jobs that lost once, waiting for losers bracket
}

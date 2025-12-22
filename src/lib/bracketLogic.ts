import { Job } from "@/data/jobs";
import { Match, BracketState } from "@/types/bracket";

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize the bracket with 128 jobs
export function initializeBracket(jobs: Job[]): BracketState {
  const shuffledJobs = shuffleArray(jobs);
  const matches: Match[] = [];
  
  // Create first round of winners bracket (64 matches for 128 jobs)
  for (let i = 0; i < 64; i++) {
    matches.push({
      id: `w-r1-${i}`,
      job1: shuffledJobs[i * 2],
      job2: shuffledJobs[i * 2 + 1],
      winner: null,
      round: 1,
      bracket: "winners",
      position: i,
    });
  }

  return {
    matches,
    currentMatch: matches[0],
    completedJobs: new Set(),
    losersQueue: [],
  };
}

// Select winner of current match and update bracket state
export function selectWinner(
  state: BracketState,
  winner: Job
): BracketState {
  if (!state.currentMatch) return state;

  const updatedMatches = [...state.matches];
  const currentMatchIndex = updatedMatches.findIndex(
    (m) => m.id === state.currentMatch!.id
  );

  if (currentMatchIndex === -1) return state;

  // Update current match with winner
  updatedMatches[currentMatchIndex] = {
    ...state.currentMatch,
    winner,
  };

  // Determine loser
  const loser =
    state.currentMatch.job1?.id === winner.id
      ? state.currentMatch.job2
      : state.currentMatch.job1;

  const newCompletedJobs = new Set(state.completedJobs);
  const newLosersQueue = [...state.losersQueue];

  // Handle loser based on bracket
  if (loser) {
    if (state.currentMatch.bracket === "winners") {
      // First loss - goes to losers bracket
      newLosersQueue.push(loser);
    } else {
      // Second loss - eliminated
      newCompletedJobs.add(loser.id);
    }
  }

  // Create next round matches if needed
  const currentRoundMatches = updatedMatches.filter(
    (m) =>
      m.round === state.currentMatch!.round &&
      m.bracket === state.currentMatch!.bracket
  );
  const completedInRound = currentRoundMatches.filter((m) => m.winner).length;

  // If all matches in current round are complete, create next round
  if (completedInRound === currentRoundMatches.length) {
    const winners = currentRoundMatches.map((m) => m.winner!);
    const nextRound = state.currentMatch.round + 1;
    const nextMatchCount = Math.floor(winners.length / 2);

    if (nextMatchCount > 0) {
      for (let i = 0; i < nextMatchCount; i++) {
        updatedMatches.push({
          id: `${state.currentMatch.bracket[0]}-r${nextRound}-${i}`,
          job1: winners[i * 2],
          job2: winners[i * 2 + 1],
          winner: null,
          round: nextRound,
          bracket: state.currentMatch.bracket,
          position: i,
        });
      }
    }

    // Start losers bracket if winners bracket Round 1 is complete
    if (
      state.currentMatch.bracket === "winners" &&
      state.currentMatch.round === 1 &&
      newLosersQueue.length > 0
    ) {
      const losersToMatch = Math.min(newLosersQueue.length, 64);
      for (let i = 0; i < Math.floor(losersToMatch / 2); i++) {
        updatedMatches.push({
          id: `l-r1-${i}`,
          job1: newLosersQueue[i * 2],
          job2: newLosersQueue[i * 2 + 1],
          winner: null,
          round: 1,
          bracket: "losers",
          position: i,
        });
      }
    }
  }

  // Find next unfinished match
  const nextMatch = updatedMatches.find((m) => !m.winner && m.job1 && m.job2);

  return {
    matches: updatedMatches,
    currentMatch: nextMatch || null,
    completedJobs: newCompletedJobs,
    losersQueue: newLosersQueue,
  };
}

// Get progress statistics
export function getBracketProgress(state: BracketState): {
  totalMatches: number;
  completedMatches: number;
  remainingJobs: number;
} {
  const completedMatches = state.matches.filter((m) => m.winner).length;
  const totalMatches = state.matches.length;
  const remainingJobs = 128 - state.completedJobs.size;

  return {
    totalMatches,
    completedMatches,
    remainingJobs,
  };
}

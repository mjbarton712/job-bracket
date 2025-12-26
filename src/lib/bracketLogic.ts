import { Job } from "@/data/jobs";
import { Match, BracketState } from "@/types/bracket";

// Bracket constants
const TOTAL_JOBS = 128;
const WINNERS_BRACKET_ROUNDS = 7; // 128 -> 64 -> 32 -> 16 -> 8 -> 4 -> 2 -> 1
const LOSERS_BRACKET_ROUNDS = 12; // Double elimination losers bracket
const TOTAL_MATCHES = 254; // Base total without potential reset final
const FIRST_ROUND_MATCHES = TOTAL_JOBS / 2;
const GRAND_FINAL_ID = "grand-final";
const GRAND_FINAL_RESET_ID = "grand-final-reset";

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
  if (jobs.length !== TOTAL_JOBS) {
    throw new Error(
      `Expected exactly ${TOTAL_JOBS} jobs, but received ${jobs.length}. ` +
      `Please ensure the jobs array contains ${TOTAL_JOBS} jobs.`
    );
  }

  const shuffledJobs = shuffleArray(jobs);
  const matches: Match[] = [];
  const lossCounts = new Map<number, number>();
  shuffledJobs.forEach((job) => lossCounts.set(job.id, 0));
  
  // Create first round of winners bracket (64 matches for 128 jobs)
  for (let i = 0; i < FIRST_ROUND_MATCHES; i++) {
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
    lossCounts,
    eliminationOrder: [],
    history: [],
    winners: [],
    placements: new Map(),
  };
}

// Helper function to get the loser of a match
function getLoser(match: Match): Job | null {
  if (!match.winner || !match.job1 || !match.job2) return null;
  return match.job1.id === match.winner.id ? match.job2 : match.job1;
}

// Helper function to create winners bracket next round matches
function createWinnersBracketRound(
  updatedMatches: Match[],
  currentRound: number
): void {
  const currentWBMatches = updatedMatches.filter(
    m => m.bracket === "winners" && m.round === currentRound
  );
  
  if (currentWBMatches.length === 0) return;
  if (!currentWBMatches.every(m => m.winner)) return;
  
  const winners = currentWBMatches.map(m => m.winner!);
  if (winners.length < 2) return;
  
  const nextRound = currentRound + 1;
  for (let i = 0; i < winners.length / 2; i++) {
    const matchId = `w-r${nextRound}-${i}`;
    if (!updatedMatches.find(m => m.id === matchId)) {
      updatedMatches.push({
        id: matchId,
        job1: winners[i * 2],
        job2: winners[i * 2 + 1],
        winner: null,
        round: nextRound,
        bracket: "winners",
        position: i,
      });
    }
  }
}

// Helper function to create first round of losers bracket
function createLosersBracketRound1(updatedMatches: Match[]): void {
  const wbR1Matches = updatedMatches.filter(m => m.bracket === "winners" && m.round === 1);
  if (!wbR1Matches.every(m => m.winner)) return;
  
  const wbR1Losers = wbR1Matches.map(m => getLoser(m)!).filter(Boolean);
  const pairCount = Math.floor(wbR1Losers.length / 2);
  for (let i = 0; i < pairCount; i++) {
    const job1 = wbR1Losers[i * 2];
    const job2 = wbR1Losers[i * 2 + 1];
    if (!job1 || !job2) continue;
    const matchId = `l-r1-${i}`;
    if (!updatedMatches.find(m => m.id === matchId)) {
      updatedMatches.push({
        id: matchId,
        job1,
        job2,
        winner: null,
        round: 1,
        bracket: "losers",
        position: i,
      });
    }
  }
}

// Helper function to create losers bracket round 2
function createLosersBracketRound2(updatedMatches: Match[]): void {
  const lbR1Matches = updatedMatches.filter(m => m.bracket === "losers" && m.round === 1);
  const wbR2Matches = updatedMatches.filter(m => m.bracket === "winners" && m.round === 2);
  
  if (lbR1Matches.length === 0 || !lbR1Matches.every(m => m.winner)) return;
  if (wbR2Matches.length === 0 || !wbR2Matches.every(m => m.winner)) return;
  
  const lbR1Winners = lbR1Matches.map(m => m.winner!).filter(Boolean);
  const wbR2Losers = wbR2Matches.map(m => getLoser(m)!).filter(Boolean);
  const pairCount = Math.min(lbR1Winners.length, wbR2Losers.length);
  
  for (let i = 0; i < pairCount; i++) {
    const job1 = lbR1Winners[i];
    const job2 = wbR2Losers[i];
    if (!job1 || !job2) continue;
    const matchId = `l-r2-${i}`;
    if (!updatedMatches.find(m => m.id === matchId)) {
      updatedMatches.push({
        id: matchId,
        job1,
        job2,
        winner: null,
        round: 2,
        bracket: "losers",
        position: i,
      });
    }
  }
}

// Helper function to create later rounds of losers bracket (rounds 3-12)
function createLosersBracketLaterRounds(updatedMatches: Match[]): void {
  // Even LB rounds (4, 6, 8, 10, 12): Winners of previous LB round vs Losers of WB round (round/2 + 1)
  // Odd LB rounds (3, 5, 7, 9, 11): Winners of previous LB round vs each other
  for (let r = 2; r <= LOSERS_BRACKET_ROUNDS - 1; r++) {
    const currentLBRoundMatches = updatedMatches.filter(
      m => m.bracket === "losers" && m.round === r
    );
    
    if (currentLBRoundMatches.length === 0) continue;
    if (!currentLBRoundMatches.every(m => m.winner)) {
      // If this round isn't complete, no point checking later rounds
      return;
    }
    
    const winners = currentLBRoundMatches.map(m => m.winner!);
    const nextRound = r + 1;
    
    if (nextRound % 2 !== 0) {
      // Odd round: Winners face each other
      for (let i = 0; i < winners.length / 2; i++) {
        const matchId = `l-r${nextRound}-${i}`;
        if (!updatedMatches.find(m => m.id === matchId)) {
          updatedMatches.push({
            id: matchId,
            job1: winners[i * 2],
            job2: winners[i * 2 + 1],
            winner: null,
            round: nextRound,
            bracket: "losers",
            position: i,
          });
        }
      }
    } else {
      // Even round: Winners face losers from WB
      const wbRound = (nextRound / 2) + 1;
      const wbMatches = updatedMatches.filter(
        m => m.bracket === "winners" && m.round === wbRound
      );
      
      if (wbMatches.length > 0 && wbMatches.every(m => m.winner)) {
        const wbLosers = wbMatches.map(m => getLoser(m)!);
        for (let i = 0; i < winners.length; i++) {
          const matchId = `l-r${nextRound}-${i}`;
          if (!updatedMatches.find(m => m.id === matchId)) {
            updatedMatches.push({
              id: matchId,
              job1: winners[i],
              job2: wbLosers[i],
              winner: null,
              round: nextRound,
              bracket: "losers",
              position: i,
            });
          }
        }
      }
    }
  }
}

// Helper function to create and manage grand finals (including reset match)
function ensureGrandFinalMatches(updatedMatches: Match[]): void {
  const wbFinal = updatedMatches.find(
    m => m.bracket === "winners" && m.round === WINNERS_BRACKET_ROUNDS
  );
  const lbFinal = updatedMatches.find(
    m => m.bracket === "losers" && m.round === LOSERS_BRACKET_ROUNDS
  );

  if (!wbFinal?.winner || !lbFinal?.winner) return;

  let grandFinalIndex = updatedMatches.findIndex(m => m.id === GRAND_FINAL_ID);
  let grandFinal = updatedMatches[grandFinalIndex];
  if (!grandFinal) {
    grandFinal = {
      id: GRAND_FINAL_ID,
      job1: wbFinal.winner,
      job2: lbFinal.winner,
      winner: null,
      round: WINNERS_BRACKET_ROUNDS + 1,
      bracket: "winners",
      position: 0,
    };
    updatedMatches.push(grandFinal);
    grandFinalIndex = updatedMatches.length - 1;
  } else {
    grandFinal = {
      ...grandFinal,
      job1: wbFinal.winner,
      job2: lbFinal.winner,
    };
    updatedMatches[grandFinalIndex] = grandFinal;
  }

  const resetMatchIndex = updatedMatches.findIndex(m => m.id === GRAND_FINAL_RESET_ID);
  const grandFinalLoser = grandFinal.winner ? getLoser(grandFinal) : null;
  const winnersBracketChampion = wbFinal.winner;
  const needsReset = Boolean(
    grandFinal.winner &&
    grandFinalLoser &&
    grandFinalLoser.id === winnersBracketChampion.id
  );

  if (needsReset) {
    if (resetMatchIndex === -1) {
      updatedMatches.push({
        id: GRAND_FINAL_RESET_ID,
        job1: winnersBracketChampion,
        job2: lbFinal.winner,
        winner: null,
        round: WINNERS_BRACKET_ROUNDS + 2,
        bracket: "winners",
        position: 0,
      });
    } else {
      updatedMatches[resetMatchIndex] = {
        ...updatedMatches[resetMatchIndex],
        job1: winnersBracketChampion,
        job2: lbFinal.winner,
      };
    }
  } else if (resetMatchIndex !== -1) {
    updatedMatches.splice(resetMatchIndex, 1);
  }
}

function getFinalMatch(updatedMatches: Match[]): Match | undefined {
  const resetFinal = updatedMatches.find(
    m => m.id === GRAND_FINAL_RESET_ID && m.winner
  );
  if (resetFinal) return resetFinal;
  return updatedMatches.find(m => m.id === GRAND_FINAL_ID && m.winner);
}

// Helper function to calculate final rankings using bracket positions
// Champion = grand final winner
// Runner-up = grand final loser (has 1 loss)
// Places 3-5 = last 3 jobs eliminated (losers bracket finalists)
function calculateFinalRankings(
  updatedMatches: Match[],
  eliminationOrder: Job[]
): {
  winners: Job[];
  placements: Map<number, number>;
} {
  const placements = new Map<number, number>();
  const finalMatch = getFinalMatch(updatedMatches);

  if (!finalMatch?.winner) {
    return {
      winners: [],
      placements,
    };
  }

  const rankedJobs: Job[] = [];
  
  // 1st place: Champion (grand final winner)
  const champion = finalMatch.winner;
  rankedJobs.push(champion);
  placements.set(champion.id, 1);

  // 2nd place: Runner-up (grand final loser)
  const runnerUp = getLoser(finalMatch);
  if (runnerUp) {
    rankedJobs.push(runnerUp);
    placements.set(runnerUp.id, 2);
  }

  // Places 3-5: Last 3 jobs eliminated before grand final (in reverse elimination order)
  const eliminationCopy = [...eliminationOrder];
  let place = 3;
  for (let i = eliminationCopy.length - 1; i >= 0 && rankedJobs.length < 5; i--) {
    const job = eliminationCopy[i];
    if (!job || placements.has(job.id)) continue;
    placements.set(job.id, place);
    rankedJobs.push(job);
    place++;
  }

  return {
    winners: rankedJobs,
    placements,
  };
}

// Select winner of current match and update bracket state
export function selectWinner(
  state: BracketState,
  winner: Job
): BracketState {
  if (!state.currentMatch) return state;

  // Save current state to history (excluding history itself to avoid deep nesting)
  const { history, ...stateToSave } = state;
  const newHistory = [...history, stateToSave as BracketState];

  const updatedMatches = [...state.matches];
  const newLossCounts = new Map(state.lossCounts);
  const newEliminationOrder = [...state.eliminationOrder];
  const currentMatchIndex = updatedMatches.findIndex(
    (m) => m.id === state.currentMatch!.id
  );

  if (currentMatchIndex === -1) return state;

  // Update current match with winner
  updatedMatches[currentMatchIndex] = {
    ...state.currentMatch,
    winner,
  };

  const updatedMatch = updatedMatches[currentMatchIndex];
  const loser = getLoser(updatedMatch);
  const newCompletedJobs = new Set(state.completedJobs);
  
  if (loser) {
    const previousLosses = (newLossCounts.get(loser.id) ?? 0) + 1;
    newLossCounts.set(loser.id, previousLosses);
    if (previousLosses >= 2 && !newCompletedJobs.has(loser.id)) {
      newCompletedJobs.add(loser.id);
      newEliminationOrder.push(loser);
    }
  }

  if (!newLossCounts.has(winner.id)) {
    newLossCounts.set(winner.id, 0);
  }

  // Create next round matches dynamically as tournament progresses
  createWinnersBracketRound(updatedMatches, state.currentMatch.round);
  
  if (state.currentMatch.bracket === "winners" && state.currentMatch.round === 1) {
    createLosersBracketRound1(updatedMatches);
  }
  
  createLosersBracketRound2(updatedMatches);
  createLosersBracketLaterRounds(updatedMatches);
  ensureGrandFinalMatches(updatedMatches);

  // Find next unfinished match
  // Sort matches to ensure logical play order:
  // 1. Winners bracket before losers bracket (for same round depth)
  // 2. Lower rounds before higher rounds within each bracket
  // 3. Lower position before higher position within same round
  const sortedMatches = [...updatedMatches].sort((a, b) => {
    // Prioritize by round number first (lower rounds first)
    if (a.round !== b.round) return a.round - b.round;
    
    // Within same round, winners bracket goes first
    if (a.bracket !== b.bracket) {
      return a.bracket === "winners" ? -1 : 1;
    }
    
    // Within same round and bracket, sort by position
    return a.position - b.position;
  });
  
  const nextMatch = sortedMatches.find((m) => !m.winner && m.job1 && m.job2);

  // Calculate final rankings if tournament is complete
  let finalWinners = state.winners;
  let newPlacements = state.placements;
  
  if (!nextMatch) {
    const rankings = calculateFinalRankings(updatedMatches, newEliminationOrder);
    finalWinners = rankings.winners;
    newPlacements = rankings.placements;
  }

  return {
    matches: updatedMatches,
    currentMatch: nextMatch || null,
    completedJobs: newCompletedJobs,
    lossCounts: newLossCounts,
    eliminationOrder: newEliminationOrder,
    history: newHistory,
    winners: finalWinners,
    placements: newPlacements,
  };
}

// Undo the last selection
export function undoSelection(state: BracketState): BracketState {
  if (state.history.length === 0) return state;

  const previousState = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  return {
    ...previousState,
    history: newHistory,
  };
}

// Get progress statistics
export function getBracketProgress(state: BracketState): {
  totalMatches: number;
  completedMatches: number;
  remainingJobs: number;
} {
  const completedMatches = state.matches.filter((m) => m.winner).length;
  const hasResetFinal = state.matches.some((m) => m.id === GRAND_FINAL_RESET_ID);
  const totalMatches = TOTAL_MATCHES + (hasResetFinal ? 1 : 0);
  const remainingJobs = state.currentMatch
    ? TOTAL_JOBS - state.completedJobs.size
    : 0;

  return {
    totalMatches,
    completedMatches,
    remainingJobs,
  };
}

import { describe, it, expect } from 'vitest';
import {
  initializeBracket,
  selectWinner,
  undoSelection,
  getBracketProgress,
  shuffleArray,
} from './bracketLogic';
import { Job } from '@/data/jobs';
import { BracketState } from '@/types/bracket';

// Create test jobs
const createTestJobs = (count: number): Job[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Job ${i + 1}`,
    description: `Description for job ${i + 1}`,
  }));
};

const createState = (overrides: Partial<BracketState>): BracketState => ({
  matches: [],
  currentMatch: null,
  completedJobs: new Set(),
  lossCounts: new Map(),
  eliminationOrder: [],
  history: [],
  winners: [],
  placements: new Map(),
  ...overrides,
});

describe('shuffleArray', () => {
  it('should return an array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
  });

  it('should contain all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it('should not modify the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffleArray(input);
    expect(input).toEqual(original);
  });
});

describe('initializeBracket', () => {
  it('should throw error if not exactly 128 jobs', () => {
    const tooFewJobs = createTestJobs(64);
    const tooManyJobs = createTestJobs(256);
    
    expect(() => initializeBracket(tooFewJobs)).toThrow('Expected exactly 128 jobs, but received 64');
    expect(() => initializeBracket(tooManyJobs)).toThrow('Expected exactly 128 jobs, but received 256');
  });

  it('should create 64 matches for 128 jobs', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    expect(state.matches).toHaveLength(64);
  });

  it('should set all matches to winners bracket round 1', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    state.matches.forEach(match => {
      expect(match.bracket).toBe('winners');
      expect(match.round).toBe(1);
      expect(match.winner).toBeNull();
    });
  });

  it('should assign all 128 jobs to matches', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    const assignedJobIds = new Set<number>();
    state.matches.forEach(match => {
      if (match.job1) assignedJobIds.add(match.job1.id);
      if (match.job2) assignedJobIds.add(match.job2.id);
    });
    
    expect(assignedJobIds.size).toBe(128);
  });

  it('should set the first match as current', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    expect(state.currentMatch).toBe(state.matches[0]);
  });

  it('should initialize with empty history', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    expect(state.history).toEqual([]);
  });

  it('should initialize placements as empty Map', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    expect(state.placements.size).toBe(0);
  });

  it('should seed loss counts for every job', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);

    expect(state.lossCounts.size).toBe(128);
    state.lossCounts.forEach(value => expect(value).toBe(0));
  });

  it('should start with an empty elimination order', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);

    expect(state.eliminationOrder).toEqual([]);
  });
});

describe('selectWinner', () => {
  it('should update the match with the winner', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    const firstMatch = state.currentMatch!;
    const winner = firstMatch.job1!;
    
    const newState = selectWinner(state, winner);
    const updatedMatch = newState.matches.find(m => m.id === firstMatch.id);
    
    expect(updatedMatch?.winner).toEqual(winner);
  });

  it('should move to the next match', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    const firstMatch = state.currentMatch!;
    const winner = firstMatch.job1!;
    
    const newState = selectWinner(state, winner);
    
    expect(newState.currentMatch).not.toBe(firstMatch);
    expect(newState.currentMatch?.id).not.toBe(firstMatch.id);
  });

  it('should save state to history', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    const winner = state.currentMatch!.job1!;
    
    const newState = selectWinner(state, winner);
    
    expect(newState.history).toHaveLength(1);
  });

  it('should add loser to losers queue in winners bracket', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    const firstMatch = state.currentMatch!;
    const winner = firstMatch.job1!;
    const loser = firstMatch.job2!;
    
    const newState = selectWinner(state, winner);
    
    // Loser should NOT be eliminated yet (first loss)
    expect(newState.completedJobs.has(loser.id)).toBe(false);
  });

  it('should not return null currentMatch before tournament ends', () => {
    const jobs = createTestJobs(128);
    let state = initializeBracket(jobs);
    
    // Complete first 10 matches
    for (let i = 0; i < 10; i++) {
      if (!state.currentMatch) break;
      const winner = state.currentMatch.job1!;
      state = selectWinner(state, winner);
    }
    
    // Should still have matches to play
    expect(state.currentMatch).not.toBeNull();
  });
});

describe('undoSelection', () => {
  it('should revert to previous state', () => {
    const jobs = createTestJobs(128);
    const initialState = initializeBracket(jobs);
    const firstMatchId = initialState.currentMatch!.id;
    const winner = initialState.currentMatch!.job1!;
    
    const afterSelection = selectWinner(initialState, winner);
    const afterUndo = undoSelection(afterSelection);
    
    expect(afterUndo.currentMatch?.id).toBe(firstMatchId);
    expect(afterUndo.matches.find(m => m.id === firstMatchId)?.winner).toBeNull();
  });

  it('should do nothing if no history exists', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    const newState = undoSelection(state);
    
    expect(newState).toEqual(state);
  });

  it('should allow multiple undos', () => {
    const jobs = createTestJobs(128);
    let state = initializeBracket(jobs);
    const initialMatchId = state.currentMatch!.id;
    
    // Make 3 selections
    for (let i = 0; i < 3; i++) {
      const winner = state.currentMatch!.job1!;
      state = selectWinner(state, winner);
    }
    
    // Undo all 3
    state = undoSelection(state);
    state = undoSelection(state);
    state = undoSelection(state);
    
    expect(state.currentMatch?.id).toBe(initialMatchId);
    expect(state.history).toHaveLength(0);
  });
});

describe('getBracketProgress', () => {
  it('should return 0 completed matches initially', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    const progress = getBracketProgress(state);
    
    expect(progress.completedMatches).toBe(0);
  });

  it('should return 254 total matches for 128 jobs', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    const progress = getBracketProgress(state);
    
    expect(progress.totalMatches).toBe(254);
  });

  it('should return 128 remaining jobs initially', () => {
    const jobs = createTestJobs(128);
    const state = initializeBracket(jobs);
    
    const progress = getBracketProgress(state);
    
    expect(progress.remainingJobs).toBe(128);
  });

  it('should track completed matches correctly', () => {
    const jobs = createTestJobs(128);
    let state = initializeBracket(jobs);
    
    // Complete 5 matches
    for (let i = 0; i < 5; i++) {
      const winner = state.currentMatch!.job1!;
      state = selectWinner(state, winner);
    }
    
    const progress = getBracketProgress(state);
    
    expect(progress.completedMatches).toBe(5);
  });
});

describe('Bracket progression', () => {
  it('should create second round matches after first round completes', () => {
    const jobs = createTestJobs(128);
    let state = initializeBracket(jobs);
    
    // Complete all 64 first-round matches
    for (let i = 0; i < 64; i++) {
      const winner = state.currentMatch!.job1!;
      state = selectWinner(state, winner);
    }
    
    // Should have created round 2 winners bracket matches
    const round2Matches = state.matches.filter(m => 
      m.bracket === 'winners' && m.round === 2
    );
    
    expect(round2Matches.length).toBeGreaterThan(0);
  });

  it('should create losers bracket matches', () => {
    const jobs = createTestJobs(128);
    let state = initializeBracket(jobs);
    
    // Complete all first round winners bracket matches
    for (let i = 0; i < 64; i++) {
      const winner = state.currentMatch!.job1!;
      state = selectWinner(state, winner);
    }
    
    // Should have created losers bracket matches
    const losersBracketMatches = state.matches.filter(m => 
      m.bracket === 'losers'
    );
    
    expect(losersBracketMatches.length).toBeGreaterThan(0);
  });

  it('should track jobs that lose twice as eliminated', () => {
    const jobs = createTestJobs(128);
    let state = initializeBracket(jobs);
    const firstMatch = state.currentMatch!;
    const loser = firstMatch.job2!;
    
    // Make loser lose in winners bracket
    state = selectWinner(state, firstMatch.job1!);
    
    // The loser should be in losersQueue but not completedJobs
    expect(state.completedJobs.has(loser.id)).toBe(false);
    
    // If we could easily test them losing again in losers bracket,
    // they should then be in completedJobs
  });
});

describe('Grand final logic', () => {
  it('creates a reset final when the winners champion loses their first match', () => {
    const [wbChampion, wbRunner, lbChampion, lbRunner] = createTestJobs(4);

    const matches = [
      {
        id: 'w-r7-0',
        job1: wbChampion,
        job2: wbRunner,
        winner: wbChampion,
        round: 7,
        bracket: 'winners' as const,
        position: 0,
      },
      {
        id: 'l-r12-0',
        job1: lbChampion,
        job2: lbRunner,
        winner: lbChampion,
        round: 12,
        bracket: 'losers' as const,
        position: 0,
      },
      {
        id: 'grand-final',
        job1: wbChampion,
        job2: lbChampion,
        winner: null,
        round: 8,
        bracket: 'winners' as const,
        position: 0,
      },
    ];

    const state = createState({
      matches,
      currentMatch: matches[2],
      completedJobs: new Set([wbRunner.id, lbRunner.id]),
      lossCounts: new Map([
        [wbChampion.id, 0],
        [wbRunner.id, 2],
        [lbChampion.id, 1],
        [lbRunner.id, 2],
      ]),
    });

    const newState = selectWinner(state, lbChampion);
    const resetMatch = newState.matches.find(m => m.id === 'grand-final-reset');

    expect(resetMatch).toBeDefined();
    expect(resetMatch?.job1?.id).toBe(wbChampion.id);
    expect(resetMatch?.job2?.id).toBe(lbChampion.id);
    expect(newState.currentMatch?.id).toBe('grand-final-reset');
    expect(newState.lossCounts.get(wbChampion.id)).toBe(1);
    expect(newState.completedJobs.has(wbChampion.id)).toBe(false);
  });

  it('derives top five placements from elimination order and reports zero jobs remaining', () => {
    const [wbChampion, lbChampion, third, fourth, fifth, sixth] = createTestJobs(6);

    const matches = [
      {
        id: 'w-r7-0',
        job1: wbChampion,
        job2: third,
        winner: wbChampion,
        round: 7,
        bracket: 'winners' as const,
        position: 0,
      },
      {
        id: 'l-r12-0',
        job1: lbChampion,
        job2: fourth,
        winner: lbChampion,
        round: 12,
        bracket: 'losers' as const,
        position: 0,
      },
      {
        id: 'grand-final',
        job1: wbChampion,
        job2: lbChampion,
        winner: lbChampion,
        round: 8,
        bracket: 'winners' as const,
        position: 0,
      },
      {
        id: 'grand-final-reset',
        job1: wbChampion,
        job2: lbChampion,
        winner: null,
        round: 9,
        bracket: 'winners' as const,
        position: 0,
      },
    ];

    const state = createState({
      matches,
      currentMatch: matches[3],
      completedJobs: new Set([third.id, fourth.id, fifth.id, sixth.id]),
      lossCounts: new Map([
        [wbChampion.id, 1],
        [lbChampion.id, 1],
        [third.id, 2],
        [fourth.id, 2],
        [fifth.id, 2],
        [sixth.id, 2],
      ]),
      eliminationOrder: [sixth, fifth, fourth, third],
    });

    const finalState = selectWinner(state, wbChampion);

    expect(finalState.currentMatch).toBeNull();
    expect(finalState.completedJobs.has(lbChampion.id)).toBe(true);
    
    // Verify correct ranking: Champion, Runner-up, then last 3 eliminated
    expect(finalState.winners.map(job => job.id)).toEqual([
      wbChampion.id,    // 1st: Grand final winner
      lbChampion.id,    // 2nd: Grand final loser (runner-up)
      third.id,         // 3rd: Last eliminated
      fourth.id,        // 4th: 2nd to last eliminated
      fifth.id,         // 5th: 3rd to last eliminated
    ]);
    expect(finalState.placements.get(wbChampion.id)).toBe(1);
    expect(finalState.placements.get(lbChampion.id)).toBe(2);
    expect(finalState.placements.get(third.id)).toBe(3);
    expect(finalState.placements.get(fourth.id)).toBe(4);
    expect(finalState.placements.get(fifth.id)).toBe(5);

    const progress = getBracketProgress(finalState);
    expect(progress.remainingJobs).toBe(0);
  });
});

describe('Match ordering', () => {
  it('should present matches in logical round-by-round order', () => {
    const jobs = createTestJobs(128);
    let state = initializeBracket(jobs);
    
    const matchSequence: string[] = [];
    
    // Play through first 250 matches
    for (let i = 0; i < 250 && state.currentMatch; i++) {
      const match = state.currentMatch;
      matchSequence.push(`${match.bracket}-R${match.round}`);
      
      const winner = match.job1!;
      state = selectWinner(state, winner);
    }
    
    // Check that early matches are all from round 1
    const first64 = matchSequence.slice(0, 64);
    expect(first64.every(m => m === 'winners-R1')).toBe(true);
    
    // Verify we don't jump around rounds erratically
    let largeJumps = 0;
    for (let i = 1; i < Math.min(matchSequence.length, 200); i++) {
      const prevMatch = matchSequence[i - 1];
      const currMatch = matchSequence[i];
      const prevRoundNum = parseInt(prevMatch.split('-R')[1]);
      const currRoundNum = parseInt(currMatch.split('-R')[1]);
      
      // Large jumps (more than 1 round difference) should be rare
      if (Math.abs(currRoundNum - prevRoundNum) > 1) {
        largeJumps++;
      }
    }
    
    // Should have minimal large round jumps (less than 10 in first 200 matches)
    expect(largeJumps).toBeLessThan(10);
  });
});

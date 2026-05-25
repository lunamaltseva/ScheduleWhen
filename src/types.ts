export interface Student {
  id: string;
  dept: string;
  year: string;
  international: boolean;
  // Each class period this student attends: exact overlap-checkable intervals
  periods: Array<{ day: string; startMin: number; endMin: number }>;
}

export interface Filter {
  id: string;
  depts: string[];
  years: string[];
  status: 'any' | 'domestic' | 'international';
}

export type TimePeriod = 'morning' | 'afternoon' | 'evening';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export interface Suggestion {
  rank: 'primary-mw' | 'primary-tth' | 'alt-1' | 'alt-2';
  day: string;
  pairedDay?: string;
  startTime: string;       // "HH:MM" — may be any time, not just class slot starts
  endTime: string;
  weightedScore: number;
  rawFreePercent: number;  // % of ALL eligible students who are free during the window
  onCampusCount: number;   // # on-campus students free during the window
  factors: {
    timeWeight: number;
    midEventDeparturePct: number;
    lunchAdjust: number;
    lunchPartialCount: number; // students who can attend the start but leave at 12:45
  };
}

export interface AlgorithmResult {
  suggestions: Suggestion[];
  timestamp: number;
  params: {
    duration: number;
    selectedDays: boolean[];
    timePeriods: TimePeriod[];
    targetParticipants: number;
    filterCount: number;
  };
  targetMet: boolean;
  prefOverridden: boolean;
  overrideReason?: string;
  eligibleCount: number;  // total students matching all filters combined
}

export type MobileView = 'sidebar' | 'calendar' | 'chat';

export type ModalState =
  | null
  | { type: 'add' }
  | { type: 'edit'; filterId: string };

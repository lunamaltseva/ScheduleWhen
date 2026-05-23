import type { ClassSlot } from './constants';

export interface Student {
  id: string;
  dept: string;
  year: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Masters 1st Year' | 'Masters 2nd Year';
  international: boolean;
  occupied: Set<string>; // "Mon-9:25" format
}

export interface Filter {
  id: string;
  depts: string[];
  years: string[];
  status: 'any' | 'domestic' | 'international';
}

// Individual time periods — multiple can be selected; empty = any time
export type TimePeriod = 'morning' | 'afternoon' | 'evening';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export interface Recommendation {
  day: string;
  slot: ClassSlot;
  endTime: string;
  freePercent: number;
  eligibleCount: number;
}

export type MobileView = 'sidebar' | 'calendar' | 'chat';

export type ModalState =
  | null
  | { type: 'add' }
  | { type: 'edit'; filterId: string };

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Filter, TimePeriod, ChatMessage, MobileView, ModalState, AlgorithmResult, Student } from '../types';
import type { AcademicEvent } from '../data/parseCalendar';
import { SEMESTER_START, SEMESTER_END } from '../constants';

// ── State ──────────────────────────────────────────────────────────────────────

export interface AppState {
  duration: number;
  selectedDays: boolean[];
  timePeriods: TimePeriod[];
  timeframeFrom: string;
  targetParticipants: number;
  filters: Filter[];
  weekOffset: number;
  fixedStartMin: number | null;      // when set, algorithm pins this exact start and chooses the best day(s)
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  mobileView: MobileView;
  activeModal: ModalState;
  deletingFilterId: string | null;
  // Algorithm
  isDirty: boolean;                  // true = Generate button should be shown
  algorithmResult: AlgorithmResult | null;
  autoRegen: boolean;                // re-run algorithm automatically on param changes
  pendingPrompt: string | null;      // prompt queued for the AI chatbot (e.g. from "Explain why")
  // Student data — empty until Excel loads
  students: Student[];
  dataState: 'loading' | 'loaded' | 'error';
  // Academic calendar events — empty until ICS loads
  academicEvents: AcademicEvent[];
  // Non-blocking banner shown when a Generate run finds no valid days
  noTimeslotBanner: string | null;
}

// ── Actions ────────────────────────────────────────────────────────────────────

// `fromAI` tags parameter changes that originated from the chatbot's tool use,
// so the chat window is NOT auto-collapsed when the bot itself edits params.
type Action =
  | { type: 'SET_DURATION'; value: number; fromAI?: boolean }
  | { type: 'TOGGLE_DAY'; index: number; fromAI?: boolean }
  | { type: 'SET_SELECTED_DAYS'; days: boolean[]; fromAI?: boolean }
  | { type: 'TOGGLE_TIME_PERIOD'; value: TimePeriod; fromAI?: boolean }
  | { type: 'SET_TIME_PERIODS_LIST'; periods: TimePeriod[]; fromAI?: boolean }
  | { type: 'SET_TIMEFRAME'; value: string; fromAI?: boolean }
  | { type: 'SET_TARGET'; value: number; fromAI?: boolean }
  | { type: 'SET_FIXED_TIME'; value: number | null; fromAI?: boolean }
  | { type: 'ADD_FILTER'; filter: Filter; fromAI?: boolean }
  | { type: 'UPDATE_FILTER'; filter: Filter; fromAI?: boolean }
  | { type: 'DELETE_FILTER'; id: string; fromAI?: boolean }
  | { type: 'SET_WEEK_OFFSET'; value: number }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'OPEN_CHAT' }
  | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'SET_MOBILE_VIEW'; view: MobileView }
  | { type: 'SET_MODAL'; modal: ModalState }
  | { type: 'SET_DELETING_FILTER'; id: string | null }
  | { type: 'SET_ALGORITHM_RESULT'; result: AlgorithmResult }
  | { type: 'SET_PENDING_PROMPT'; prompt: string }
  | { type: 'CLEAR_PENDING_PROMPT' }
  | { type: 'SET_STUDENTS'; students: Student[] }
  | { type: 'SET_DATA_ERROR' }
  | { type: 'SET_ACADEMIC_EVENTS'; events: AcademicEvent[] }
  | { type: 'SET_NO_TIMESLOT_BANNER'; message: string | null };

// Parameter-changing actions that invalidate the current algorithm result.
// SET_WEEK_OFFSET is included because blocked days are date-specific —
// a different week can have different holidays or semester boundaries.
const DIRTY_ACTIONS = new Set([
  'SET_DURATION', 'TOGGLE_DAY', 'SET_SELECTED_DAYS',
  'TOGGLE_TIME_PERIOD', 'SET_TIME_PERIODS_LIST', 'SET_TIMEFRAME',
  'SET_TARGET', 'SET_FIXED_TIME', 'ADD_FILTER', 'UPDATE_FILTER', 'DELETE_FILTER',
  'SET_WEEK_OFFSET',
]);

// User-driven parameter edits that should collapse the chat window.
// Excludes SET_WEEK_OFFSET (mere navigation) and anything tagged fromAI.
const COLLAPSE_ON_ACTIONS = new Set([
  'SET_DURATION', 'TOGGLE_DAY', 'SET_SELECTED_DAYS',
  'TOGGLE_TIME_PERIOD', 'SET_TIME_PERIODS_LIST', 'SET_TIMEFRAME',
  'SET_TARGET', 'SET_FIXED_TIME', 'ADD_FILTER', 'UPDATE_FILTER', 'DELETE_FILTER',
]);

// ── Initial state ──────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeInitialWeekOffset(): number {
  const now = new Date();
  const dow = now.getDay();
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  currentMonday.setHours(0, 0, 0, 0);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const semesterStart = Math.round((SEMESTER_START.getTime() - currentMonday.getTime()) / msPerWeek);
  const semesterEnd   = Math.round((SEMESTER_END.getTime()   - currentMonday.getTime()) / msPerWeek);
  return Math.min(Math.max(0, semesterStart), semesterEnd);
}

const initialState: AppState = {
  duration: 60,
  selectedDays: [true, true, true, true, false, false],
  timePeriods: ['afternoon'],
  timeframeFrom: today(),
  targetParticipants: 20,
  filters: [],
  weekOffset: computeInitialWeekOffset(),
  fixedStartMin: null,
  chatOpen: false,
  chatMessages: [],
  mobileView: 'sidebar',
  activeModal: null,
  deletingFilterId: null,
  isDirty: true,
  algorithmResult: null,
  autoRegen: true,
  pendingPrompt: null,
  students: [],
  dataState: 'loading',
  academicEvents: [],
  noTimeslotBanner: null,
};

// ── Reducer ────────────────────────────────────────────────────────────────────

function innerReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DURATION':
      return { ...state, duration: Math.min(840, Math.max(1, action.value)) };

    case 'TOGGLE_DAY': {
      const days = [...state.selectedDays];
      days[action.index] = !days[action.index];
      return { ...state, selectedDays: days };
    }

    case 'SET_SELECTED_DAYS':
      return { ...state, selectedDays: action.days };

    case 'TOGGLE_TIME_PERIOD': {
      const active = state.timePeriods.includes(action.value)
        ? state.timePeriods.filter(p => p !== action.value)
        : [...state.timePeriods, action.value];
      return { ...state, timePeriods: active };
    }

    case 'SET_TIME_PERIODS_LIST':
      return { ...state, timePeriods: action.periods };

    case 'SET_TIMEFRAME':
      return { ...state, timeframeFrom: action.value };

    case 'SET_TARGET':
      return { ...state, targetParticipants: Math.min(5000, Math.max(1, action.value)) };

    case 'ADD_FILTER':
      return { ...state, filters: [...state.filters, action.filter] };

    case 'UPDATE_FILTER':
      return {
        ...state,
        filters: state.filters.map(f => f.id === action.filter.id ? action.filter : f),
      };

    case 'DELETE_FILTER':
      return {
        ...state,
        filters: state.filters.filter(f => f.id !== action.id),
        deletingFilterId: null,
      };

    case 'SET_WEEK_OFFSET':
      return { ...state, weekOffset: action.value, noTimeslotBanner: null };

    case 'SET_FIXED_TIME':
      return { ...state, fixedStartMin: action.value };

    case 'TOGGLE_CHAT':
      return { ...state, chatOpen: !state.chatOpen };

    case 'OPEN_CHAT':
      return { ...state, chatOpen: true };

    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.message] };

    case 'SET_MOBILE_VIEW':
      return { ...state, mobileView: action.view };

    case 'SET_MODAL':
      return { ...state, activeModal: action.modal };

    case 'SET_DELETING_FILTER':
      return { ...state, deletingFilterId: action.id };

    case 'SET_ALGORITHM_RESULT':
      return {
        ...state,
        algorithmResult: action.result,
        isDirty: false,
        noTimeslotBanner: null,
      };

    case 'SET_PENDING_PROMPT':
      return { ...state, pendingPrompt: action.prompt };

    case 'CLEAR_PENDING_PROMPT':
      return { ...state, pendingPrompt: null };

    case 'SET_STUDENTS':
      return { ...state, students: action.students, dataState: 'loaded' };

    case 'SET_DATA_ERROR':
      return { ...state, dataState: 'error' };

    case 'SET_ACADEMIC_EVENTS':
      return { ...state, academicEvents: action.events };

    case 'SET_NO_TIMESLOT_BANNER':
      return { ...state, noTimeslotBanner: action.message };
  }
}

function reducer(state: AppState, action: Action): AppState {
  let next = innerReducer(state, action);

  // Any parameter-changing action marks the existing result as stale
  if (DIRTY_ACTIONS.has(action.type)) {
    next = { ...next, isDirty: true };
  }

  // Collapse the chat when the USER edits a parameter (not the AI, not week nav)
  const fromAI = 'fromAI' in action && action.fromAI;
  if (COLLAPSE_ON_ACTIONS.has(action.type) && !fromAI && next.chatOpen) {
    next = { ...next, chatOpen: false };
  }

  return next;
}

// ── Context ────────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

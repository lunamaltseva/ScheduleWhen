import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Filter, TimePeriod, ChatMessage, MobileView, ModalState } from '../types';
import { SEMESTER_START, SEMESTER_END } from '../constants';

interface AppState {
  duration: number;
  selectedDays: boolean[];
  timePeriods: TimePeriod[];   // empty = any time
  timeframeFrom: string;
  targetParticipants: number;
  filters: Filter[];
  weekOffset: number;
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  mobileView: MobileView;
  activeModal: ModalState;
  deletingFilterId: string | null;
}

type Action =
  | { type: 'SET_DURATION'; value: number }
  | { type: 'TOGGLE_DAY'; index: number }
  | { type: 'TOGGLE_TIME_PERIOD'; value: TimePeriod }
  | { type: 'SET_TIMEFRAME'; value: string }
  | { type: 'SET_TARGET'; value: number }
  | { type: 'ADD_FILTER'; filter: Filter }
  | { type: 'UPDATE_FILTER'; filter: Filter }
  | { type: 'DELETE_FILTER'; id: string }
  | { type: 'SET_WEEK_OFFSET'; value: number }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'OPEN_CHAT' }
  | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'SET_MOBILE_VIEW'; view: MobileView }
  | { type: 'SET_MODAL'; modal: ModalState }
  | { type: 'SET_DELETING_FILTER'; id: string | null };

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
  const semesterEnd = Math.round((SEMESTER_END.getTime() - currentMonday.getTime()) / msPerWeek);
  return Math.min(Math.max(0, semesterStart), semesterEnd);
}

const initialState: AppState = {
  duration: 60,
  selectedDays: [true, true, true, true, false, false],
  timePeriods: ['afternoon'],
  timeframeFrom: today(),
  targetParticipants: 20,
  filters: [{ id: 'default', depts: [], years: [], status: 'any' }],
  weekOffset: computeInitialWeekOffset(),
  chatOpen: false,
  chatMessages: [],
  mobileView: 'sidebar',
  activeModal: null,
  deletingFilterId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DURATION':
      return { ...state, duration: action.value };
    case 'TOGGLE_DAY': {
      const days = [...state.selectedDays];
      days[action.index] = !days[action.index];
      return { ...state, selectedDays: days };
    }
    case 'TOGGLE_TIME_PERIOD': {
      const active = state.timePeriods.includes(action.value)
        ? state.timePeriods.filter(p => p !== action.value)
        : [...state.timePeriods, action.value];
      return { ...state, timePeriods: active };
    }
    case 'SET_TIMEFRAME':
      return { ...state, timeframeFrom: action.value };
    case 'SET_TARGET':
      return { ...state, targetParticipants: action.value };
    case 'ADD_FILTER': {
      // Replace the default catch-all filter on first custom addition
      const isDefaultOnly = state.filters.length === 1 && state.filters[0].id === 'default';
      return { ...state, filters: isDefaultOnly ? [action.filter] : [...state.filters, action.filter] };
    }
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
      return { ...state, weekOffset: action.value };
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
  }
}

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

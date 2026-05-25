export const CLASS_SLOTS = [
  '8:00', '9:25', '10:50', '12:45', '14:10', '15:35', '17:00', '18:25', '19:50',
] as const;
export type ClassSlot = (typeof CLASS_SLOTS)[number];

// Structured grid row definitions — drives heatmap layout
export type GridRowKind = 'class' | 'break' | 'lunch' | 'gap';

export interface GridRowDef {
  kind: GridRowKind;
  fr: number;       // proportional height in CSS grid fr units
  label?: string;   // time label shown on y-axis
  slot?: string;    // for 'class' rows: which CLASS_SLOT this is
}

// 9×75 + 7×10 + 40 + 55 = 840 min (8:00–22:00)
export const GRID_ROWS: readonly GridRowDef[] = [
  { kind: 'class', fr: 75, label: '8:00',  slot: '8:00'  },
  { kind: 'break', fr: 10                                  },
  { kind: 'class', fr: 75, label: '9:25',  slot: '9:25'  },
  { kind: 'break', fr: 10                                  },
  { kind: 'class', fr: 75, label: '10:50', slot: '10:50' },
  { kind: 'lunch', fr: 40, label: '12:05'                 },
  { kind: 'class', fr: 75, label: '12:45', slot: '12:45' },
  { kind: 'break', fr: 10                                  },
  { kind: 'class', fr: 75, label: '14:10', slot: '14:10' },
  { kind: 'break', fr: 10                                  },
  { kind: 'class', fr: 75, label: '15:35', slot: '15:35' },
  { kind: 'break', fr: 10                                  },
  { kind: 'class', fr: 75, label: '17:00', slot: '17:00' },
  { kind: 'break', fr: 10                                  },
  { kind: 'class', fr: 75, label: '18:25', slot: '18:25' },
  { kind: 'break', fr: 10                                  },
  { kind: 'class', fr: 75, label: '19:50', slot: '19:50' },
  { kind: 'gap',   fr: 55, label: '21:05'                  },  // 21:05–22:00
];

export const TERMINAL_LABEL = '22:00';

export const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S'] as const;
export const DAYS_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const PRIORITY_RANGES: Record<string, readonly number[]> = {
  morning:   [0, 1, 2],
  afternoon: [3, 4, 5],
  evening:   [6, 7, 8],
};

export const UG_DEPTS = [
  'AMI', 'ANTH', 'BA', 'ECO', 'ESCS', 'IBL', 'ICP', 'JMC',
  'LAS', 'LAS-DC', 'LAS-ES', 'LAS-HR', 'LAS-MC', 'LAS-MM', 'LAS-PC', 'LAS-SEDT', 'LAS-UPD',
  'PSY', 'SFW', 'SOC', 'TCMA',
] as const;

export const PG_DEPTS = [
  'LLM', 'MAANTH', 'MACAS', 'MAPAP', 'MAT', 'MBA', 'MSECO',
] as const;

export const ALL_DEPTS = [...UG_DEPTS, ...PG_DEPTS] as const;

export const UG_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'] as const;
export const PG_YEARS = ['Masters 1st Year', 'Masters 2nd Year'] as const;
export const ALL_YEARS = [...UG_YEARS, ...PG_YEARS] as const;

export const SLOT_END_TIMES: Record<string, string> = {
  '8:00':  '9:15',
  '9:25':  '10:40',
  '10:50': '12:05',
  '12:45': '14:00',
  '14:10': '15:25',
  '15:35': '16:50',
  '17:00': '18:15',
  '18:25': '19:40',
  '19:50': '21:05',
};

// Semester date bounds (Fall 2026). Classes run Sept 15 – Dec 31 inclusive.
// SEMESTER_START / SEMESTER_END use local-midnight Date objects for week-offset
// navigation clamping. For date comparisons use the ISO string constants below.
export const SEMESTER_START = new Date(2026, 8, 15); // Sept 15 (first day of classes)
export const SEMESTER_END   = new Date(2026, 11, 31); // Dec 31 (last day of classes)
export const SEMESTER_START_ISO = '2026-09-15';
export const SEMESTER_END_ISO   = '2026-12-31';

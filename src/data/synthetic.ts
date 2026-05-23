import { CLASS_SLOTS, DAYS_FULL } from '../constants';
import type { Student } from '../types';

// LCG PRNG — seeded for deterministic output
function makeLCG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

const rng = makeLCG(42);

function randInt(min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function slotToMin(slot: string): number {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
}

// Department → approximate UG headcount (sums to 1028)
const UG_DEPTS: Array<{ dept: string; count: number }> = [
  { dept: 'BA',       count: 100 },
  { dept: 'ECO',      count: 85  },
  { dept: 'AMI',      count: 70  },
  { dept: 'SFW',      count: 70  },
  { dept: 'ICP',      count: 65  },
  { dept: 'JMC',      count: 65  },
  { dept: 'IBL',      count: 60  },
  { dept: 'PSY',      count: 60  },
  { dept: 'SOC',      count: 50  },
  { dept: 'ANTH',     count: 45  },
  { dept: 'ESCS',     count: 40  },
  { dept: 'TCMA',     count: 35  },
  { dept: 'LAS-DC',   count: 24  },
  { dept: 'LAS-ES',   count: 23  },
  { dept: 'LAS-HR',   count: 23  },
  { dept: 'LAS-MC',   count: 23  },
  { dept: 'LAS-MM',   count: 23  },
  { dept: 'LAS-PC',   count: 23  },
  { dept: 'LAS-SEDT', count: 22  },
  { dept: 'LAS-UPD',  count: 22  },
];

const PG_DEPTS: Array<{ dept: string; count: number }> = [
  { dept: 'LLM',    count: 30 },
  { dept: 'MAANTH', count: 20 },
  { dept: 'MACAS',  count: 25 },
  { dept: 'MAPAP',  count: 20 },
  { dept: 'MAT',    count: 25 },
  { dept: 'MBA',    count: 45 },
  { dept: 'MSECO',  count: 29 },
];

const UG_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'] as const;
const PG_YEARS = ['Masters 1st Year', 'Masters 2nd Year'] as const;

function makePeriods(): Array<{ day: string; startMin: number; endMin: number }> {
  const periods: Array<{ day: string; startMin: number; endMin: number }> = [];
  const numSlots = randInt(4, 8);
  const usedDays = new Set<number>();

  for (let attempt = 0; attempt < 30 && periods.length < numSlots; attempt++) {
    const dayIdx = Math.floor(rng() * DAYS_FULL.length);
    if (usedDays.has(dayIdx)) continue;
    const slot = pick(CLASS_SLOTS);
    const startMin = slotToMin(slot);
    periods.push({ day: DAYS_FULL[dayIdx], startMin, endMin: startMin + 75 });
    usedDays.add(dayIdx);
  }
  return periods;
}

export function generateStudents(): Student[] {
  const students: Student[] = [];
  let idCounter = 1;

  const totalStudents = UG_DEPTS.reduce((a, d) => a + d.count, 0)
    + PG_DEPTS.reduce((a, d) => a + d.count, 0);
  const intlPool: boolean[] = Array(450).fill(true).concat(Array(totalStudents - 450).fill(false));
  for (let i = intlPool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [intlPool[i], intlPool[j]] = [intlPool[j], intlPool[i]];
  }
  let intlIdx = 0;

  for (const { dept, count } of UG_DEPTS) {
    const perYear = Math.ceil(count / UG_YEARS.length);
    for (const year of UG_YEARS) {
      const n = Math.min(perYear, count - (UG_YEARS.indexOf(year) * perYear));
      for (let i = 0; i < Math.max(0, n); i++) {
        students.push({
          id: `S${String(idCounter++).padStart(5, '0')}`,
          dept,
          year,
          international: intlPool[intlIdx++ % intlPool.length],
          periods: makePeriods(),
        });
      }
    }
  }

  for (const { dept, count } of PG_DEPTS) {
    const perYear = Math.ceil(count / PG_YEARS.length);
    for (const year of PG_YEARS) {
      const n = Math.min(perYear, count - (PG_YEARS.indexOf(year) * perYear));
      for (let i = 0; i < Math.max(0, n); i++) {
        students.push({
          id: `S${String(idCounter++).padStart(5, '0')}`,
          dept,
          year,
          international: intlPool[intlIdx++ % intlPool.length],
          periods: makePeriods(),
        });
      }
    }
  }

  return students;
}

export const STUDENTS: Student[] = generateStudents();

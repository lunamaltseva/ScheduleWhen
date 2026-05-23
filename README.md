# ScheduleWhen

A scheduling tool for AUCA (American University of Central Asia) that recommends the best time to hold an event based on student schedule conflicts. Built as a client-side React SPA — no backend required.

Live URL: `https://lunamaltseva.github.io/ScheduleWhen/`

---

## How it works

Configure an event in the sidebar (duration, days, time preference, target headcount, audience filters), then press **Generate**. The algorithm scans every viable start time across the selected days and scores each window by how many filtered students are free and on campus. The top 4 results appear as chips on the heatmap and as cards in the sidebar. A collapsible AI chatbot (fixed bottom-right on desktop, full-screen on mobile) answers natural-language questions about the output.

The calendar heatmap updates in real time as you change filters or days. White = everyone free, dark blue = fully busy. Chips are hidden until Generate is pressed; they reappear after each run and fade when parameters change (stale indicator).

---

## Project structure

```
ScheduleWhen/
├── scripts/
│   ├── generate_students.py   Generates the Excel dataset
│   ├── course_data.py         Shared course catalog (FYS, GenEd, languages)
│   └── dept_data.py           Per-department catalogs, required courses, electives
├── public/
│   └── Fall_2026_Students.xlsx   Real Fall 2026 schedule data (loaded on startup)
├── src/
│   ├── main.tsx               React entry point
│   ├── App.tsx                Root layout — responsive desktop/mobile switch + ExcelLoader
│   ├── constants.ts           Time slots, grid row definitions, semester bounds
│   ├── types.ts               Shared TypeScript types
│   ├── context/
│   │   └── AppContext.tsx     Global state (useReducer) + useApp() hook
│   ├── algorithm/
│   │   └── score.ts           Sliding-window scorer, lunch bonuses, explanation builder
│   ├── data/
│   │   ├── synthetic.ts       LCG-seeded fallback — 1,222 deterministic students
│   │   └── loader.ts          SheetJS parser — loads real data from Excel on mount
│   ├── hooks/
│   │   └── useResults.ts      Computes per-slot heatmap values (useMemo)
│   └── components/
│       ├── Icons.tsx           Inline SVG icons (star, chevrons, chatbot, time-of-day)
│       ├── Sidebar/
│       │   ├── index.tsx           Sidebar shell + scroll container
│       │   ├── SidebarHeader.tsx   Brand header (matches calendar header height)
│       │   ├── EventSpec.tsx       Duration, days, priority, from-date, target inputs
│       │   ├── FiltersSection.tsx  Audience filter table with inline delete confirm
│       │   ├── FilterModal.tsx     Add/edit filter — department, year, status dropdowns
│       │   ├── GenerateButton.tsx  Runs algorithm or opens chatbot explanation
│       │   └── ResultsSection.tsx  Preferred/alternative chips + room suggestions
│       ├── Calendar/
│       │   ├── index.tsx           Calendar shell
│       │   ├── CalendarHeader.tsx  Week navigation (Today, ‹ ›, week label)
│       │   └── HeatmapGrid.tsx     CSS-grid heatmap + percentage-positioned chips
│       └── Chat/
│           └── index.tsx           Collapsible chatbot (desktop fixed, mobile fullscreen)
├── .github/workflows/
│   └── deploy.yml             GitHub Pages deployment via GitHub Actions
├── index.html
├── tailwind.config.js         Brand colors, Open Sans, keyframe animations
├── vite.config.ts
└── tsconfig.json
```

---

## Data loading

On mount, `ExcelLoader` (in `App.tsx`) fetches `Fall_2026_Students.xlsx` from the public directory and parses it with SheetJS. Each row's course columns are parsed into `periods: Array<{ day, startMin, endMin }>` intervals. If the fetch fails, the app falls back to the LCG-seeded synthetic dataset so the UI is always functional.

---

## Sidebar

### Event parameters (`EventSpec.tsx`)

| Field | Default | Notes |
|---|---|---|
| Duration | 60 min | Controls chip height on heatmap proportionally |
| Consider Days | Mon–Thu | Toggle buttons; drives heatmap columns |
| Priority | (any) | Multi-select morning / afternoon / evening |
| From | today | DD/MM/YY; bounded to Fall 2026 semester |
| Target | 20 participants | Drives room suggestions and feasibility check |

All number inputs allow temporary empty values during editing and clamp on blur.

### Audience filters (`FiltersSection.tsx` + `FilterModal.tsx`)

Each filter scopes the student pool by department(s), year(s), and domestic/international status. Multiple filters are stacked; availability is scored across the union of matched students. Filters are edited in a modal with floating multi-select dropdowns (rendered via `createPortal` to escape overflow clipping).

### Results (`ResultsSection.tsx`)

Top 4 recommended slots shown as chips (2 preferred MW/TTh pairs, 2 alternatives). Each chip shows: day(s), time range, availability %, and on-campus student count. The best-scoring chip across all four receives a gold SVG star and a gold outline ring.

If the target headcount cannot be reached within the chosen time preference, the algorithm retries without the preference restriction and flags the override with a banner. If the target is unreachable even then, a red notice explains why.

### Room suggestions

Rooms are recommended based on target size and any departments explicitly named in filters:

| Target | Category | Rooms |
|---|---|---|
| 60+ | Large Rooms | 410, 434, 440, Forum |
| 30–59 | Medium Rooms | G34, 220, 435 |
| 10–29 | Small Rooms | G35, G33, G32, 203, 305, 405 |
| < 10 | Very Small Rooms | 211, 212, 213, 340, 411 |

Computer labs are added as a second group when filters target relevant departments:

| Departments | Labs |
|---|---|
| SFW, AMI | G30, G31, 432, 433 |
| JMC, TCMA | C07 |
| AMI | 223, 233 (Graphic Design) |

Labs are not suggested when filters use "all departments" (audience too broad to assume computer access is needed).

---

## Calendar heatmap (`HeatmapGrid.tsx`)

- **Grid**: CSS grid with `fr` rows proportional to minutes (1 fr = 1 minute; 840 fr total for 8:00–22:00).
- **Gradient**: min–max normalized across active slots. The cell with the fewest free students maps to dark blue (`#2d457c`); the most free maps to white (`#ffffff`). Local contrast is maximized per-run.
- **Chips**: positioned with percentage-based `top` / `height` so their extent matches the event duration on the time axis. A `ResizeObserver` on each chip switches between a compact 2-row layout and a full layout based on chip **width** (narrow → wide at 130 px; wide → narrow at 110 px, with a dead zone to prevent flicker). The best chip gets a gold star icon and gold CSS outline.
- **Week navigation**: `key`-based remount triggers a slide-left / slide-right CSS animation when switching weeks.
- **Stale state**: chips are hidden whenever parameters have changed since the last Generate run (`isDirty`).

---

## Algorithm (`src/algorithm/score.ts`)

### Candidate start times

Every class boundary (start **and** end of each standard 75-minute slot) is tested as a potential event start, plus a set of non-standard evening breakpoints. This ensures the 12:05 lunch gap is always a candidate regardless of event duration.

```
Breakpoints: 8:00, 9:25, 10:50, 12:05, 12:45, 14:10, 15:35, 17:00, 17:30,
             18:00, 18:25, 18:30, 19:00, 19:30, 19:50
```

### On-campus filter

A student is considered *on campus* for a given day only if they have at least one class period that day. Students with no classes are excluded from both the heatmap denominator and scoring — they are unlikely to be on campus.

### Scoring

For each `(day, startMin)` window, a `WindowScore` is computed:

```
rawFreePercent = effectiveFree / totalEligible × 100
score = rawFreePercent × timeWeight × lunchAdjust × mixAdjust
```

- **totalEligible**: all students matching the current filters (not just those on campus that day), so the percentage reflects share of the target audience.
- **effectiveFree**: on-campus students with no overlapping period + 0.5 × students who have only a 12:45 class (they can attend the start of a lunch-overrun event).
- **timeWeight**: peaks at 1.0 in early afternoon, tapers toward mornings and late evenings.
- **lunchAdjust**: 12:05-start events get a 1.40× bonus (fits the gap), 1.20× if the event is longer but ≤ 40 min, or 1.10× if it overruns 12:45 (partial attendance still makes it worthwhile).
- **mixAdjust**: penalizes early-morning slots for UG-heavy audiences (−35% before 9:25) and PG-heavy audiences (−20%), and late-evening slots for UG-heavy audiences.

### Output

`buildSuggestions` picks the best MW pair, the best TTh pair, and two non-overlapping alternatives. A lunch-window suggestion is always guaranteed if the 12:05 slot scores ≥ 20% free and nothing has already occupied it.

If the target headcount isn't met within the chosen time period, the algorithm re-runs without the period restriction. The better result is used and `prefOverridden` is set.

---

## Synthetic data (`src/data/synthetic.ts`)

A seeded LCG (seed 42) generates 1,222 deterministic students as a fallback:

| Program | Students |
|---|---|
| Undergraduate (4 years × ~257 students) | 1,028 |
| Masters (2 years × ~97 students) | 194 |

Each student gets 4–8 conflict-free `periods` (day + startMin + endMin intervals) drawn from the 9 standard class slots across Mon–Sat. International flag: 450 international, 772 domestic.

Department distribution matches official Fall 2026 enrollment: BA, ECO, AMI, SFW, ICP, JMC, PSY, SOC, ANTH, ESCS, TCMA, IBL, LAS (8 concentrations), LLM, MAANTH, MACAS, MAPAP, MAT, MBA, MSECO.

---

## Time constants (`src/constants.ts`)

Nine class start times, each 75 minutes long, with a 40-minute lunch gap after 10:50:

`8:00 · 9:25 · 10:50 · [12:05 lunch gap] · 12:45 · 14:10 · 15:35 · 17:00 · 18:25 · 19:50`

The CSS grid uses proportional `fr` rows: class rows = 75 fr, break rows = 10 fr, lunch = 40 fr.

---

## Excel dataset (`public/Fall_2026_Students.xlsx`)

Generated by the Python scripts from official Fall 2026 schedule data. Loaded by the SPA on startup; the synthetic dataset is the fallback if loading fails.

### Sheet 1 — "Fall 2026 Students"

| Column | Description |
|---|---|
| Student ID | `S00001`–`S01222` |
| Department | Program code |
| Concentration | LAS sub-concentration; blank for all others |
| Year | `Freshman` / `Sophomore` / `Junior` / `Senior` / `Masters 1st Year` / `Masters 2nd Year` |
| International | `Yes` or `No` |
| Total Credits | 24–33 UG; 18–33 PG |
| Course 1 … Course N | `CODE (sec N): Full Name — Day[/Day] HH:MM — Xcr` |

### Sheet 2 — "Summary"

Enrollment and international count by department and concentration.

### Enrollment rules

- Credit caps: Freshmen ≤ 30 cr; Soph/Jr/Sr ≤ 33 cr
- 62% at cap, 24% at cap − 3, 14% lighter; minimum 24 cr
- Freshman writing cluster: FYS-100 + ENG-122 + FYS-100.3 across 14 coordinated sections
- Sophomore languages: Kyrgyz (KLL) + Russian (RUS/RFL); international variants differ
- No time conflicts — every student schedule is conflict-checked
- Sports requirement: 4 sport classes over 4 years (0 cr each); modeled per semester

---

## Python scripts

Run from the project root:

```bash
python3 -m scripts.generate_students
```

Requires **Python 3.12+** and **openpyxl** (`pip install openpyxl`).

| Script | Purpose |
|---|---|
| `course_data.py` | Shared catalog: GenEd, sports, language courses, FYS bundles |
| `dept_data.py` | Per-department required + elective course lists |
| `generate_students.py` | Builds roster, assigns schedules, writes xlsx |

---

## Local development

```bash
npm install
npm run dev        # http://localhost:5173/ScheduleWhen/
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

---

## Deploy to GitHub Pages

Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

Enable once in repository settings: **Settings → Pages → Source → GitHub Actions**

---

## Tech stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI and state |
| Vite 5 | Dev server and bundler |
| Tailwind CSS 3 | Styling — brand tokens, animations, responsive layout |
| SheetJS (xlsx) | Client-side Excel parsing |
| Python 3 + openpyxl | Reference dataset generation |
| GitHub Actions | CI/CD to GitHub Pages |

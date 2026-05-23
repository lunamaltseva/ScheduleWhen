# ScheduleWhen

A scheduling tool for AUCA (American University of Central Asia) that recommends the best time to hold an event based on student schedule conflicts. Built as a client-side React SPA — no backend required. All 1,222 synthetic Fall 2026 students are generated in the browser at startup.

Live URL: `https://lunamaltseva.github.io/ScheduleWhen/`

---

## How it works

The sidebar lets you configure an event (duration, days to consider, time priority, target headcount, and audience filters). The calendar heatmap updates in real time, coloring each time slot by availability: dark blue = busy, white = free. The top recommendations are highlighted directly on the heatmap and listed as chips in the sidebar. An AI assistant chatbot (fixed bottom-right) answers natural-language questions about the results.

---

## Project structure

```
ScheduleWhen/
├── scripts/
│   ├── generate_students.py   Generates the Excel dataset
│   ├── course_data.py         Shared course catalog (FYS, GenEd, languages)
│   └── dept_data.py           Per-department catalogs, required courses, electives
├── public/
│   └── Fall_2026_Students.xlsx   Reference dataset (reserved for backend use)
├── src/
│   ├── main.tsx               React entry point
│   ├── App.tsx                Root layout — responsive desktop/mobile switch
│   ├── constants.ts           Time slots, grid row definitions, semester bounds
│   ├── types.ts               Shared TypeScript types
│   ├── context/
│   │   └── AppContext.tsx     Global state (useReducer) + useApp() hook
│   ├── data/
│   │   └── synthetic.ts       LCG-seeded generator — 1,222 deterministic students
│   ├── hooks/
│   │   └── useResults.ts      Computes heatmap + top-4 recommendations (useMemo)
│   └── components/
│       ├── Icons.tsx           Inline SVG icons
│       ├── Sidebar/
│       │   ├── index.tsx           Sidebar shell + scroll container
│       │   ├── SidebarHeader.tsx   Brand header (72 px, matches calendar header)
│       │   ├── EventSpec.tsx       Duration, days, priority, from-date, target inputs
│       │   ├── FiltersSection.tsx  Audience filter table with inline delete confirm
│       │   ├── FilterModal.tsx     Add/edit filter — department, year, status dropdowns
│       │   └── ResultsSection.tsx  Preferred/alternative chips + room category
│       ├── Calendar/
│       │   ├── index.tsx           Calendar shell
│       │   ├── CalendarHeader.tsx  Week navigation (Today, ‹ ›, month label)
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

## Sidebar

### Event parameters (`EventSpec.tsx`)

| Field | Default | Notes |
|---|---|---|
| Duration | 60 min | Controls chip height on heatmap proportionally |
| Consider Days | Mon–Thu | Toggle buttons; drives heatmap columns |
| Priority | (any) | Multi-select morning / afternoon / evening |
| From | today | DD/MM/YY; filters to semester window |
| Target | 20 participants | Drives room category recommendation |

All number inputs allow temporary empty values during editing and clamp on blur.

### Audience filters (`FiltersSection.tsx` + `FilterModal.tsx`)

Each filter scopes the student pool by department(s), year(s), and domestic/international status. Multiple filters can be stacked; availability is averaged across them. Filters are edited in a modal with floating multi-select dropdowns (rendered via `createPortal` to escape overflow clipping).

### Results (`ResultsSection.tsx`)

Top 4 recommended slots (2 preferred, 2 alternatives) shown as chips with day, time range, availability %, and eligible student count. Room category is derived from the target headcount.

---

## Calendar heatmap (`HeatmapGrid.tsx`)

- **Grid**: CSS grid with `fr` rows proportional to minutes. Each fr unit = 1 minute; total = 840 fr (8:00–22:00).
- **Colors**: white (≥75% free) → light blue → mid blue → brand blue (busy).
- **Chips**: positioned with percentage-based `top` / `height` so they represent actual event duration. A `ResizeObserver` on each chip switches between compact (slot + %) and full (day, time range, eligible count) layouts at 70 px.
- **Week navigation**: `key`-based remount triggers a slide-left / slide-right CSS animation when switching weeks. Navigation is bounded to the Fall 2026 semester (Sept 14 – Dec 28, 2026).
- **Time axis labels**: each label sits centered on its row boundary via `translateY(-50%)`.

---

## Synthetic data (`src/data/synthetic.ts`)

A seeded LCG (seed 42) generates 1,222 deterministic students:

| Program | Students |
|---|---|
| Undergraduate (4 years × ~257 students) | 1,028 |
| Masters (2 years × ~97 students) | 194 |

Each student gets 4–8 conflict-free occupied `"Day-HH:MM"` slots drawn from the 9 class start times across Mon–Sat. International flag is assigned with the same seed (450 international, 772 domestic).

Department distribution matches the official Fall 2026 enrollment: BA, ECO, AMI, SFW, ICP, JMC, PSY, SOC, ANTH, ESCS, TCMA, IBL, LAS (8 concentrations), LLM, MAANTH, MACAS, MAPAP, MAT, MBA, MSECO.

---

## Recommendation algorithm (`src/hooks/useResults.ts`)

1. For each active filter, compute matching students.
2. For every `(day, slot)` pair where the day is selected and the slot falls within the chosen time priority:
   - Per filter: `freePercent = free students / matching students × 100`
   - Cell score = average `freePercent` across all filters
3. Sort by score descending; return top 4 as `Recommendation[]` and the full `heatmap` map.

---

## Time constants (`src/constants.ts`)

Nine class start times, each 75 minutes long with 10-minute breaks between them (40-minute lunch gap after 10:50):

`8:00 · 9:25 · 10:50 · [12:05 lunch] · 12:45 · 14:10 · 15:35 · 17:00 · 18:25 · 19:50`

The grid uses proportional `fr` rows: class rows = 75 fr, break rows = 10 fr, lunch = 40 fr, trailing gap = 55 fr, terminal label row = auto.

---

## Excel dataset (`public/Fall_2026_Students.xlsx`)

Generated by the Python scripts from the official Fall 2026 schedule PDFs. Reserved for backend use (not loaded by the SPA).

### Sheet 1 — "Fall 2026 Students"

| Column | Description |
|---|---|
| Student ID | `S00001`–`S01222` |
| Department | Program code (see list above) |
| Concentration | LAS sub-concentration (`DC`, `ES`, `HR`, `MC`, `MM`, `PC`, `SEDT`, `UPD`); blank for all others |
| Year | `Freshman` / `Sophomore` / `Junior` / `Senior` / `Masters 1st Year` / `Masters 2nd Year` |
| International | `Yes` (450) or `No` (772) |
| Total Credits | 24–33 UG; 18–33 PG |
| Course 1 … Course N | `CODE (sec N): Full Name — Day/Time — Xcr` |

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
| Python 3 + openpyxl | Reference dataset generation |
| GitHub Actions | CI/CD to GitHub Pages |

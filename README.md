# ScheduleWhen

A scheduling tool for AUCA (American University of Central Asia) that recommends the best time to hold an event based on student schedule conflicts. Built as a client-side React SPA — no backend required.

Live URL: `https://lunamaltseva.github.io/ScheduleWhen/`

---

## How it works

Configure an event in the sidebar (duration, days, time preference, target headcount, audience filters), then press **Generate**. The algorithm scans every viable start time across the selected days and scores each window by how many filtered students are free and on campus. The top 4 results appear as chips on the heatmap and as cards in the sidebar. A collapsible AI chatbot powered by Claude (fixed bottom-right on desktop, full-screen on mobile) answers natural-language questions about the output.

The heatmap is blank until Generate is pressed. Once results exist, cells are colored on a dark-blue → white gradient (dark = busy, light = free). Chips disappear when parameters become stale. An **Auto-update** toggle re-runs the algorithm automatically on every change after the first generation.

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
│   ├── lib/
│   │   ├── ai.ts              Claude API client — system prompt, context builder, streaming
│   │   └── shims/             Stubs for Node.js built-ins pulled in by the Anthropic SDK
│   └── components/
│       ├── Icons.tsx           Inline SVG icons (star, chevrons, chatbot, time-of-day)
│       ├── Sidebar/
│       │   ├── index.tsx           Sidebar shell + scroll container
│       │   ├── SidebarHeader.tsx   Brand header (matches calendar header height)
│       │   ├── EventSpec.tsx       Duration, days, priority, from-date, target inputs
│       │   ├── FiltersSection.tsx  Audience filter table with inline delete confirm
│       │   ├── FilterModal.tsx     Add/edit filter — department, year, status dropdowns
│       │   ├── GenerateButton.tsx  Runs algorithm; auto-update toggle after first run
│       │   └── ResultsSection.tsx  Preferred/alternative chips + room suggestions
│       ├── Calendar/
│       │   ├── index.tsx           Calendar shell
│       │   ├── CalendarHeader.tsx  Week navigation (Today, ‹ ›, week label, semester chip)
│       │   └── HeatmapGrid.tsx     CSS-grid heatmap + percentage-positioned chips + tooltip
│       └── Chat/
│           └── index.tsx           Collapsible chatbot (desktop fixed, mobile fullscreen)
├── .env.example               Template for VITE_ANTHROPIC_API_KEY
├── .github/workflows/
│   └── deploy.yml             GitHub Pages deployment via GitHub Actions
├── index.html
├── tailwind.config.js         Brand colors, Open Sans, keyframe animations
├── vite.config.ts             Vite config + Node.js shim plugin for Anthropic SDK
└── tsconfig.json
```

---

## Data loading

On mount, `ExcelLoader` (in `App.tsx`) fetches `Fall_2026_Students.xlsx` from the public directory and parses it with SheetJS. Each row's course columns are parsed into `periods: Array<{ day, startMin, endMin }>` intervals. If the fetch or parse fails, the app shows an error state — there is no silent fallback, so the displayed data always reflects the real schedule file.

The synthetic dataset (`src/data/synthetic.ts`) is kept as a development reference but is not loaded by the running app.

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

Each filter scopes the student pool by department(s), year(s), and domestic/international status. Multiple filters are stacked; availability is scored across the union of matched students (no double-counting). Filters are edited in a modal with floating multi-select dropdowns (rendered via `createPortal` to escape overflow clipping). Departments are grouped as Undergrad and Masters in the dropdown.

### Results (`ResultsSection.tsx`)

Shown only when results are fresh (Generate has been run and no parameters have changed since).

Top 4 recommended slots displayed as chips (2 preferred MW/TTh pairs, 2 alternatives). Each chip shows: day(s), time range, availability %, and free on-campus student count. The best-scoring chip across all four receives a gold SVG star and a gold outline ring.

If the target headcount cannot be reached within the chosen time preference, the algorithm retries without the preference restriction and flags the override with a banner. If the target is unreachable even then, a red notice explains why.

### Generate button and Auto-update (`GenerateButton.tsx`)

Pressing **Generate** runs the algorithm synchronously and renders results. After the first generation, an **Auto-update** toggle appears below the button. When enabled, the algorithm re-runs automatically whenever any parameter changes — the Generate button effectively disappears and results track the sidebar state in real time.

When results are fresh the main button switches to **Explain why**, which sends a structured explanation of the top recommendation to the AI chatbot.

### Room suggestions

Rooms are recommended based on target size and any departments explicitly named in filters:

| Target | Category | Rooms |
|---|---|---|
| 60+ | Large Rooms | 410, 434, 440, Forum |
| 30–59 | Medium Rooms | G34, 220, 435 · Large Rooms (larger option) |
| 10–29 | Small Rooms | G35, G33, G32, 203, 305, 405 · Medium Rooms (larger option) |
| < 10 | Very Small Rooms | 211, 212, 213, 340, 411 · Small Rooms (larger option) |

Computer labs are added as a second group when filters target relevant departments:

| Departments | Labs |
|---|---|
| SFW, AMI | G30, G31, 432, 433 |
| JMC, TCMA | C07 |
| JMC, TCMA | 223, 233 (Graphic Design) |

Labs are not suggested when filters use "all departments" (audience too broad to assume computer access is needed).

---

## Calendar heatmap (`HeatmapGrid.tsx`)

- **Grid**: CSS grid with `fr` rows proportional to minutes (1 fr = 1 minute; 840 fr total for 8:00–22:00). Break rows between class slots are fully white, not gray.
- **Blank before Generate**: all cells render with no color until results exist.
- **Gradient**: once results are loaded, min–max normalized across active slots. The cell with the fewest free students maps to dark blue (`#2d457c`); the most free maps to white (`#ffffff`). Local contrast is maximized per-run.
- **No campus**: days with zero on-campus students (e.g. Saturday for a filter covering only Mon–Fri commuters) show a white cell with a red diagonal line rather than the same white used for "everyone is free."
- **Chips**: positioned with percentage-based `top` / `height` so their extent matches the event duration on the time axis. A `ResizeObserver` on each chip switches between a compact 2-row layout and a full layout based on chip width (narrow → wide at 130 px; wide → narrow at 110 px, with a dead zone to prevent flicker). The best chip gets a gold star icon and gold CSS outline.
- **Hover tooltip**: hovering a populated cell shows a floating tooltip (via `createPortal`) with three figures:
  - *On campus today* — students with any class that day
  - *Present at [time]* — students whose campus span (first class start → last class end) covers this slot
  - *Available* — % of on-campus students with no conflict at this slot
  
  The tooltip follows the cursor, stays 10 px above it, and flips below if there is less than 80 px of clearance above the calendar header.
- **Week navigation**: `key`-based remount triggers a slide-left / slide-right CSS animation with a directional blur when switching weeks. The header also displays the semester week number (e.g. "Week 3") and today's date circled in brand blue.
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
rawFreePercent = effectiveFree / onCampus × 100
score = rawFreePercent × timeWeight × lunchAdjust × mixAdjust
```

- **onCampus**: students matching the current filters who have at least one class that day. This is the denominator for both the algorithm and the heatmap cells — the two numbers are always consistent.
- **effectiveFree**: on-campus students with no overlapping period + 0.5 × students who have only a 12:45 class (they can attend the start of a lunch-overrun event).
- **timeWeight**: peaks at 1.0 in early afternoon, tapers toward mornings and late evenings.

  | Time | Weight | Rationale |
  |---|---|---|
  | before 8:30 | 0.35 | campus barely active |
  | 8:30–9:30 | 0.68 | still arriving |
  | 9:30–12:00 | 0.92 | mid-morning peak |
  | 12:00–15:00 | 1.00 | prime afternoon |
  | 15:00–16:30 | 0.88 | late afternoon, some leaving |
  | 16:30–17:30 | 0.65 | post-15:35 departure wave |
  | 17:30–19:00 | 0.45 | campus thinning |
  | 19:00–20:30 | 0.30 | late evening |
  | after 20:30 | 0.18 | nearly deserted |

- **lunchAdjust**: 12:05-start events get a 1.40× bonus (fits the gap), 1.20× if the event is ≤ 40 min, or 1.10× if it overruns 12:45 (partial attendance still makes it worthwhile).
- **mixAdjust**: penalizes early-morning and late-evening slots based on the UG/PG split of the on-campus population. UG students skew away from both early mornings and evenings more sharply than PG students.

### Output

`buildSuggestions` picks the best MW pair, the best TTh pair, and two non-overlapping alternatives. A lunch-window suggestion is always guaranteed if the 12:05 slot scores ≥ 20% free and nothing has already occupied it.

If the target headcount isn't met within the chosen time period, the algorithm re-runs without the period restriction. The better result is used and `prefOverridden` is set.

---

## AI assistant (`src/lib/ai.ts`)

The chatbot uses the [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) (`@anthropic-ai/sdk`) with `dangerouslyAllowBrowser: true` to call the Claude API directly from the browser. The model is `claude-opus-4-7`.

### Context injection

Before each request, `buildContextBlock(state)` serializes the current app state — duration, active days, time preference, filters, and the full algorithm result including all four suggestions and their scoring factors — into a plain-English block that is injected into the system prompt. The assistant is therefore always aware of the exact recommendation currently shown on screen.

### System prompt principles

The system prompt instructs the assistant to:

- Match the user's language (Russian, Kyrgyz, English, or mixed) without switching them to English
- Interpret imperfect spelling and grammar; ask at most one clarifying question for ambiguous input
- Define scheduling jargon inline the first time it is used
- Never invent data (rooms, dates, student counts) not present in the context block
- Flag honest uncertainty rather than guessing
- Note when a recommendation applies to a specific displayed week
- Direct complaints or suggestions about the tool to the Registrar's Office, Room 110

### Streaming

`streamAI()` is an async generator that yields text chunks as they arrive, displayed with a blinking cursor. The input field is disabled while the assistant is typing. If `VITE_ANTHROPIC_API_KEY` is not set, the assistant shows a clear warning instead of silently failing.

### Configuration

```bash
# .env.local (development)
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

For production, add `VITE_ANTHROPIC_API_KEY` as a GitHub Actions secret. The deploy workflow passes it to `npm run build` as an environment variable.

---

## Synthetic data (`src/data/synthetic.ts`)

A seeded LCG (seed 42) generates 1,222 deterministic students for development and testing:

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

The CSS grid uses proportional `fr` rows: class rows = 75 fr, break rows = 10 fr, lunch = 40 fr, evening gap = 55 fr (21:05–22:00). Labels are shown at 8:00, 9:25, 10:50, 12:05, 12:45, 14:10, 15:35, 17:00, 18:25, 19:50, 21:05, and 22:00.

---

## Excel dataset (`public/Fall_2026_Students.xlsx`)

Generated by the Python scripts from official Fall 2026 schedule data. Loaded by the SPA on startup; if loading fails, the app shows an error state and prompts the user to reload.

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
cp .env.example .env.local   # add your VITE_ANTHROPIC_API_KEY
npm run dev                  # http://localhost:5173/ScheduleWhen/
npm run build                # production build → dist/
npm run preview              # preview production build locally
```

The AI assistant is optional — the app works without an API key, but the chatbot will display a warning instead of responding.

---

## Deploy to GitHub Pages

Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

Enable once in repository settings: **Settings → Pages → Source → GitHub Actions**

For the AI assistant in production, add the API key as a repository secret:  
**Settings → Secrets and variables → Actions → New repository secret**  
Name: `VITE_ANTHROPIC_API_KEY`

---

## Tech stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI and state |
| Vite 5 | Dev server and bundler |
| Tailwind CSS 3 | Styling — brand tokens, animations, responsive layout |
| SheetJS (xlsx) | Client-side Excel parsing |
| @anthropic-ai/sdk | Claude API — streaming AI chatbot |
| Python 3 + openpyxl | Reference dataset generation |
| GitHub Actions | CI/CD to GitHub Pages |

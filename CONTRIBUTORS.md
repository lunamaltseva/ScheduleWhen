# Contributing to ScheduleWhen

ScheduleWhen is a client-side React SPA that recommends the best time to hold an event at AUCA based on real student schedule data. There is no backend — all computation happens in the browser.

Live: `https://lunamaltseva.github.io/ScheduleWhen/`

---

## Quick start

```bash
git clone https://github.com/lunamaltseva/ScheduleWhen.git
cd ScheduleWhen
npm install
cp .env.example .env.local        # add VITE_ANTHROPIC_API_KEY (optional — app works without it)
npm run dev                        # http://localhost:5173/ScheduleWhen/
```

The AI chatbot requires an Anthropic API key. Without one, all other features work normally and the chatbot displays a warning instead of responding.

---

## Tech stack

| Tool | Version | Role |
|---|---|---|
| React | 18 | UI + state |
| TypeScript | 5 (strict) | Types throughout |
| Vite | 5 | Dev server, bundler, env vars |
| Tailwind CSS | 3 | Styling — brand tokens, animations |
| SheetJS (`xlsx`) | latest | Client-side Excel parsing |
| `@anthropic-ai/sdk` | 0.98 | Claude API — streaming chatbot + tool use |
| Python 3 + openpyxl | — | Dataset generation scripts (not part of the SPA) |
| GitHub Actions | — | Deploy to GitHub Pages on push to `main` |

---

## Project structure

```
ScheduleWhen/
├── public/
│   ├── Fall_2026_Students.xlsx     Real Fall 2026 schedule (loaded on startup)
│   └── academic-calendar.ics       AUCA academic calendar (holidays, special days)
├── scripts/
│   ├── generate_students.py        Builds the Excel dataset from course data
│   ├── course_data.py              Shared course catalog (FYS, GenEd, languages)
│   └── dept_data.py                Per-department course lists
├── src/
│   ├── main.tsx                    Entry point
│   ├── App.tsx                     Root layout — responsive desktop/mobile + data loaders
│   ├── constants.ts                Time slots, grid rows, semester bounds (ISO dates)
│   ├── types.ts                    All shared TypeScript types
│   ├── context/
│   │   └── AppContext.tsx          Global state via useReducer + useApp() hook
│   ├── algorithm/
│   │   └── score.ts                Sliding-window scorer, lunch bonuses, suggestions
│   ├── data/
│   │   ├── loader.ts               SheetJS parser — reads Excel into Student[]
│   │   ├── parseCalendar.ts        ICS parser — reads academic calendar into AcademicEvent[]
│   │   └── synthetic.ts            LCG-seeded fallback dataset (dev reference, not loaded)
│   ├── hooks/
│   │   └── useResults.ts           Computes per-slot heatmap values (useMemo)
│   ├── lib/
│   │   ├── ai.ts                   Claude API client — tool use, streaming, rate limiting
│   │   └── shims/                  Stubs for Node.js built-ins pulled in by the Anthropic SDK
│   └── components/
│       ├── Icons.tsx               All inline SVG icons
│       ├── Sidebar/
│       │   ├── index.tsx           Shell + modal routing
│       │   ├── SidebarHeader.tsx   Brand header
│       │   ├── EventSpec.tsx       Duration, days, priority, from-date, target inputs
│       │   ├── FiltersSection.tsx  Audience filter table with inline delete confirm
│       │   ├── FilterModal.tsx     Add/edit filter modal (portal-rendered dropdowns)
│       │   ├── GenerateButton.tsx  Runs algorithm; auto-update toggle
│       │   └── ResultsSection.tsx  Result chips + room suggestions
│       ├── Calendar/
│       │   ├── index.tsx           Calendar shell + no-timeslot banner
│       │   ├── CalendarHeader.tsx  Week navigation (Today / ‹ ›)
│       │   ├── AllDayRow.tsx       Academic calendar event bars (Google Calendar style)
│       │   └── HeatmapGrid.tsx     CSS-grid heatmap + chips + tooltip
│       └── Chat/
│           └── index.tsx           Collapsible AI chatbot (desktop fixed, mobile fullscreen)
├── .env.example                    Template — copy to .env.local
├── .github/workflows/deploy.yml   GitHub Pages CI/CD
├── tailwind.config.js              Brand colors, Open Sans, custom keyframes
└── vite.config.ts                  Node.js shim plugin for Anthropic SDK in browser
```

---

## State management

All state lives in `AppContext.tsx` — a single `useReducer` store exposed via `useApp()`. There is no Redux, Zustand, or other library.

**Key state fields:**

| Field | Type | Purpose |
|---|---|---|
| `students` | `Student[]` | Loaded from Excel on mount |
| `academicEvents` | `AcademicEvent[]` | Loaded from ICS on mount |
| `selectedDays` | `boolean[]` | Which days (Mon–Sat) the user has toggled on |
| `isDirty` | `boolean` | True when params changed since last Generate |
| `algorithmResult` | `AlgorithmResult \| null` | Last Generate output |
| `autoRegen` | `boolean` | Re-run algorithm on every param change |
| `noTimeslotBanner` | `string \| null` | Non-blocking warning shown in the heatmap |

**Dirty actions**: any action in `DIRTY_ACTIONS` (including `SET_WEEK_OFFSET`) sets `isDirty = true`, hiding chips and showing the Generate button. Auto-regen watches `isDirty` and fires if the toggle is on.

---

## Algorithm

`src/algorithm/score.ts` — pure functions, no side effects, easy to unit test.

1. **Filter students** — build the eligible pool as the union of all audience filters (no double-counting).
2. **Score each `(day, startMin)` window** — `rawFreePercent = effectiveFree / eligibleTotal × 100`, then multiply by `timeWeight` (peaks at 1.0 in early afternoon), `lunchAdjust` (bonus for 12:05-start events), and `mixAdjust` (penalises early/late slots based on UG/PG split).
3. **Build suggestions** — best MW pair, best TTh pair, two non-overlapping alternatives. A 12:05 lunch slot is always guaranteed if it scores ≥ 20%.
4. **Retry without time preference** if the target headcount isn't met within the preferred period.

### Semester and holiday filtering

Before `runAlgorithm` is called, `GenerateButton` filters `selectedDays` against:
- Semester bounds: `SEMESTER_START_ISO = '2026-09-15'` through `SEMESTER_END_ISO = '2026-12-31'`
- Academic events of `kind === 'no-classes'` from the ICS

If all active days are blocked, a red banner is shown in the heatmap instead of running the algorithm.

---

## Heatmap

`HeatmapGrid.tsx` uses a CSS grid with `fr` rows proportional to minutes (1 fr = 1 min, 840 fr total for 8:00–22:00). Key points for contributors:

- **Gradient**: min–max normalised per run. The least-available slot maps to white `#ffffff`; the most-available maps to brand-blue `#2d457c`. Blank (no colour) before Generate is pressed.
- **Blanked columns**: days outside the semester or covered by a `no-classes` event render white with no tooltip.
- **Chips**: positioned with `top`/`height` as percentages of the grid height. `ResizeObserver` switches each chip between compact and wide layouts at 130 px / 110 px (dead zone prevents flicker).
- **Tooltip**: rendered via `createPortal` into `document.body` to escape overflow clipping.
- **Slide animation**: the outer `key={weekOffset}` triggers a CSS slide-left/slide-right on week navigation.
- **All-day row**: `AllDayRow.tsx` uses greedy row-packing to render overlapping ICS events as Google Calendar–style bars. Dates are always computed in local time — never use `toISOString()` on a local-midnight `Date`.

---

## AI chatbot

`src/lib/ai.ts` — uses the Anthropic SDK with `dangerouslyAllowBrowser: true`. The model is `claude-haiku-4-5-20251001`.

**Two-phase flow:**
1. Non-streaming call with four tools (`set_duration`, `set_days`, `set_time_periods`, `set_target_participants`). If the model calls tools, those actions are dispatched to the context immediately (sidebar updates live).
2. Streaming call with the tool results to get the natural-language response.

**Rate limiting**: 10 requests per 60 s, enforced in-memory per browser session.

**Context injection**: `buildContextBlock(state)` serialises the full current state (params + all four suggestions + scores) into the system prompt before every request.

### Adding a new tool

1. Add its schema to the `TOOLS` array in `ai.ts`.
2. Add a case to `processToolCall` that validates input and pushes a `ParamAction`.
3. If the action type is new, add it to `AppContext.tsx` (Action union + reducer + `DIRTY_ACTIONS` if it affects results).

---

## Adding icons

All icons live in `src/components/Icons.tsx` as named exports. Each accepts an optional `className` prop. Use `fill="none" stroke="currentColor"` for outline icons and `fill="currentColor"` for filled ones. Keep `viewBox="0 0 24 24"` consistent.

---

## Updating semester data

The Fall 2026 dataset is generated by the Python scripts:

```bash
pip install openpyxl
python3 -m scripts.generate_students      # writes public/Fall_2026_Students.xlsx
```

To update the academic calendar, replace `public/academic-calendar.ics` with the new ICS file. Events are classified automatically by title:
- Titles matching `/no.?class(es)?/i` → `no-classes` (red bar, heatmap blanked)
- Titles containing `50 min.` → `50min-classes` (amber bar)
- Everything else → `other` (blue bar)

---

## Code conventions

- **TypeScript strict** — no `any` except at well-understood dispatch boundaries.
- **No comments on obvious code** — only comment non-obvious invariants or workarounds.
- **Local state only for typing buffers** — sync back from context via `useEffect` when the context value changes externally (see `EventSpec.tsx`).
- **Date comparisons use local-time ISO strings** — never `toISOString()` on a local-midnight Date. Use the `localDateToISO` helpers in `HeatmapGrid.tsx`, `AllDayRow.tsx`, and `GenerateButton.tsx`.
- **Tailwind only** — no inline `style` except for computed values (grid templates, percentage positions, interpolated colours).

---

## Branch & PR workflow

1. Branch from `main`: `git checkout -b your-feature`
2. Keep PRs focused — one feature or fix per PR.
3. Run `npx tsc --noEmit` and `npm run build` before opening a PR; both must pass cleanly.
4. There are no automated tests — manually verify the golden path (Generate → chips appear → chatbot responds → week navigation) and any edge cases your change touches.
5. Merging to `main` triggers automatic deployment to GitHub Pages.

---

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_ANTHROPIC_API_KEY` | `.env.local` (dev) | Claude API key — **never commit this file** |
| `VITE_ANTHROPIC_API_KEY` | GitHub Actions secret | Same key, injected at build time for production |

`.env.local` is git-ignored. `.env.example` shows the required variable name with a placeholder value.

---

## Deployment

Push to `main`. GitHub Actions runs `npm run build` (with the secret injected) and deploys `dist/` to GitHub Pages.

One-time repo setup: **Settings → Pages → Source → GitHub Actions**.

To add the production API key: **Settings → Secrets and variables → Actions → New repository secret → `VITE_ANTHROPIC_API_KEY`**.

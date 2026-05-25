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
| react-day-picker | 10 | "Starting from" date picker widget |
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
│   ├── App.tsx                     Root layout — responsive desktop/mobile + data loaders + <AutoRegen/>
│   ├── constants.ts                Time slots, grid rows, semester bounds (ISO dates)
│   ├── types.ts                    All shared TypeScript types
│   ├── context/
│   │   └── AppContext.tsx          Global state via useReducer + useApp() hook
│   ├── algorithm/
│   │   └── score.ts                Sliding-window scorer, lunch bonuses, suggestions, fixed-time mode
│   ├── data/
│   │   ├── loader.ts               SheetJS parser — reads Excel into Student[]
│   │   ├── parseCalendar.ts        ICS parser — reads academic calendar into AcademicEvent[]
│   │   └── synthetic.ts            LCG-seeded fallback dataset (dev reference, not loaded)
│   ├── hooks/
│   │   ├── useResults.ts           Computes per-slot heatmap values for all 6 days (useMemo)
│   │   └── useGenerate.ts          Shared "run the algorithm" callback (manual + auto)
│   ├── lib/
│   │   ├── ai.ts                   Claude API client — tool use, streaming, rate limiting
│   │   ├── rooms.ts                Room-group lookup by target size + department labs
│   │   ├── exportCsv.ts            Serialises suggestions + rooms to a downloadable CSV
│   │   └── shims/                  Stubs for Node.js built-ins pulled in by the Anthropic SDK
│   └── components/
│       ├── Icons.tsx               All inline SVG icons
│       ├── AutoRegen.tsx           Always-mounted effect that auto-reruns the algorithm
│       ├── common/
│       │   └── HelpTip.tsx         Portal tooltip — "?" icon (card titles) or text-docked (labels)
│       ├── Sidebar/
│       │   ├── index.tsx           Shell (subtle cards) + modal routing + CSV export action
│       │   ├── SidebarHeader.tsx   Brand header
│       │   ├── EventSpec.tsx       Duration (stepper + chevron presets), days, priority, date, target
│       │   ├── DatePicker.tsx      react-day-picker popover (semester-clamped)
│       │   ├── FiltersSection.tsx  Audience filter table; row-click edits, trash button deletes
│       │   ├── FilterModal.tsx     Add/edit filter modal (portal-rendered dropdowns)
│       │   ├── GenerateButton.tsx  Runs algorithm (pulses when filters added) / Explain why
│       │   └── ResultsSection.tsx  Result chips (fill bars) + room suggestions
│       ├── Calendar/
│       │   ├── index.tsx           Calendar shell + no-timeslot banner
│       │   ├── CalendarHeader.tsx  Week navigation (Today / ‹ ›)
│       │   ├── AllDayRow.tsx       Academic calendar event bars (Google Calendar style)
│       │   └── HeatmapGrid.tsx     CSS-grid heatmap (6 days) + chips + tooltips + floating legend
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
| `filters` | `Filter[]` | Audience filters; empty = all students (no default placeholder filter) |
| `fixedStartMin` | `number \| null` | Chatbot-pinned exact start time; when set the scorer locks it and picks the best day(s) |
| `isDirty` | `boolean` | True when params changed since last Generate |
| `algorithmResult` | `AlgorithmResult \| null` | Last Generate output |
| `autoRegen` | `boolean` | Always `true` — auto-update is the default (the old toggle was removed) |
| `noTimeslotBanner` | `string \| null` | Non-blocking warning shown in the heatmap |

**Dirty actions**: any action in `DIRTY_ACTIONS` (including `SET_WEEK_OFFSET`) sets `isDirty = true`, hiding chips and showing the Generate button. `<AutoRegen/>` (mounted at the App root so it survives mobile view switches) watches `isDirty` and re-runs the algorithm via the `useGenerate` hook. Only an explicit Generate click scrolls the results into view.

**Chat auto-collapse**: parameter actions carry an optional `fromAI` flag. A user-driven param edit (in `COLLAPSE_ON_ACTIONS`) collapses the chat window; the same action dispatched by the chatbot's tool use sets `fromAI: true` and does not.

---

## Algorithm

`src/algorithm/score.ts` — pure functions, no side effects, easy to unit test.

1. **Filter students** — build the eligible pool as the union of all audience filters (no double-counting).
2. **Score each `(day, startMin)` window** — `rawFreePercent = effectiveFree / eligibleTotal × 100`, then multiply by `timeWeight` (peaks at 1.0 in early afternoon), `lunchAdjust` (bonus for 12:05-start events), and `mixAdjust` (penalises early/late slots based on UG/PG split).
3. **Build suggestions** — best MW pair, best TTh pair, two non-overlapping alternatives. A 12:05 lunch slot is always guaranteed if it scores ≥ 20%.
4. **Retry without time preference** if the target headcount isn't met within the preferred period.

### Fixed-time mode

`runAlgorithm` takes an optional `fixedStartMin`. When set (via the chatbot's `set_fixed_time` tool), the scorer evaluates **only** that exact start across every active day — bypassing the candidate-start grid and time-period filter — so pairing/alternatives effectively "choose the best day(s)" for that time. The target-not-met period-expansion retry is skipped in this mode. A clearable "Fixed start" chip appears in the sidebar.

### Semester and holiday filtering

Before `runAlgorithm` is called, `GenerateButton` filters `selectedDays` against:
- Semester bounds: `SEMESTER_START_ISO = '2026-09-15'` through `SEMESTER_END_ISO = '2026-12-31'`
- Academic events of `kind === 'no-classes'` from the ICS

If all active days are blocked, a red banner is shown in the heatmap instead of running the algorithm.

---

## Heatmap

`HeatmapGrid.tsx` uses a CSS grid with `fr` rows proportional to minutes (1 fr = 1 min, 840 fr total for 8:00–22:00). Key points for contributors:

- **All six days** (Mon–Sat) always render; `useResults` computes availability for every day, not just the selected ones.
- **Gradient**: min–max normalised per run. The least-available slot maps to brand-blue `#2d457c`; the most-available maps to white `#ffffff` (i.e. darker = fewer free). Blank before Generate is pressed.
- **Disabled days**: still show their heat, overlaid with a translucent `DISABLED_TINT` discoloration that runs from the all-day band down through the grid. Headers mark enabled days with a blue date circle, disabled days plain, and the current day with a golden outline.
- **Blanked columns**: days outside the semester or covered by a `no-classes` event render white with no tooltip.
- **Chips**: positioned with `top`/`height` as percentages of the grid height, with a `minHeight` floor so short events stay readable. They share the sidebar chip's visual design (fill bar, colours, star). `ResizeObserver` switches between compact and wide layouts (hysteresis prevents flicker).
- **Tooltips**: portal-rendered into `document.body`. A `cell` tooltip follows the cursor (only once results exist); a `chip` tooltip shows on hovering/clicking a suggestion chip.
- **Legend**: a floating "Free%" notch on the right edge, vertically centred, shown only after Generate.
- **Slide animation**: the inner `key={weekOffset}` triggers a CSS slide-left/slide-right on week navigation; the legend sits outside it so it stays put.
- **All-day row**: `AllDayRow.tsx` uses greedy row-packing to render overlapping ICS events as Google Calendar–style bars. Dates are always computed in local time — never use `toISOString()` on a local-midnight `Date`.

---

## AI chatbot

`src/lib/ai.ts` — uses the Anthropic SDK with `dangerouslyAllowBrowser: true`. The model is `claude-haiku-4-5-20251001`.

**Two-phase flow:**
1. Non-streaming call with the tools (`set_duration`, `set_days`, `set_time_periods`, `set_target_participants`, `set_start_date`, `set_fixed_time`). If the model calls tools, those actions are dispatched to the context immediately (sidebar updates live). Every AI-dispatched action carries `fromAI: true` so it doesn't collapse the chat.
2. Streaming call with the tool results to get the natural-language response.

**Typing effect**: the streamed text accumulates into `full`; a `displayed` substring is revealed gradually (`TYPE_CHARS_PER_TICK` per tick). The bot message is committed only once `displayed` has caught up **and** `streamDone` is set — both are React state, so completion fires reliably even for tool-only turns (don't reintroduce a ref that nudges a value to itself; React bails on no-op state updates and the turn hangs as "Assistant is typing").

**Autoscroll**: the messages container scrolls to the bottom only when the user is already near it — never the page (this keeps the mobile header reachable).

**Rate limiting**: 10 requests per 60 s, enforced in-memory per browser session.

**Context injection**: `buildContextBlock(state)` serialises the full current state (params, fixed start time, start date, filters + all four suggestions + scores) into the system prompt before every request.

### Adding a new tool

1. Add its schema to the `TOOLS` array in `ai.ts`.
2. Add a case to `processToolCall` that validates input and pushes a `ParamAction` **tagged `fromAI: true`** (add the variant to the `ParamAction` union too).
3. If the action type is new, add it to `AppContext.tsx` (Action union + reducer + `DIRTY_ACTIONS` if it affects results; add to `COLLAPSE_ON_ACTIONS` if a user edit of it should collapse the chat).

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

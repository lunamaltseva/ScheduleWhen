# ScheduleWhen

A synthetic Fall 2026 enrollment dataset for AUCA (American University of Central Asia) — 1,222 hypothetical students with conflict-free schedules — plus a React/Vite web viewer deployed to GitHub Pages.

## Project structure

```
ScheduleWhen/
├── scripts/
│   ├── generate_students.py   Main generation script
│   ├── course_data.py         Shared course catalog (FYS, GenEd, languages)
│   └── dept_data.py           Department catalogs, required courses, electives
├── public/
│   └── Fall_2026_Students.xlsx   Generated dataset (Vite serves this at runtime)
├── src/
│   ├── main.jsx               React entry point
│   ├── App.jsx                Viewer — loads xlsx via SheetJS, filterable table
│   ├── App.css                Component styles
│   └── index.css              Global reset
├── .github/workflows/
│   └── deploy.yml             GitHub Pages deployment via GitHub Actions
├── index.html                 Vite HTML entry
├── vite.config.js             Vite config (base: /ScheduleWhen/)
└── package.json
```

---

## Excel file — `public/Fall_2026_Students.xlsx`

### Sheet 1 — "Fall 2026 Students"

| Column | Description |
|---|---|
| Student ID | Unique identifier, format `S00001`–`S01222` |
| Department | Program code: `BA`, `ECO`, `AMI`, `SFW`, `ICP`, `JMC`, `PSY`, `SOC`, `ANTH`, `ESCS`, `TCMA`, `IBL`, `LAS`, `LLM`, `MAANTH`, `MACAS`, `MAPAP`, `MAT`, `MBA`, `MSECO` |
| Concentration | LAS sub-concentration only: `DC`, `ES`, `HR`, `MC`, `MM`, `PC`, `SEDT`, `UPD`; blank for all other programs |
| Year | `Freshman`, `Sophomore`, `Junior`, `Senior`, `Masters 1st Year`, `Masters 2nd Year` |
| International | `Yes` (450 students) or `No` (772 students) |
| Total Credits | Credits enrolled this semester (24–33 for UG; 18–33 for PG) |
| Course 1 … Course N | Every course the student takes, format: `CODE (sec N): Full Name — Day/Time — Xcr` |

### Sheet 2 — "Summary"

Enrollment count and international student count grouped by department and concentration.

### Enrollment rules encoded in the data

- **1,222 students**: 84% undergraduate (1,028), 16% masters (194)
- **Credit caps**: Freshmen ≤ 30 cr; Sophomores/Juniors/Seniors ≤ 33 cr
- **Credit target**: 62% at cap, 24% at cap − 3, 14% lighter; no student below 24 cr
- **Freshman writing cluster**: FYS-100 (4 cr, Mon/Wed) + ENG-122 (6 cr, Fri × 2) + FYS-100.3 (2 cr, Individual) = 12 cr across 14 coordinated sections
- **Sophomore languages**: Kyrgyz (KLL, 4 cr) + Russian (RUS/RFL, 2 cr); international students take KLL-104 and RFL instead of the domestic variants
- **No time conflicts**: every student's schedule is conflict-checked against `(day, time)` slot pairs
- **Section distribution**: sections are selected randomly; seat counts are soft limits (an overflow pass simulates add-form enrollment)
- **Sports requirement**: undergraduates must complete 4 sport classes over 4 years (0 credits each); modeled per-semester as Freshmen 70%, Sophomores 60%, Juniors 15%, Seniors 5%; sport selection is random from 12 SPO- courses

---

## Python scripts

### `scripts/course_data.py`

Shared course catalog used by every program:

| Object | Contents |
|---|---|
| `GENED` | General Education electives: History, Geography, Manas Studies, SS, HUM, NTR, ART, foreign languages |
| `SPORTS` | Zero-credit sport courses |
| `RUS_DOMESTIC` | Russian Language for domestic students (RUS-101.1, RUS-201.1) |
| `RFL_INTERNATIONAL` | Russian as a Foreign Language (RFL-103.1, RFL-203.1) |
| `KLL_DOMESTIC` | Kyrgyz Language for domestic students (KLL-103.1, KLL-203.1) |
| `KLL_INTERNATIONAL` | Kyrgyz for foreign students (KLL-104.1) |
| `fys1_bundle_sections()` | 14 coordinated Freshman writing cluster bundles |
| `fys2_bundle_sections()` | 3 Sophomore FYS-II bundles |

Each course entry: `{"code", "name", "credits", "sections"}` where each section has `{"sec", "slots": [(day, time), …], "seats"}`.

### `scripts/dept_data.py`

| Object | Contents |
|---|---|
| `DEPT_CATALOG` | Dict mapping department code → list of courses with real section times and credits, extracted from official Fall 2026 schedule PDFs |
| `REQUIRED` | Dict `(dept, conc, year) → [course codes]` — required courses per program/year |
| `ELECTIVES` | Dict `dept → [course codes]` — elective pool per department |
| `LAS_CORE_BY_YEAR` | LAS shared core: NTR/LAS-100 (Freshman), SS/LAS-102 (Sophomore), LAS/HUM-220 + LAS/ART-230 (Junior), LAS-400 (Senior) |

Departments covered: BA, ECO, AMI, SFW, ICP, JMC, PSY, SOC, ANTH, ESCS, TCMA, IBL (Law), LAS (8 concentrations), LLM, MAANTH, MACAS, MAPAP, MAT, MBA, MSECO.

### `scripts/generate_students.py`

Orchestrates everything:

1. Merges all catalogs into a single `CATALOG` dict (keeps the entry with the most sections on duplicate codes)
2. Builds the roster: 257 UG students × 4 years + 97 PG students × 2 years = 1,222
3. Randomly assigns 450 international flags with `random.seed(42)`
4. For each student, calls `build_schedule(dept, conc, year, international)`:
   - Adds the FYS bundle (Freshmen only)
   - Adds required major courses
   - Adds Kyrgyz + Russian (Sophomores only)
   - Fills remaining credits from the elective/GenEd pool
5. Writes `public/Fall_2026_Students.xlsx` with color-coded department rows and a Summary sheet

Run from the project root:

```bash
python3 -m scripts.generate_students
```

Requires **Python 3.12+** and **openpyxl** (`pip install openpyxl`).

---

## Web viewer

A React + Vite single-page app that reads the xlsx at runtime using **SheetJS** — no backend required.

### Features

- Filterable by department, year, and domestic/international status
- Search by Student ID
- Expandable rows showing each student's full course list
- Paginated (50 rows per page)
- Summary stats in the header (total students, international count, departments)

### Local development

```bash
npm install
npm run dev        # http://localhost:5173/ScheduleWhen/
```

After regenerating the dataset, the updated xlsx in `public/` is picked up automatically on the next dev-server reload.

### Production build

```bash
npm run build      # output in dist/
npm run preview    # preview the production build locally
```

### Deploy to GitHub Pages

Push to `main` — the GitHub Actions workflow in `.github/workflows/deploy.yml` builds the app and deploys it automatically.

Before the first deploy, enable GitHub Pages in your repository settings:  
**Settings → Pages → Source → GitHub Actions**

Live URL: `https://lunamaltseva.github.io/ScheduleWhen/`

---

## Tools

| Tool | Purpose |
|---|---|
| Python 3 | Data generation and Excel output |
| openpyxl | Write the `.xlsx` file with styles, colors, and auto-filter |
| React 18 | UI component model |
| Vite 5 | Dev server and production bundler |
| SheetJS (`xlsx`) | Parse the `.xlsx` file in the browser |
| GitHub Actions | CI/CD — build and deploy to GitHub Pages on every push to `main` |

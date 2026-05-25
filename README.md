# ScheduleWhen

ScheduleWhen is a client-side web application created for the American University of Central Asia (AUCA). It helps AUCA professors and staff find suitable times for events based on student schedules.

The app loads student schedule data from an Excel file, analyzes class conflicts, and recommends time slots where the largest number of selected students are available. It also includes a calendar heatmap, audience filters, room suggestions, CSV export, and an optional AI assistant for changing scheduling parameters through chat.

---

## Main features

- **Event scheduling recommendations** based on student class schedules
- **Availability heatmap** for Monday–Saturday
- **Audience filters** by department, study year, and student status
- **Event settings** such as duration, target participants, preferred days, and time period
- **Academic calendar support** through an `.ics` file
- **Special day handling**, including no-class days and 50-minute class days
- **Room suggestions** based on expected number of participants
- **CSV export** for recommended time slots and rooms
- **Optional AI assistant** for explaining results and changing event settings
- **Responsive layout** for desktop and mobile screens

---

## Tech stack

- **React 18**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **SheetJS / xlsx** for reading Excel files in the browser
- **react-day-picker** for date selection
- **Anthropic SDK** for the optional AI assistant
- **Python + openpyxl** for generating the Excel dataset
- **GitHub Pages** for deployment

---

## Project structure

```text
ScheduleWhen/
├── public/
│   ├── Fall_2026_Students.xlsx      # Student schedule dataset
│   └── academic-calendar.ics        # Academic calendar events
│
├── scripts/
│   ├── generate_students.py         # Generates the Excel dataset
│   ├── course_data.py               # Course catalog data
│   └── dept_data.py                 # Department-specific course data
│
├── src/
│   ├── App.tsx                      # Root component and main layout
│   ├── main.tsx                     # React entry point
│   ├── constants.ts                 # Time slots, departments, years, semester dates
│   ├── types.ts                     # Shared TypeScript interfaces
│   │
│   ├── algorithm/
│   │   └── score.ts                 # Main scheduling algorithm
│   │
│   ├── components/
│   │   ├── Calendar/                # Heatmap calendar UI
│   │   ├── Chat/                    # AI assistant UI
│   │   ├── Sidebar/                 # Event settings, filters, results
│   │   ├── common/                  # Shared UI components
│   │   ├── AutoRegen.tsx            # Automatically regenerates results
│   │   └── Icons.tsx                # SVG icons
│   │
│   ├── context/
│   │   └── AppContext.tsx           # Global app state
│   │
│   ├── data/
│   │   ├── loader.ts                # Loads students from Excel
│   │   ├── parseCalendar.ts         # Parses academic-calendar.ics
│   │   └── synthetic.ts             # Synthetic data reference
│   │
│   ├── hooks/
│   │   ├── useGenerate.ts           # Runs the scheduling algorithm
│   │   └── useResults.ts            # Builds heatmap data
│   │
│   └── lib/
│       ├── ai.ts                    # AI assistant logic
│       ├── exportCsv.ts             # CSV export helper
│       ├── rooms.ts                 # Room recommendation logic
│       └── shims/                   # Browser shims for SDK dependencies
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/lunamaltseva/ScheduleWhen.git
cd ScheduleWhen
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at:

```text
http://localhost:5173/ScheduleWhen/
```

The `/ScheduleWhen/` path is used because the Vite base path is configured for GitHub Pages deployment.

---

## Available scripts

```bash
npm run dev
```

Starts the local Vite development server.

```bash
npm run build
```

Builds the production version into the `dist/` folder.

```bash
npm run preview
```

Serves the production build locally for preview.

---

## Data files

The application uses two main files from the `public/` folder.

### `Fall_2026_Students.xlsx`

This file contains student schedule data. It is loaded by the browser on startup and parsed in:

```text
src/data/loader.ts
```

The expected worksheet name is:

```text
Fall 2026 Students
```

Each student row is converted into a `Student` object with:

- anonymous student ID
- department
- study year
- international/domestic status
- class periods with day, start time, and end time

### `academic-calendar.ics`

This file contains academic calendar events. It is parsed in:

```text
src/data/parseCalendar.ts
```

The app detects:

- **no-classes** days
- **50-minute class** days
- other academic events

No-class days are blocked in the scheduler. 50-minute class days are handled with a compressed schedule.

---

## Generating the Excel dataset

The Excel dataset can be regenerated with the Python scripts.

Install Python dependencies:

```bash
pip install openpyxl
```

Run the generator:

```bash
python3 -m scripts.generate_students
```

This creates or updates:

```text
public/Fall_2026_Students.xlsx
```

---

## How the scheduling algorithm works

The main algorithm is located in:

```text
src/algorithm/score.ts
```

In simple terms, it works like this:

1. Select students who match the current filters.
2. Check which students are busy during possible event time windows.
3. Calculate how many selected students are free and likely to be on campus.
4. Apply scoring adjustments for time of day, lunch time, and student mix.
5. Return the best recommended time slots.

The algorithm considers:

- event duration
- selected days
- preferred time period: morning, afternoon, or evening
- target number of participants
- department/year/status filters
- academic calendar restrictions
- special 50-minute class days
- exact fixed time, if requested through the assistant

The result includes several suggestions, such as a Monday/Wednesday option, a Tuesday/Thursday option, and alternative slots.

---

## AI assistant

The AI assistant is optional. The app can still run without it.

The assistant is implemented in:

```text
src/lib/ai.ts
src/components/Chat/index.tsx
```

It can help users:

- understand why a time slot was recommended
- change event duration
- change selected days
- change time period preferences
- set target participants
- set a start date
- request an exact start time

To enable the assistant locally, create a `.env.local` file in the project root:

```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

Do not commit `.env.local` or any real API keys.

If no API key is provided, the chatbot will show a warning, but the rest of the application will continue working.

---

## Building for production

```bash
npm run build
```

The production files will be generated in:

```text
dist/
```

The current project builds successfully. During the build, Vite may show warnings related to Node.js modules from the Anthropic SDK. These warnings are not fatal, and the production build is still created.

---

## Deployment

The project is configured for GitHub Pages.

Important configuration:

```ts
// vite.config.ts
base: '/ScheduleWhen/'
```

Deployment is handled by GitHub Actions:

```text
.github/workflows/deploy.yml
```

On every push to the `main` branch, GitHub Actions installs dependencies, builds the app, and deploys the `dist/` folder to GitHub Pages.

For the AI assistant to work in production, add this repository secret in GitHub:

```text
VITE_ANTHROPIC_API_KEY
```

---

## Privacy notes

ScheduleWhen is designed to work with anonymized student data.

The app does not require student names. It only needs schedule-related information such as:

- anonymous student ID
- department
- study year
- course schedule
- international/domestic status if needed for filtering

All scheduling calculations happen in the browser.

---

## Contributors

This project was created as part of the AUCA AI Bootcamp / Hackathon.

See also:

```text
CONTRIBUTORS.md
```

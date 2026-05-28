# 🕑 ScheduleWhen

> Maximize participation in university events by finding times when the right
> students are most likely to be available.

ScheduleWhen is an AUCA-focused scheduling assistant for faculty and staff. It
uses student timetable data, academic calendar exceptions, audience filters,
and event requirements to recommend better event times before an announcement
or room request is made.
  
The current version is an MVP frontend prototype built by the AmISoft team.
It runs recommendation logic in the browser and is designed to be deployed to
the project's custom `.net` domain.

## ✨ Highlights

- Recommends event time windows based on student schedule availability.
- Filters the audience by department, year of study, and student status.
- Shows a calendar heatmap so users can inspect availability across the week.
- Accounts for academic calendar exceptions, including no-class days and
  50-minute schedule days.
- Suggests room groups by audience size and relevant department needs.
- Provides an AI assistant for adjusting event settings and explaining results.
- Exports recommendations and suggested rooms as a CSV file.
- Supports desktop and mobile layouts.

## ℹ️ Overview

Universities often schedule events without knowing whether the intended
students are free. ScheduleWhen helps reduce that guesswork. A user chooses the
event duration, target attendance, preferred days, time period, start date, and
audience filters. The app then recommends the strongest available time slots
and highlights alternatives.

The MVP does not book rooms or save events. It is a decision-support tool: it
helps a user decide when an event is likely to work best, then the final room
and schedule details should still be confirmed through the university process.

## 🧠 Recommendation Model

The current frontend uses a weighted scoring algorithm located in
`src/algorithm/score.ts`.

At a high level, the algorithm:

1. Loads student schedule data from `public/Fall_2026_Students.xlsx`.
2. Builds the eligible audience from the selected filters.
3. Evaluates possible event windows on the selected weekdays.
4. Estimates how many eligible students are on campus and free during each
   window.
5. Applies practical scoring adjustments for time of day, lunch gaps,
   undergraduate/postgraduate attendance patterns, 50-minute schedule days, and
   preferred time periods.
6. Returns primary recommendations and backup alternatives.

This approach is intentionally lightweight and explainable for an MVP. More
advanced optimization methods, such as CP-SAT or room-booking solvers, are
future backend work rather than part of the current frontend implementation.

## 🖥️ Usage

Typical flow:

1. Set event details: duration, target attendance, preferred days, time period,
   and starting date.
2. Add one or more filters for the intended student audience.
3. Generate recommendations.
4. Review the recommended slots, alternatives, availability heatmap, and room
   groups.
5. Ask the AI assistant for clarification or parameter changes.
6. Export the result as CSV when needed.

The assistant can help with questions like:

```text
Make it a 90-minute event.
Only consider Tuesday and Thursday afternoons.
Why is this time recommended?
I need around 40 participants.
```

## ⬇️ Installation

Requirements:

- Node.js 20+
- npm

Install dependencies and start the local dev server:

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🤖 AI Assistant Setup

The app works without an AI key, but assistant responses require an Anthropic
API key.

For local demo use, create `.env.local`:

```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

Security note: Vite exposes `VITE_` variables to browser code. The current AI
integration is suitable for a controlled prototype only. Before production, AI
requests should be routed through a backend endpoint so that API keys are not
sent to users' browsers.

## 📁 Project Structure

```text
src/
  algorithm/        Recommendation scoring and explanation logic
  components/       Sidebar, calendar, chat, and shared UI components
  context/          Global app state and reducer
  data/             Excel and academic calendar loaders
  hooks/            Recommendation generation and heatmap helpers
  lib/              AI integration, CSV export, room suggestions, shims
  App.tsx           App composition and responsive layout

public/
  Fall_2026_Students.xlsx
  academic-calendar.ics

scripts/
  generate_students.py
  course_data.py
  dept_data.py
```

## 🚀 Deployment

The repository includes a GitHub Pages workflow:

```text
.github/workflows/deploy.yml
```

The workflow runs on pushes to `main`, installs dependencies, builds the Vite
app, and deploys the `dist/` output.

The project is intended to be served through its custom `.net` domain. If the
domain is managed through GitHub Pages, remember to configure the Pages custom
domain settings and keep the Vite `base` path aligned with the deployment
target.

## 🗂️ Data Notes

- Student availability is calculated from the bundled Excel workbook.
- Academic calendar rules are parsed from the bundled `.ics` file.
- Room suggestions are category-based and do not check live room bookings.
- The app currently runs calculations client-side for MVP demonstration
  purposes.

In a production version, schedule data, room availability, authentication, and
AI calls should move behind a backend service.

## ⚠️ Disclaimer

For final scheduling confidence, confirm room and timetable details with the
Registrar's Office (Room 110).


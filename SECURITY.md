# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ScheduleWhen, please report it responsibly.

**Do not open a public GitHub issue for security reports.**

Instead, email **at13998@auca.kg** with the subject line `[SECURITY] ScheduleWhen — <brief description>`. We will acknowledge your report within 3 days and aim to resolve confirmed vulnerabilities within 7 days.

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce (or a proof-of-concept)
- Any suggested miigation, if you have one

We appreciate responsible disclosure and will credit reporters by name in release notes unless you prefer to remain anonymous.

---

## Scope

This policy covers the ScheduleWhen web application hosted at [schedulewhen.net](https://schedulewhen.net) and the source code in this repository.

Out of scope: third-party services this app depends on (GitHub Pages, Anthropic API, Cloudflare). Report those directly to their respective vendors.

---

## Student Data — Privacy Design

ScheduleWhen was built with student privacy as a primary constraint.

### Aggregation of data

The application works with **aggregated availability groups**. Students are never stored or transmitted as individuals. The underlying dataset is pre-processed at build time into anonymised cohort structures — e.g., "students in CS 3xx with a Tuesday 10:00–11:15 conflict." No name, student ID, email address, or any other personally identifiable information (PII) is present in the deployed application bundle.

The grouping granularity is chosen so that no individual can be singled out from a cohort. A student cannot be uniquely identified by combining group membership, schedule, or any other field accessible through the app.

### What the app stores

| Data | Where | Retention |
|------|-------|-----------|
| Your event parameters (duration, filters, target headcount) | Browser memory only | Cleared on page close |
| Chat messages with the AI assistant | Browser memory only | Cleared on page close |
| Anthropic API key (if self-hosted) | Build-time environment variable | Never logged or sent to any service other than Anthropic's API |

ScheduleWhen does not use cookies, does not set localStorage items, and does not send any analytics or telemetry.

### AI assistant

The chatbot sends your event specification and any filters you have set to Anthropic's API to generate recommendations. **No student-level data is included in these requests** — only the aggregated counts (e.g., "40 eligible students, 28 free") that appear on-screen. Review [Anthropic's privacy policy](https://www.anthropic.com/privacy) for how they handle API request data.

### API key exposure

The Anthropic API key is embedded in the client bundle at build time (a limitation of purely static deployment). If you are deploying a fork of this project, treat the key as potentially readable by any visitor. The recommended mitigation is to route API calls through a server-side proxy (e.g., a Cloudflare Worker) that holds the key server-side and enforces an origin allowlist.

---

## Supported Versions

This project is a single-version application; only the latest commit on `main` is actively maintained.

---

## Known Current Limitations

- No authentication: the application is intentionally public-facing with no login. This is by design — the scheduling tool is meant to be accessible to any event organiser at AUCA without friction.
- The static bundle may be cached by CDN edges. Revoked API keys should be rotated in the deployment environment; old bundles containing a previous key may remain cached for a short period.
- Content Security Policy headers are currently managed by GitHub Pages defaults. A future hardening step is to deploy via a platform that allows custom response headers.

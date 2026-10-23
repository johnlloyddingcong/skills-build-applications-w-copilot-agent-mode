# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep React components focused on rendering API data and loading, empty, and error states. Use the shared API client and relative `/api` paths; do not put persistence or business rules in the browser.
- Logic tier decision: Keep Express routes thin and place validation, orchestration, and response shaping in explicit service functions. Convert malformed input and missing references into deliberate 4xx responses rather than leaking Mongoose cast errors.
- Data tier decision: Put required fields, allowed values, and references in Mongoose schemas. Keep seed records stable and idempotent with upserts, preserving unrelated records.
- Activity tracking approach: Validate the activity type, positive minutes, and existing user and team before writing. Persist the references and submitted values with computed positive points and an occurrence timestamp.
- Team management approach: Require a non-empty name and mascot, validate submitted member IDs, and keep the returned team name, mascot, and members consistent with persisted data.
- Leaderboard approach: Aggregate activity points by team, sort totals from highest to lowest, and assign ranks starting at 1.
- Workout suggestions approach: Select suggestions using the user's fitness goal and recent activity, include a short reason, and return a deliberate 4xx response when the email does not identify a user.

## Test plan

- **Red baseline (2026-10-23)**: `npm test --prefix octofit-tracker/backend` reported 8 failed and 1 passed; the seed/idempotency test passed, while model validation and API behavior tests failed. `npm test --prefix octofit-tracker/frontend` reported 15 failed against the incomplete presentation scaffold.
- **Data tier**: `npm run test:data --prefix octofit-tracker/backend` checks schema validation and idempotent seeding. Failures identify model or seed behavior; a MongoMemoryServer startup failure is test infrastructure, not a contract assertion.
- **API tier**: `npm run test:api --prefix octofit-tracker/backend` checks request validation, persistence, leaderboard ordering, and workout recommendations. Failures identify route/service behavior or response-shape mismatches.
- **Presentation tier**: `npm test --prefix octofit-tracker/frontend` checks API-backed rendering, user-specific workout requests, and accessible loading, empty, and error states for each route.
- **Backend build**: `npm run build --prefix octofit-tracker/backend` checks TypeScript types and imports.
- **Frontend build**: `npm run build --prefix octofit-tracker/frontend` checks frontend types and production bundling.
- Run the data tests first, then API tests, then frontend tests; finish with both builds. After each implementation step, rerun its focused test command before moving to the next tier.

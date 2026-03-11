# Daily Pushup Counter

Daily Pushup Counter is a small mobile-first workout app for running quick pushup sets in the browser. It generates a challenge, gives you an audio countdown, keeps a local history of completed sets, and can schedule reminder notifications for the next check-in.

## What The App Does

- Starts a challenge flow from a simple home screen.
- Generates a random target between 5 and 10 reps.
- Starts the spoken `3, 2, 1, START` countdown directly from the challenge screen.
- Stores completed challenges locally in the browser.
- Shows recent history on-device.
- Lets the user switch between system, light, and dark themes.
- Supports optional push reminders every 30 minutes when the browser allows notifications and periodic background sync.

## Routes

- `/` home screen with the primary challenge entry point
- `/challenge` generated workout summary, large `GO` button, and audio-assisted countdown
- `/history` recent challenge history from `localStorage`
- `/settings` theme controls and reminder notification settings

## Tech Stack

- TanStack Start
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui primitives
- `easy-speech` for spoken countdown support

## Local Development

```bash
pnpm install
pnpm dev
```

The dev server runs on `http://localhost:3000`.

## Scripts

```bash
pnpm dev        # start local dev server
pnpm build      # production build
pnpm preview    # preview the production build
pnpm test       # run tests
pnpm lint       # run eslint
pnpm typecheck  # run TypeScript checks
pnpm format     # format TS/TSX/JS/JSX files
```

## Project Notes

- This project currently has no backend. Challenge history and user preferences are stored in the browser.
- Notification reminders depend on browser support for the Notification API, service workers, and periodic sync.
- Spoken countdown depends on speech synthesis support in the current browser/device.
- The workout catalog is currently limited to pushups, but the route and workout helpers are already structured for expansion.

## Build Status

The current project build succeeds with:

```bash
pnpm build
```

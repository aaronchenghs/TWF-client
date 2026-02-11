# Tiers! With Friends - Client

Frontend client for **Tiers! With Friends**, a real-time party game inspired by JackBox games.

Server repo: https://github.com/aaronchenghs/TWF-server

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in the project root:

```env
VITE_SOCKET_URL=http://localhost:3001
VITE_ENABLE_DEBUG_CONTROLS=false
```

3. Start the backend in `TWF-server` and allow this client origin in backend CORS config.
4. Start the frontend:

```bash
npm run dev
```

5. Open the URL shown by Vite (usually `http://localhost:5173`).

## Prerequisites

- Node.js (current LTS recommended)
- npm
- Git (required because this repo installs `@twf/contracts` from GitHub)
- Running TWF server instance

## Environment Variables

The app reads environment variables from `import.meta.env`:

| Variable                     | Required | Default                  | Description                                               |
| ---------------------------- | -------- | ------------------------ | --------------------------------------------------------- |
| `VITE_SOCKET_URL`            | No       | `window.location.origin` | Socket.IO server URL (example: `http://localhost:3001`).  |
| `VITE_ENABLE_DEBUG_CONTROLS` | No       | `false`                  | Enables debug controls only when set to exactly `"true"`. |

## Available Scripts

| Script              | What it does                                                               |
| ------------------- | -------------------------------------------------------------------------- |
| `npm run dev`       | Starts Vite dev server with hot reload.                                    |
| `npm run build`     | Runs TypeScript build (`tsc -b`) and outputs production assets to `dist/`. |
| `npm run preview`   | Serves the production build locally for verification.                      |
| `npm run lint`      | Runs ESLint.                                                               |
| `npm run lint:a11y` | Runs ESLint and fails on warnings (`--max-warnings=0`).                    |

## Local Development Workflow

1. Start the backend first.
2. Start the frontend with `npm run dev`.
3. In one browser tab, create a lobby (host flow).
4. In another tab or device, join with lobby code and player name.

## Build and Run Production Bundle

```bash
npm run build
npm run preview
```

Then open the preview URL printed in the terminal.

## Troubleshooting

- Cannot connect to socket server:
  Check `VITE_SOCKET_URL`, confirm backend is running, and verify backend Socket.IO/CORS settings.

- CORS error in browser:
  Backend must allow the exact client origin (for example `http://localhost:5173`) and support credentials.

- `npm install` fails around `@twf/contracts`:
  Ensure Git is installed and your machine has access to the GitHub repo referenced in `package.json`.

- Backend works on your machine but not on another device:
  Set `VITE_SOCKET_URL` to your LAN IP (for example `http://192.168.1.10:3001`) and run Vite with host binding:

```bash
npm run dev -- --host
```

## Tech Stack

- React + TypeScript
- Vite
- React Router
- Socket.IO client
- Redux Toolkit
- SCSS modules

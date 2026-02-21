# Tiers! With Friends - Client

Frontend client for **Tiers! With Friends**, a real-time party game inspired by JackBox games.

Server repo: https://github.com/aaronchenghs/TWF-server

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
# macOS/Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

3. Update `.env` values for your environment if needed.
4. Start the backend in `TWF-server` and allow this client origin in backend CORS config.
5. Start the frontend:

```bash
npm run dev
```

6. Open the URL shown by Vite (usually `http://localhost:5173`).

## Prerequisites

- Node.js (current LTS recommended)
- npm
- Git (required because this repo installs `@twf/contracts` from GitHub)
- Running TWF server instance

## Environment Variables

The app reads environment variables from `import.meta.env`:

Use `.env.example` as the canonical template for required/optional variables.

| Variable                     | Required | Default                  | Description                                               |
| ---------------------------- | -------- | ------------------------ | --------------------------------------------------------- |
| `VITE_SOCKET_URL`            | No       | `window.location.origin` | Socket.IO server URL (example: `http://localhost:3001`).  |
| `VITE_ENABLE_DEBUG_CONTROLS` | No       | `false`                  | Enables debug controls only when set to exactly `"true"`. |

## Available Scripts

| Script              | What it does                                                               |
| ------------------- | -------------------------------------------------------------------------- |
| `npm run dev`       | Starts Vite dev server with hot reload.                                    |
| `npm run host`      | Starts Vite bound to LAN (`0.0.0.0`) so phones/devices can connect.        |
| `npm run build`     | Runs TypeScript build (`tsc -b`) and outputs production assets to `dist/`. |
| `npm run preview`   | Serves the production build locally for verification.                      |
| `npm run lint`      | Runs ESLint.                                                               |
| `npm run lint:a11y` | Runs ESLint and fails on warnings (`--max-warnings=0`).                    |

## Local Development Workflow

1. Start the backend first.
2. Start the frontend with `npm run dev`.
3. In one browser tab, create a lobby (host flow).
4. In another tab or device, join with lobby code and player name.

## LAN / Phone Testing

Use this when testing from another device on your local network.

1. Start backend (`TWF-server`) and ensure your client origin is allowed:
   - Add it to `CLIENT_ORIGINS`, or
   - Keep `ALLOW_PRIVATE_NETWORK_ORIGINS=true` (recommended for LAN testing).
2. Start frontend with:

```bash
npm run host
```

3. Open the LAN URL shown by Vite (example: `http://192.168.0.72:5173`).
4. If the phone can load the site but joins time out, try leaving `VITE_SOCKET_URL` unset/blank so Vite proxies Socket.IO via the same origin (see `vite.config.ts`).

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
  Preferred: leave `VITE_SOCKET_URL` unset/blank so Vite proxies Socket.IO for LAN devices, then run:

```bash
npm run host
```

  Alternative: set `VITE_SOCKET_URL` to your LAN IP (for example `http://192.168.1.10:3001`).

- iPhone joins time out but desktop/other phones work:
  On the iPhone, go to `Settings > Wi-Fi > <your network>`, disable `Limit IP Address Tracking`, then retry.

## Tech Stack

- React + TypeScript
- Vite
- React Router
- Socket.IO client
- Redux Toolkit
- SCSS modules

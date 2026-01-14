# Tiers! With Friends — Client

## Overview

Frontend for **Tiers! With Friends**, a real-time tier-ranking party game. Hosts create lobbies; players join with a code and name. Communicates with the server over **socket.io**.

## Tech

- React + TypeScript
- Vite
- React Router
- socket.io-client
- SCSS Modules

## Prerequisites

- Node.js (LTS)
- npm

## Setup

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Local Dev Notes

Run the server in a separate terminal.
The server defaults to port 3001 and expects the client origin to be allowed via CORS.

Required .env variables are:

```sh
VITE_SOCKET_URL (default: 3001) - port the socket API is expected from
VITE_ENABLE_DEBUG_CONTROLS (default: false) - boolean, determines if the client is allowed to access debug controls
```

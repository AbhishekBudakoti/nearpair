# NearPair — Frontend
n[![CI](https://github.com/AbhishekBudakoti/nearpair/actions/workflows/ci.yml/badge.svg)](https://github.com/AbhishekBudakoti/nearpair/actions/workflows/ci.yml)

React + Vite single-page app for **NearPair**, an app for finding and matching with local activity partners — sports, hobbies, study buddies, anything you'd rather not do alone. This folder is the client; it talks to the Express/MongoDB API in `../Backend`.

## Stack

React 19, Vite, React Router 7, Tailwind CSS v4, Axios, Socket.IO client, Leaflet/`react-leaflet` (map view), Recharts (activity-history charts). Google Sign-In is loaded at runtime via Google's own `gsi/client` script — no Google npm package required.

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on Vite's default port with hot module reload. The backend (`../Backend`) must be running separately — see its own setup for details.

Create a `.env` in this folder with:

```
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=<your Google OAuth Client ID>
# optional — only needed when VITE_API_URL is a relative proxy path (production)
VITE_SOCKET_URL=http://localhost:3000
```

`VITE_API_URL` is required for the Axios client (`src/api/client.js`) to reach the backend. `VITE_GOOGLE_CLIENT_ID` is optional — the "Continue with Google" button only renders when it's set. `VITE_SOCKET_URL` is the backend origin for Socket.IO; if unset it's derived by stripping `/api` from `VITE_API_URL`, which is all local dev needs.

## Structure

```
src/
  api/          axios instance (withCredentials: true — auth is an httpOnly cookie)
  components/   shared UI: nav chrome, modals (incl. UserProfileModal), cards, chat window, auth layout, page banners
  context/      AuthContext (who's logged in) and SocketContext (real-time connection)
  pages/        one file per route, including an admin/ subfolder for the admin dashboard
  utils/        client-side helpers (password strength check, avatar image resizing)
```

Routing lives in `src/App.jsx`: public marketing/legal pages (Landing, About, Contact, Safety, FAQ, Privacy, Terms, Cookies, Login, Register) alongside a protected area (Profile, Discover, Requests, Sessions, History, Chat) gated by `ProtectedRoute`, with an `AdminRoute`-gated `/admin/*` section on top of that.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the project |

## Deployment

Deployed to Vercel; the backend is deployed separately on Render. `vercel.json` in this folder does two things:

1. Rewrites `/api/*` to the Render API (`https://nearpair.onrender.com/api/*`), so REST calls are same-origin and the httpOnly auth cookie is first-party — required for iOS Safari, which blocks third-party cookies.
2. Rewrites everything else to `index.html`, so client-side routing works on a hard refresh/direct link.

In Vercel's project settings, set `VITE_API_URL=/api` (the proxy path) and `VITE_SOCKET_URL` to the Render origin. Socket.IO can't go through the rewrite, so it connects to Render directly and authenticates with a short-lived token from `GET /api/auth/socket-token` instead of the cookie. The API's `GOOGLE_CLIENT_ID`/CORS origin must also be configured for the deployed frontend origin for login and Google Sign-In to work in production.

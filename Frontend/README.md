# NearPair — Frontend

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
```

`VITE_API_URL` is required for the Axios client (`src/api/client.js`) to reach the backend. `VITE_GOOGLE_CLIENT_ID` is optional — the "Continue with Google" button only renders when it's set.

## Structure

```
src/
  api/          axios instance (withCredentials: true — auth is an httpOnly cookie)
  components/   shared UI: nav chrome, modals, cards, auth layout, page banners
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

Deployed to Vercel; `vercel.json` in this folder rewrites all paths to `index.html` so client-side routing works on a hard refresh/direct link. The backend is deployed separately (Render) — `VITE_API_URL` in Vercel's project settings must point at that deployed API, and the API's `GOOGLE_CLIENT_ID`/CORS origin must in turn be configured for the deployed frontend origin for login and Google Sign-In to work in production.

# Waman Inspector — Angular

Tablet-first Angular 18 implementation of the Waman Inspector area. Components use
standalone APIs, lazy routes and separate TypeScript, HTML and SCSS files.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. The development proxy forwards `/api` directly to
`https://auth.waman.app`; use a valid Waman inspector account.

## Production build

```bash
npm run build
```

The deployable static application is generated in `dist/inspector-angular/browser`.
Configure the hosting fallback so unknown URLs return `index.html`, which is required
by Angular client-side routing.

## Routes

- `/login`, `/restore-password`, `/change-password`
- `/dashboard`, `/inspection-plan`, `/archive`
- `/inspection/:id/workers`, `/inspection/:id/declaration`, `/inspection/:id/report`
- `/info-box`, `/attendance-sheet`

## Architecture

- `core/services/inspection.service.ts` loads and saves live Waman data for every screen.
- `core/services/api.interceptor.ts` adds the Bearer token to Waman API requests.
- `core/guards/auth.guard.ts` protects the authenticated shell.
- `layout/shell` contains the shared top navigation and fixed footer.
- `shared` contains the common page header, branded data loader and signature dialog.

Authentication and all inspection workflows call `https://auth.waman.app/api` directly.
The token is kept in `sessionStorage`, never in `localStorage`, and is removed on logout,
401 responses, or when the browser tab session ends. No ASP.NET Inspector session or MVC
bridge is required.

## Hosting

Host the `dist/inspector-angular/browser` folder on a `*.waman.app` origin so it is
accepted by the API CORS policy. Configure the web server to:

- serve unknown application routes through `index.html`;
- serve the site over HTTPS;
- avoid caching `index.html` aggressively while allowing hashed assets to be cached.

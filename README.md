# Page Turner — Reading List App

A reading list manager built as a practice project to learn **TanStack Query v5** (server state, mutations, and optimistic updates) with **React**, **TypeScript**, and **Vite**.

---

## What This App Does

- View your reading list fetched from a fake local API server.
- Add new books (title + author).
- Change a book's reading status: `Want to read`, `Reading`, or `Done`.
- Rate books with a 5-star rating system.
- Remove books with an optimistic UI update and automatic rollback if the server fails.
- Simulate server errors using a toggle switch to test error handling and rollback behavior.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 19 | UI components |
| TypeScript | Type safety |
| Vite | Development server and build tool |
| TanStack Query v5 | Server state management, caching, and mutations |
| Tailwind CSS v4 | Styling |
| JSON Server | Fake REST API for local development |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the fake API server

The app reads and writes data to a local JSON Server running on port `3001`.

```bash
npm run api
```

> This watches `db.json` and simulates real server delays (800ms) and optional errors via a middleware.

### 3. Start the development server

In a **separate terminal**, run:

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run api` | Start the JSON Server fake API on port 3001 |
| `npm run build` | Build the app for production |
| `npm run lint` | Run Oxlint for code quality checks |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
src/
├── api.ts        # All fetch functions and query key factory
├── App.tsx       # Main app component with all queries and mutations
├── App.css       # Component styles
├── index.css     # Global styles (Tailwind import)
└── main.tsx      # App entry point with QueryClientProvider
```

---

## Key Concepts Practiced

- **`useQuery`** — Fetch and cache the book list from the server.
- **`useMutation`** — Add, update, and delete books on the server.
- **`invalidateQueries`** — Refetch the book list from the server after a change.
- **`setQueryData`** — Update the local cache instantly (optimistic updates) without waiting for the server.
- **`onMutate / onError / onSettled`** — Handle optimistic updates and rollback when a request fails.

---

## Simulating Server Errors

Toggle the **"Simulate server errors"** switch at the top of the app. When enabled, all write requests (add, update, delete, rate) will return a `500` error from the server. This lets you test:

- Error messages shown to the user.
- Rollback of optimistic updates (removed books reappear, ratings reset).

---

## Expanding the Oxlint Configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

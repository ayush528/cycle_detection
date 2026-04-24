# SRM Full Stack Engineering Challenge — BFHL

## Overview

A full-stack application that processes directed-graph edge strings (e.g. `"A->B"`) and returns a structured JSON response containing parsed hierarchies, detected cycles, duplicate/invalid entries, and a summary. Built for the Bajaj Finserv Health (BFHL) SRM challenge.

---

## Project Structure

```
bajaj/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server (POST /bfhl, GET /bfhl)
│   │   └── graphLogic.js     # Core graph-processing logic
│   ├── tests/
│   │   └── graphLogic.test.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main application component
│   │   ├── App.css
│   │   └── components/
│   │       ├── BadgeList.jsx
│   │       ├── HierarchyCard.jsx
│   │       ├── SummaryCards.jsx
│   │       └── TreeView.jsx
│   ├── public/
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Node.js, Express.js, CORS, dotenv       |
| Frontend | React 19, Vite, CSS3                    |
| Testing  | Jest, Supertest                         |

---

## Quick Start

### Prerequisites

- Node.js v18+
- npm v9+

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)
npm start
# API runs at http://localhost:3001
```

### 2. Frontend Setup (separate terminal)

```bash
cd frontend
npm install
npm run dev
# UI runs at http://localhost:5173
```

The Vite dev server proxies `/bfhl` requests to `http://localhost:3001` automatically.

---

## Environment Variables (`backend/.env`)

| Variable              | Description                          | Example              |
|-----------------------|--------------------------------------|----------------------|
| `PORT`                | Server port                          | `3001`               |
| `USER_ID`             | Your identity (`fullname_ddmmyyyy`)  | `johndoe_17091999`   |
| `EMAIL_ID`            | Your college email                   | `john@college.edu`   |
| `COLLEGE_ROLL_NUMBER` | Your roll number                     | `21CS1001`           |

---

## API Reference

### `POST /bfhl`

Processes an array of edge strings.

**Request**

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

**Response**

```json
{
  "user_id": "your_name_ddmmyyyy",
  "email_id": "your@college.edu",
  "college_roll_number": "YOUR_ROLL_NUMBER",
  "hierarchies": [
    {
      "root": "A",
      "tree": {
        "A": {
          "B": { "D": {} },
          "C": {}
        }
      },
      "depth": 3
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

**Full spec example** (mirrors the challenge fixture):

```bash
curl -X POST http://localhost:3001/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data":["A->B","A->C","B->D","C->E","E->F","X->Y","Y->Z","Z->X","P->Q","Q->R","G->H","G->H","G->I","hello","1->2","A->"]}'
```

Response shape includes:
- `hierarchies` — sorted: trees first (lex by root), then cycles
- `invalid_entries` — malformed or self-loop edges
- `duplicate_edges` — edges seen more than once (tracked once each)
- `summary.largest_tree_root` — root of the deepest tree (lex tie-break)

### `GET /bfhl`

Health check.

**Response:** `{"status": "ok"}`

---

## Running Tests

```bash
cd backend
npm test
```

12 tests, ~92% statement coverage. Coverage report saved to `backend/coverage/`.

---

## Deployment

### Backend (Render / Railway)

1. Connect your repo and set the root directory to `backend/`.
2. **Build command:** `npm install`
3. **Start command:** `npm start`
4. Add environment variables (`USER_ID`, `EMAIL_ID`, `COLLEGE_ROLL_NUMBER`, `PORT`) in the dashboard.
5. CORS is enabled for all origins — no extra config needed.

### Frontend (Vercel / Netlify)

1. Set the root directory to `frontend/`.
2. **Build command:** `npm run build`
3. **Output directory:** `dist`
4. If your backend is deployed separately, add a `VITE_API_URL` environment variable and update `vite.config.js` (or `fetch` calls) to point to it.

---

## Processing Rules Summary

- **Validation** — edges must match `^([A-Z])->([A-Z])$`; self-loops (`A->A`) are invalid.
- **Deduplication** — repeated identical edges are removed; the duplicate is recorded in `duplicate_edges` (tracked once per unique duplicate).
- **Diamond handling** — if a node already has a parent, any additional parent edge is silently discarded (first-parent wins).
- **Cycle detection** — components with no reachable root (pure cycles) or a back-edge during DFS are reported as `has_cycle: true` with an empty `tree`.
- **Depth** — the longest root-to-leaf path counted in nodes; used to determine `largest_tree_root`.
- **Ordering** — hierarchies sorted trees-first (alphabetical by root), cycles last; tie-breaking on `largest_tree_root` is lexicographic.

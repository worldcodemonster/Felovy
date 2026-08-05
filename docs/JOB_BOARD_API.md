# Felovy Job Board API

Integration guide for **felovy-search** (desktop scraper) to push scraped ATS jobs into Felovy's online PostgreSQL database and for clients to read them on [felovy.com/job-board](https://www.felovy.com/job-board).

---

## Base URL

| Environment | Base URL |
|-------------|----------|
| Production | `https://www.felovy.com/api/job-board` |
| Local dev | `http://localhost:3000/api/job-board` |

All endpoints are served by the Felovy Express app via Next.js catch-all: `pages/api/[...all].ts`.

---

## Authentication

### Ingest endpoints (write)

Requires a shared secret configured on the Felovy server as `JOB_BOARD_INGEST_KEY`.

Send **one** of:

```http
X-Job-Board-Key: your-secret-key
```

```http
Authorization: Bearer your-secret-key
```

If the key is missing or wrong → `401 Unauthorized`.  
If `JOB_BOARD_INGEST_KEY` is not set on the server → `503 Service Unavailable`.

### Read endpoints (list, filters, detail, health)

**Public** — no authentication required.

---

## Endpoints

### 1. Health check

```http
GET /api/job-board/health
```

**Response `200`**

```json
{
  "status": "ok",
  "service": "Felovy Job Board API",
  "totalJobs": 24993
}
```

---

### 2. Ingest jobs (felovy-search → Felovy)

```http
POST /api/job-board/ingest
Content-Type: application/json
X-Job-Board-Key: <JOB_BOARD_INGEST_KEY>
```

Accepts jobs in the same **snake_case** shape as felovy-search SQLite `UnifiedJob` rows.

#### Option A — single job (root object)

```json
{
  "job_id": "83",
  "board_token": "1010games",
  "ats": "bamboohr",
  "title": "Senior Technical Designer",
  "company_name": "1010games",
  "location_name": "Warrington, Cheshire",
  "absolute_url": "https://1010games.bamboohr.com/careers/83",
  "first_published": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-03-01T08:30:00.000Z",
  "content_html": "<p>Role description…</p>",
  "content_text": "Role description…",
  "departments_json": "[\"Engineering\"]",
  "offices_json": null,
  "metadata_json": null,
  "remote_status": "remote",
  "language": "en",
  "employment_type": "Full-Time",
  "country_code": "GB",
  "logo_url": "https://example.com/logo.png",
  "scraped_at": "2026-07-29T18:04:14.494Z",
  "seen_in_last_scrape": 1
}
```

#### Option B — wrapped single job

```json
{
  "job": { "...": "same fields as above" }
}
```

#### Option C — batch (recommended for sync)

```json
{
  "jobs": [
    { "job_id": "83", "board_token": "1010games", "ats": "bamboohr", "title": "…" },
    { "job_id": "84", "board_token": "1010games", "ats": "bamboohr", "title": "…" }
  ]
}
```

**Limits:** max **500** jobs per request.

**Required fields per job:**

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | string | External ATS job id |
| `board_token` | string | Company board slug |
| `ats` | string | Platform slug (e.g. `greenhouse`, `lever`, `bamboohr`) |

**Optional fields:** all other columns from felovy-search `jobs` table (see schema below).

**Upsert behavior:** jobs are keyed by `(ats, board_token, job_id)`. Re-sending the same triple **updates** the existing row.

**Response `201`**

```json
{
  "message": "Ingested 120 job(s) (45 created, 75 updated)",
  "created": 45,
  "updated": 75,
  "failed": 0,
  "errors": []
}
```

**Partial failure example `201`**

```json
{
  "message": "Ingested 9 job(s) (9 created, 0 updated)",
  "created": 9,
  "updated": 0,
  "failed": 1,
  "errors": ["Job 10: Each job requires ats, board_token, and job_id"]
}
```

**Errors**

| Status | Meaning |
|--------|---------|
| `400` | Invalid body or all jobs failed validation |
| `401` | Invalid/missing API key |
| `503` | Server ingest key not configured |

---

### 3. List jobs (public)

```http
POST /api/job-board/list
Content-Type: application/json
```

Same filter semantics as felovy-search `JobsQuery`.

**Request body (all optional)**

```json
{
  "title_q": "senior react",
  "title_mode": "AND",
  "content_q": "typescript node",
  "content_mode": "OR",
  "board_token_q": "stripe",
  "ats": "greenhouse",
  "remote_status": "remote",
  "region": "US",
  "posted_range": "7d",
  "updated_range": "all",
  "sort_by": "first_published",
  "sort_dir": "desc",
  "page": 1,
  "pageSize": 50
}
```

| Field | Values | Notes |
|-------|--------|-------|
| `title_mode` / `content_mode` | `AND`, `OR` | Space-separated terms |
| `region` | `US`, `EU`, `LATAM`, `OTHER`, omit/`ANY` | Inferred on ingest |
| `remote_status` | `remote`, `hybrid`, `onsite` | |
| `posted_range` / `updated_range` | `today`, `2d`, `3d`, `7d`, `15d`, `30d`, `all` | |
| `sort_by` | `title`, `company_name`, `location_name`, `first_published`, `source_updated_at`, `board_token`, `scraped_at` | |
| `pageSize` | 1–200 | Default `50` |

**Response `200`**

```json
{
  "items": [
    {
      "id": "uuid-internal-felovy-id",
      "ats": "greenhouse",
      "boardToken": "stripe",
      "externalJobId": "4741146002",
      "title": "Software Engineer",
      "companyName": "Stripe",
      "locationName": "San Francisco, CA",
      "absoluteUrl": "https://…",
      "firstPublished": "2026-01-15T10:00:00.000Z",
      "sourceUpdatedAt": "2026-03-01T08:30:00.000Z",
      "contentHtml": null,
      "contentText": null,
      "departmentsJson": "[\"Engineering\"]",
      "officesJson": null,
      "metadataJson": null,
      "remoteStatus": "remote",
      "language": "en",
      "employmentType": "Full-Time",
      "countryCode": "US",
      "region": "US",
      "logoUrl": "https://…",
      "scrapedAt": "2026-07-29T18:04:14.494Z",
      "seenInLastScrape": true
    }
  ],
  "total": 24993,
  "page": 1,
  "pageSize": 50
}
```

> **Note:** List responses use **camelCase** (Felovy API convention). Ingest payloads use **snake_case** (felovy-search convention).

---

### 4. Filter options

```http
POST /api/job-board/filters
Content-Type: application/json
```

**Response `200`**

```json
{
  "ats": ["ashby", "bamboohr", "greenhouse", "lever", "workday"]
}
```

---

### 5. Job detail

```http
POST /api/job-board/:id
Content-Type: application/json
```

`:id` = Felovy internal UUID from list `items[].id`.

**Response `200`**

```json
{
  "job": { "...full BoardJobRow including contentHtml/contentText..." }
}
```

**Response `404`** — job not found.

---

## Database mapping (felovy-search SQLite → Felovy PostgreSQL)

Felovy stores ingested jobs in table `board_jobs` (Prisma model `BoardJob`).

| felovy-search `jobs` column | Felovy `board_jobs` column |
|----------------------------|----------------------------|
| `job_id` | `external_job_id` |
| `board_token` | `board_token` |
| `ats` | `ats` |
| `title` | `title` |
| `company_name` | `company_name` |
| `location_name` | `location_name` |
| `absolute_url` | `absolute_url` |
| `first_published` | `first_published` |
| `updated_at` | `source_updated_at` |
| `content_html` | `content_html` |
| `content_text` | `content_text` |
| `departments_json` | `departments_json` |
| `offices_json` | `offices_json` |
| `metadata_json` | `metadata_json` |
| `remote_status` | `remote_status` |
| `language` | `language` |
| `employment_type` | `employment_type` |
| `country_code` | `country_code` |
| *(computed on ingest)* | `region` |
| `logo_url` (from board) | `logo_url` |
| `scraped_at` | `scraped_at` |
| `seen_in_last_scrape` | `seen_in_last_scrape` |
| — | `id` (UUID, Felovy internal) |

**Unique key:** `(ats, board_token, external_job_id)`

---

## felovy-search integration example (Node / fetch)

```typescript
const FELOVY_INGEST_URL = 'https://www.felovy.com/api/job-board/ingest';
const FELOVY_INGEST_KEY = process.env.JOB_BOARD_INGEST_KEY!;

async function pushJobsToFelovy(jobs: UnifiedJob[]) {
  const CHUNK = 200;
  for (let i = 0; i < jobs.length; i += CHUNK) {
    const slice = jobs.slice(i, i + CHUNK);
    const res = await fetch(FELOVY_INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Job-Board-Key': FELOVY_INGEST_KEY,
      },
      body: JSON.stringify({ jobs: slice }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Ingest failed (${res.status}): ${err.message ?? res.statusText}`);
    }
    const result = await res.json();
    console.log(result.message, result.errors);
  }
}
```

### Suggested sync strategy

1. After each scrape batch (or on a timer), read new/updated rows from local SQLite.
2. POST in chunks of 100–200 jobs to `/api/job-board/ingest`.
3. Use the natural key `(ats, board_token, job_id)` — duplicates are safe (upsert).
4. Optionally call `GET /api/job-board/health` before sync to verify connectivity and total count.

---

## Felovy web UI

| URL | Description |
|-----|-------------|
| `/job-board` | Public job board (white theme, table UI similar to felovy-search) |
| `/job-board/:id` | Job detail with description + external apply link |

Navbar link: **Job Board** (next to Jobs).

---

## Server setup checklist

1. Add to Felovy `.env` (and Vercel env vars):
   ```env
   JOB_BOARD_INGEST_KEY=<generate-a-long-random-secret>
   ```
2. Apply database schema:
   ```bash
   npx prisma db push
   ```
3. Deploy Felovy.
4. Configure the same `JOB_BOARD_INGEST_KEY` in felovy-search (env or settings).
5. Test:
   ```bash
   curl -s https://www.felovy.com/api/job-board/health
   curl -s -X POST https://www.felovy.com/api/job-board/ingest \
     -H "Content-Type: application/json" \
     -H "X-Job-Board-Key: YOUR_KEY" \
     -d '{"job_id":"test-1","board_token":"demo","ats":"greenhouse","title":"Test Role"}'
   ```

---

## TypeScript types (shared)

Felovy exports types in `src/lib/board-job-types.ts`:

- `BoardJobIngestPayload` — ingest request job shape (snake_case)
- `BoardJobIngestRequest` — `{ job }` or `{ jobs }`
- `BoardJobIngestResult` — ingest response counters
- `BoardJobListQuery` — list filters
- `BoardJobRow` — list/detail response item (camelCase)

Copy this file into felovy-search or import via a shared package for type-safe clients.

---

## Changelog

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-08-06 | Initial job board ingest + list API |

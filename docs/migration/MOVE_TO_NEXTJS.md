I’ll assume:

* Backend = **FastAPI**
* Frontend = **Next.js**
* Current state = FastAPI serves HTML + CSS + routes

---

# TARGET ARCHITECTURE (LOCK THIS IN YOUR HEAD)

```
/backend   → FastAPI (API only)
/frontend  → Next.js (UI only)
```

**Rule**:
FastAPI never returns HTML.
Next.js never touches the database.

If you violate this, your architecture is trash.

---

# STEP 1 — FREEZE FEATURES

Before touching anything:

* ❌ No new features
* ❌ No refactors
* ✅ Only migration

If you keep “improving things” mid-migration, you’ll never finish.

---

# STEP 2 — CONVERT FASTAPI INTO A PURE API

### 2.1 Kill template rendering

Delete:

* `Jinja2Templates`
* `TemplateResponse`
* `static/` serving for frontend

❌ This:

```python
return templates.TemplateResponse("index.html", {...})
```

✅ Becomes:

```python
return {"data": result}
```

---

### 2.2 Namespace your API (NON-NEGOTIABLE)

If you don’t version now, you’ll regret it.

```python
@app.get("/api/v1/users")
def users():
    return {"users": [...]}
```

Everything is under `/api/v1/*`.

---

### 2.3 Normalize responses

Frontend needs **predictability**.

Bad:

```json
{"users": [...]}
```

Good:

```json
{
  "success": true,
  "data": [...],
  "error": null
}
```

You are defining a **contract**, not hacking endpoints.

---

# STEP 3 — AUTH: PICK ONE OR PAY LATER

## Option A (recommended for you): JWT in headers

Simpler. Less foot-guns.

### Backend

```python
Authorization: Bearer <token>
```

### Frontend

* store token in memory or secure storage
* attach to every request

If you store JWT in `localStorage` **without understanding XSS**, that’s on you.

---

## Option B: HTTP-only cookies (harder, safer)

* cookie domain issues
* CSRF protection
* SameSite config

If you don’t already know this, **don’t start here**.

---

# STEP 4 — CREATE NEXT.JS FRONTEND (CORRECTLY)

```bash
npx create-next-app@latest frontend
```

Choose:

* App Router ✅
* TypeScript ✅
* ESLint ✅

If you skip TypeScript, you’re sabotaging yourself.

---

# STEP 5 — FRONTEND PROJECT STRUCTURE (DO NOT IMPROVISE)

```
frontend/
  app/
    layout.tsx
    page.tsx
    login/
      page.tsx
  lib/
    api.ts        ← fetch wrapper
    auth.ts
  components/
  types/
```

If your API calls are scattered across components, that’s amateur hour.

---

# STEP 6 — API FETCH LAYER (MANDATORY)

### `lib/api.ts`

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  })

  if (!res.ok) throw new Error("API error")
  return res.json()
}
```

**All requests go through this. No exceptions.**

---

# STEP 7 — DATA FETCHING STRATEGY (DON’T GUESS)

### Use Server Components by default

```ts
const data = await apiFetch("/api/v1/users")
```

Use Client Components ONLY when:

* forms
* interactivity
* browser APIs

If you turn everything into `"use client"`, you failed.

---

# STEP 8 — CORS (YOU WILL HIT THIS)

FastAPI:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Production ≠ localhost.
You **must** change this later.

---

# STEP 9 — ROUTING MAPPING (EXPLICIT)

Old FastAPI route:

```
/dashboard
```

New Next.js:

```
app/dashboard/page.tsx
```

Old FastAPI logic:

* move to `/api/v1/dashboard`
* fetch from Next.js

If you try to keep routes mirrored automatically, you’re overengineering.

---

# STEP 10 — STATIC ASSETS

### Before

FastAPI served:

* CSS
* images
* JS

### After

Next.js owns:

* `/public`
* styling
* fonts

Backend never sees CSS again. Ever.

---

# STEP 11 — DEPLOYMENT (SEPARATE OR DIE)

### Backend

* Docker
* Fly.io / Railway / VPS

### Frontend

* Vercel (recommended)
* or Node server

They deploy independently.
If frontend deployment breaks backend, your setup is wrong.

---

# COMMON FAILURE POINTS (THIS IS WHERE PEOPLE QUIT)

### 🔥 “I’ll just keep some HTML in FastAPI”

No. That’s cowardice.

### 🔥 “Auth used to be easy”

Yes. Now it’s correct.

### 🔥 “Why is everything more complex?”

Because you upgraded from a toy stack to a real one.

---

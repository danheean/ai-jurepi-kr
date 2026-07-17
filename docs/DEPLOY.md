# Deployment Guide — ai.jurepi.kr (Cloudflare Workers)

**Deployment Model:** Server runtime via OpenNext + Cloudflare Workers. Frontend is static SSG; backend is serverless Node.js-compatible runtime.

---

## Overview

- **Runtime:** Cloudflare Workers + OpenNext (`@opennextjs/cloudflare@1.20.1`)
- **Server Entry:** `.open-next/worker.js` (compiled from Next.js app routes)
- **Deployment Method:** Git-based (CF Pages Workers Builds) or manual (`wrangler deploy`)
- **Configuration:** `wrangler.jsonc` + `open-next.config.ts`
- **Secrets:** `GEMINI_API_KEY` (server-only, never client bundle)
- **KV Storage:** `RATE_LIMIT_KV` (optional, recommended for production)

---

## Build Process (Local)

### Prerequisites
```bash
Node.js v22+, pnpm v9+
Cloudflare account with Workers enabled
Custom domain ai.jurepi.kr configured in jurepi.kr zone
```

### Local Build
```bash
cd /Users/jurepi/Work/Jurepi-Company/ai.jurepi.kr

# Install dependencies
pnpm install

# Type check (gate 1)
pnpm typecheck

# Next.js build (gate 2) - generates static HTML + SSG pages
pnpm build

# OpenNext build (gate 3) - creates .open-next/worker.js
pnpm cf:build
```

**Output:**
```
.next/                    # Next.js build artifacts
├── server/              # Middleware + server routes (not used; OpenNext compiles)
├── static/              # Static assets
├── public/              # robots.txt, sitemap.xml, manifest.webmanifest

.open-next/              # ★ CRITICAL: OpenNext output for Workers
├── worker.js            # Server entry point (compiled from src/app/api/**)
├── static/              # Static assets (CSS, JS, public files)
├── cache/               # ISR cache (dummy, unused)
└── cloudflare-templates/
    └── worker.js        # Template (used by wrangler)
```

---

## Local Preview

### Option 1: wrangler dev (Recommended for Testing)
```bash
# Terminal 1: Start wrangler dev
pnpm exec wrangler dev

# This reads .dev.vars for GEMINI_API_KEY
# Runs on http://localhost:8787
# Proxies to .open-next/worker.js
```

### Option 2: opennextjs-cloudflare preview
```bash
pnpm preview
```

### Test Local Server
```bash
# In another terminal:
curl -I http://localhost:8787/ko
# Expected: 200 OK + HTML

# Test API endpoint (after implementation)
# curl -X POST http://localhost:8787/api/hairstyle/analyze \
#   -H "Content-Type: application/json" \
#   -d '{"image": "..."}'
```

**⚠️ Local Testing Caveats:**
- `.dev.vars` provides `GEMINI_API_KEY` locally (not committed)
- KV binding uses local `wrangler` preview (real CF KV requires production deployment)
- Rate limiting falls back to in-memory per-isolate (weaker than CF KV)

---

## Production Deployment

### Model 1: Git-Based (CF Pages Workers Builds) — RECOMMENDED

**Setup (One-time):**

1. **Create Cloudflare KV Namespace** (if using rate-limit KV):
   ```bash
   wrangler kv:namespace create "RATE_LIMIT_KV" --preview false
   # Output: Successfully created namespace with ID: xxxxxxxx
   ```
   Store the ID in `wrangler.jsonc` under `kv_namespaces[0].id`.

2. **Configure GitHub Repository Secrets:**
   In `danheean/ai-jurepi-kr` repo settings → Secrets:
   - `GEMINI_API_KEY` = your Gemini API key
   - `CLAUDE_API_KEY` = future Claude key (optional)
   - `CLOUDFLARE_ACCOUNT_ID` = your CF account ID
   - `CLOUDFLARE_API_TOKEN` = your CF API token (with Workers permissions)

3. **Configure Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Pages → Create project → GitHub repo `danheean/ai-jurepi-kr`
   - Build settings:
     - **Framework preset:** None
     - **Build command:** `pnpm install && pnpm cf:build`
     - **Build output directory:** `.open-next/dist` (or `.open-next`)
     - **Environment variables (non-secret):**
       - `AI_PROVIDER=gemini`
       - `HAIRSTYLE_RATE_LIMIT_PER_MIN=10`
       - `NEXT_PUBLIC_SITE_URL=https://ai.jurepi.kr`
   - Environment variables (secret):
     - `GEMINI_API_KEY` (from GitHub Secrets)
     - `CLAUDE_API_KEY` (from GitHub Secrets)
   - Custom domain: `ai.jurepi.kr` (zone: `jurepi.kr`)

4. **Deploy Workflow:**
   - `git push main` → CF Pages detects push
   - CF runs build command: `pnpm install && pnpm cf:build`
   - `.open-next/worker.js` compiled + deployed to edge
   - ~2-5 minutes until live on `https://ai.jurepi.kr`

---

### Model 2: Manual Deploy (wrangler CLI)

```bash
# 1. Ensure local build is fresh
pnpm cf:build

# 2. Set secrets (one-time per key rotation)
wrangler secret put GEMINI_API_KEY
# Paste your API key, press Ctrl+D to confirm

# 3. Update wrangler.jsonc with KV namespace IDs (if using KV)
# Edit wrangler.jsonc:
# "kv_namespaces": [
#   { "binding": "RATE_LIMIT_KV", "id": "xxxxx", "preview_id": "yyyyy" }
# ]

# 4. Deploy
wrangler deploy

# Output: Deployed to https://ai-jurepi-kr.danheean.workers.dev (or custom domain)
```

---

## Deployment Verification Checklist

After deployment goes live:

### 1. Health Checks
```bash
# Home page (SSG, should be 200)
curl -I https://ai.jurepi.kr/ko
# Expected: HTTP/2 200, Content-Type: text/html

# Locale redirect
curl -I https://ai.jurepi.kr/en
# Expected: HTTP/2 200

# Static assets
curl -I https://ai.jurepi.kr/_next/static/...
# Expected: HTTP/2 200 + cache headers
```

### 2. API Endpoint Test (after route handler implementation)
```bash
# Test analyze endpoint (mock image for now)
curl -X POST https://ai.jurepi.kr/api/hairstyle/analyze \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}' \
  -w "\nStatus: %{http_code}\n"

# Expected response structure:
# { "ok": true, "data": {...}, "error": null }
# or
# { "ok": false, "data": null, "error": { "code": "...", "message": "..." } }
```

### 3. Security Headers
```bash
curl -I https://ai.jurepi.kr/ko | grep -E "^(strict-transport|x-content|x-frame|referrer|permissions|csp)"

# Expected (app layer should set these):
# strict-transport-security: max-age=31536000; includeSubDomains
# x-content-type-options: nosniff
# x-frame-options: DENY
# referrer-policy: strict-origin-when-cross-origin
# content-security-policy: default-src 'self'; script-src 'self' ...
```

### 4. Secret Verification (No Leaks)
```bash
# Ensure GEMINI_API_KEY is NOT in client bundle
curl https://ai.jurepi.kr/_next/static/chunks/main-*.js | grep -i "GEMINI_API_KEY"
# Expected: No match (empty output)

# Verify in environment (server logs, if available)
# Should NOT appear in:
# - HTML <script> tags
# - JavaScript source maps
# - Error messages sent to client
```

### 5. Rate Limiting Test
```bash
# Make 11 rapid requests (limit is 10/min by default)
for i in {1..11}; do
  curl -X POST https://ai.jurepi.kr/api/hairstyle/analyze \
    -H "Content-Type: application/json" \
    -d '{}' \
    -w "Request $i: %{http_code}\n" \
    -s -o /dev/null
done

# Expected: first 10 → 200/400 (depending on impl), 11th → 429 (RATE_LIMITED)
# Response for 429:
# { "ok": false, "error": { "code": "RATE_LIMITED", "message": "..." } }
```

### 6. Cloudflare Dashboard Checks
- **Workers Analytics:** Check request count, errors, P50/P95 latency
- **KV Namespace:** Verify rate-limit keys are being written (if using KV)
- **Error Logs:** Look for startup errors (missing `GEMINI_API_KEY`, etc.)

---

## Rollback / Recovery

### If Deployment Fails

**Git-Based (CF Pages):**
1. Check CF Pages build logs: [Dashboard](https://dash.cloudflare.com) → Pages → Build History
2. Review errors (usually TS compilation, missing env, or build script failure)
3. Fix issue locally, commit, push → automatic redeploy

**Manual (wrangler):**
1. Check `wrangler deploy` output for errors
2. Roll back: `git revert <commit>` → `pnpm cf:build` → `wrangler deploy`

### If Secrets Are Exposed

1. **Immediate:** Regenerate API key in Gemini console
2. **Update secrets:**
   - GitHub: Update repository secret `GEMINI_API_KEY`
   - Cloudflare: `wrangler secret put GEMINI_API_KEY` (local deploy) OR re-trigger CF Pages build
3. **Audit:** Check CF Logs for any unauthorized API calls with old key

---

## Environment Variables Reference

### Public Variables (in wrangler.jsonc `vars`)
| Variable | Example | Notes |
|---|---|---|
| `AI_PROVIDER` | `gemini` | Controls provider selection (server-only) |
| `HAIRSTYLE_RATE_LIMIT_PER_MIN` | `10` | Requests per minute per IP for `/api/hairstyle/*` |
| `NEXT_PUBLIC_SITE_URL` | `https://ai.jurepi.kr` | Canonical domain (public, safe) |

### Secrets (set via wrangler or CF Dashboard)
| Variable | Example | How to Set |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSy...` | `wrangler secret put GEMINI_API_KEY` OR CF Dashboard |
| `CLAUDE_API_KEY` | `sk-...` | Same (future provider) |

### KV Binding
| Binding | Usage | How to Create |
|---|---|---|
| `RATE_LIMIT_KV` | Cross-isolate rate-limit storage | `wrangler kv:namespace create "RATE_LIMIT_KV"` → store ID in wrangler.jsonc |

---

## Monitoring & Logs

### Cloudflare Workers Analytics
- **Dashboard:** [Workers Analytics](https://dash.cloudflare.com/workers/overview)
- **Metrics:** Request count, error rate, latency (P50/P95), CPU time
- **Alerts:** Set up alerts for error rate > 5% or latency > 5s

### Application Logging
- **Ephemeral Input Guarantee:** Logs MUST NOT include user-uploaded images or raw input data
- **Safe to log:**
  - Request count, aggregated error codes (RATE_LIMITED, VALIDATION_ERROR, etc.)
  - Latency metrics, provider response times
  - Feature usage (e.g., "analyze endpoint called 150 times today")
- **Never log:**
  - Image binary data or base64 samples
  - User text input
  - API keys or sensitive credentials
  - Full request/response bodies (only metadata)

### Error Rates to Watch
- `VALIDATION_ERROR`: Check if input validation is too strict or client is malformed
- `RATE_LIMITED`: May indicate bot activity; escalate if sustained
- `AI_UNAVAILABLE`: Provider downtime or missing API key at runtime
- `INTERNAL`: Unhandled exceptions; investigate in error logs

---

## Troubleshooting

### Build Fails: `next build` Step
```
Error: Cannot find module 'next-intl'
```
**Solution:** Run `pnpm install` to fetch all dependencies.

### Build Fails: OpenNext Compile
```
Error: Wrapper cloudflare-node and converter aws-apigw-v2 are not compatible
```
**Solution:** Ensure `open-next.config.ts` has `converter: 'edge'` (not `aws-apigw-v2`).

### Deploy Fails: Missing GEMINI_API_KEY
```
Error: GEMINI_API_KEY is not configured
```
**Solution:** 
- Local: Add to `.dev.vars` (not committed)
- Production (Git): Set `GEMINI_API_KEY` in GitHub repository secrets
- Production (manual): `wrangler secret put GEMINI_API_KEY`

### Home Page 500 Error
```
Symptoms: curl https://ai.jurepi.kr/ko → HTTP/2 500
```
**Debugging:**
1. Check CF Workers error logs (Dashboard → Workers → Tail)
2. Likely causes:
   - Missing `NEXT_PUBLIC_SITE_URL` environment variable
   - i18n routing misconfiguration
   - CSS/font loading issue
3. Local test: `pnpm dev` → `http://localhost:3000` to confirm works locally

### API Endpoint 404
```
curl https://ai.jurepi.kr/api/hairstyle/analyze → 404
```
**Solution:**
- Confirm route handler exists: `src/app/api/hairstyle/analyze/route.ts`
- Confirm `.open-next/worker.js` was regenerated: `pnpm cf:build`
- Confirm deployment is fresh: check CF Pages build timestamp

### KV Not Persisting Rate Limits
```
Symptoms: Rate-limit resets after each request (no cross-isolate persistence)
```
**Solution:**
1. Confirm KV binding is active: `wrangler deploy --dry-run` shows `RATE_LIMIT_KV`
2. Confirm namespace ID is correct in `wrangler.jsonc`
3. Fallback (acceptable for MVP): Use per-isolate in-memory bucket (less reliable but functional)

---

## Performance Targets (Post-Deployment)

After successful deployment, verify performance via Lighthouse or WebPageTest:

| Metric | Target | Tool |
|---|---|---|
| LCP | < 2.5s | Lighthouse, CrUX |
| FCP | < 1.5s | Lighthouse |
| INP | < 200ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| JS Bundle (landing) | < 150kb gzipped | Lighthouse |
| Time to Interactivity | < 3s | Lighthouse |

**Test from different locations:**
- Use [WebPageTest](https://www.webpagetest.org) with "Dallas" or "Tokyo" for geographic variance
- Check CF Analytics: Requests from different countries should have low latency

---

## Summary: Deployment Checklist

- [ ] Local build: `pnpm cf:build` succeeds, `.open-next/worker.js` exists
- [ ] Wrangler config valid: `wrangler deploy --dry-run` shows correct bindings
- [ ] Secrets configured:
  - GitHub: `GEMINI_API_KEY` set in repository secrets
  - Local: `.dev.vars` has test key (not committed)
  - Cloudflare: Via Dashboard or `wrangler secret put`
- [ ] KV namespace created + ID in `wrangler.jsonc`
- [ ] Custom domain `ai.jurepi.kr` added to zone `jurepi.kr` in CF
- [ ] Build command in CF Pages: `pnpm install && pnpm cf:build`
- [ ] Deployment: `git push main` → CF Pages auto-deploys OR `wrangler deploy`
- [ ] Verification:
  - [ ] `curl -I https://ai.jurepi.kr/ko` → 200
  - [ ] No `GEMINI_API_KEY` in client bundle
  - [ ] API endpoints return proper ApiEnvelope (once implemented)
  - [ ] Rate-limiting enforced (11th request → 429)
  - [ ] Security headers present
- [ ] Monitoring:
  - [ ] CF Workers Analytics dashboard
  - [ ] Error logs monitored for secrets leaks
  - [ ] Lighthouse scores verified

---

## Contacts & Escalation

| Issue | Responsible | Action |
|---|---|---|
| Next.js build errors | Platform Engineer | Review `next.config.ts`, dependencies, env setup |
| OpenNext/wrangler errors | Deploy Engineer | Review `open-next.config.ts`, `wrangler.jsonc` |
| AI provider errors (502) | AI Integration Engineer | Verify `GEMINI_API_KEY`, provider implementation |
| Rate-limit not working | Platform Engineer | Check `src/lib/rate-limit.ts`, KV binding |
| Secrets exposed | All | Rotate keys immediately, audit logs |

---

**Last Updated:** 2026-07-17  
**Deploy Engineer:** Claude (Haiku 4.5)

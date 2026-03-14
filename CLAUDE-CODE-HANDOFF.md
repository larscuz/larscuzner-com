# Claude Code Handoff

## Project summary

This repository is the new `larscuzner.com` site and backend. It started as a WordPress recovery workspace, but now has:

- a separate backend/admin at `/admin`
- a public front end at `/`, `/works`, `/works/[slug]`, `/info`, and `/info/[slug]`
- a composer-driven content model stored in the CMS workspace
- imported published and unpublished WordPress content

The old downloaded WordPress files are source material only and live outside this repo.

## Source data already obtained

Original exports used for reconstruction:

- SQL dump: `/Users/larscuzner/Desktop/larscuzner-com/larscuzner_com.sql`
- WordPress XML export: `/Users/larscuzner/Desktop/larscuzner-com/arscuzner.WordPress.2026-03-14.xml`

Important findings already confirmed:

- root site permalink structure: `/%postname%/`
- root active theme from DB: `fmovies`
- root active plugins in DB: `jetpack`, `kirki`
- separate legacy `/blog` install exists

## Current architecture

### Public site

- Homepage: `/Users/larscuzner/Desktop/next-frontend/src/app/page.tsx`
- Works index: `/Users/larscuzner/Desktop/next-frontend/src/app/works/page.tsx`
- Works detail: `/Users/larscuzner/Desktop/next-frontend/src/app/works/[slug]/page.tsx`
- Info index: `/Users/larscuzner/Desktop/next-frontend/src/app/info/page.tsx`
- Info detail: `/Users/larscuzner/Desktop/next-frontend/src/app/info/[slug]/page.tsx`
- Shared public renderer: `/Users/larscuzner/Desktop/next-frontend/src/components/site/public-entry-shell.tsx`

### Backend

- Admin index: `/Users/larscuzner/Desktop/next-frontend/src/app/admin/page.tsx`
- Admin entry editor: `/Users/larscuzner/Desktop/next-frontend/src/app/admin/entry/[id]/page.tsx`
- Login: `/Users/larscuzner/Desktop/next-frontend/src/app/login/page.tsx`
- Auth helpers: `/Users/larscuzner/Desktop/next-frontend/src/lib/server/auth.ts`
- Middleware: `/Users/larscuzner/Desktop/next-frontend/middleware.ts`

### Editor system

- Block schema: `/Users/larscuzner/Desktop/next-frontend/src/lib/editor-schema.ts`
- Composer UI: `/Users/larscuzner/Desktop/next-frontend/src/components/cms/entry-composer.tsx`
- Block renderer: `/Users/larscuzner/Desktop/next-frontend/src/components/cms/site-block-renderer.tsx`

Supported block types:

- `text`
- `media`

Supported media modes:

- `image`
- `video`
- `embed`

Notes:

- direct MP4/WebM URLs render as `<video>`
- YouTube/Vimeo links render as iframe embeds
- arbitrary website embeds only work when the target site allows iframing

### Persistence

- Workspace store: `/Users/larscuzner/Desktop/next-frontend/src/lib/server/workspace-store.ts`
- Public site helpers: `/Users/larscuzner/Desktop/next-frontend/src/lib/server/public-site.ts`
- Seed script: `/Users/larscuzner/Desktop/next-frontend/scripts/seed-workspace.mjs`
- MySQL sync script: `/Users/larscuzner/Desktop/next-frontend/scripts/sync-workspace-to-mysql.mjs`
- MySQL schema: `/Users/larscuzner/Desktop/next-frontend/db/mysql-cms-schema.sql`

Current storage modes:

- `file` for local/dev and current Vercel testing
- `mysql` scaffolded but not production-final

Important deployment warning:

- Vercel + `file` storage is not durable
- One.com MySQL is not a good direct production target for Vercel access
- next serious step is moving persistence to a Vercel-friendly hosted database

## What was just built

1. Root route changed from migration dashboard to actual front end.
2. Backend remains under `/admin`.
3. Published content is browseable as site content.
4. Public entries render through the new block composer document instead of raw WordPress HTML alone.
5. README was rewritten to describe the real project.

## Recommended next tasks

1. Replace file-based CMS persistence with a durable hosted database.
2. Add asset upload workflow instead of URL-only media boxes.
3. Add richer text controls in the composer toolbar.
4. Add homepage curation controls so featured works/pages are editorial, not hardcoded by helper logic.
5. Add SEO fields per entry:
   - meta title
   - meta description
   - OG image
   - canonical URL
6. Add redirect management for old WordPress slugs and alternate legacy routes.
7. Decide whether to migrate legacy `/blog` into the public site or keep it archived.
8. Add preview/draft sharing behavior.

## Verification state

Verified locally before handoff:

- `npm run seed-workspace`
- `npm run build`
- `npm run lint`

## User intent to preserve

- backend-first build, but this repo will hold both backend and frontend
- do not depend on WordPress long-term
- preserve WordPress-derived structure and content where possible
- design direction should feel closer to the bold editorial feel of the reference site, not generic SaaS

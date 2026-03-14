# Claude Code Handoff

## Project summary

This repository is the new `larscuzner.com` site and backend. It started as a WordPress recovery workspace, but now has:

- a separate backend/admin at `/admin`
- a public front end at `/`, `/works`, `/works/[slug]`, `/info`, and `/info/[slug]`
- a composer-driven content model stored in the CMS workspace
- a first page-builder document for the homepage
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
- Homepage front-end editor: `/Users/larscuzner/Desktop/next-frontend/src/components/site/homepage-editor.tsx`
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
- Homepage/page schema: `/Users/larscuzner/Desktop/next-frontend/src/lib/site-page-schema.ts`
- Composer UI: `/Users/larscuzner/Desktop/next-frontend/src/components/cms/entry-composer.tsx`
- Block renderer: `/Users/larscuzner/Desktop/next-frontend/src/components/cms/site-block-renderer.tsx`
- Front-end entry editor: `/Users/larscuzner/Desktop/next-frontend/src/components/site/frontend-entry-editor.tsx`

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
- Site document store: `/Users/larscuzner/Desktop/next-frontend/src/lib/server/site-documents.ts`
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
5. Logged-in front-end editing now exists for entry pages.
6. A first homepage page-builder document now exists, with front-end section selection, section editing, reorder, add/remove, and responsive preview modes.

## Current front-end editing status

### Entry pages

Logged-in editing works on:

- `/works/[slug]`
- `/info/[slug]`
- `/site/[kind]/[slug]`

Capabilities:

- click block to select
- inline text editing
- media editing
- media library picker
- add/remove/reorder blocks
- save without leaving the page

### Homepage

The homepage now has its own editable document in:

- `/Users/larscuzner/Desktop/next-frontend/src/data/workspace/site-documents.json`

Editable homepage section types currently:

- `hero`
- `featuredWork`
- `entryPoints`
- `pagesSpotlight`
- `recentWorks`

Capabilities:

- click section to select
- edit section text in a side panel
- reorder sections
- enable/disable sections
- add/remove sections
- responsive viewport switcher: desktop/tablet/mobile

Current limitation:

- homepage sections are editable as structured sections, but not every nested visual sub-element is independently clickable yet in the Wix sense
- works/info index pages are still rendered from React code, not page documents
- global header/footer are not yet page-builder documents
- featured homepage work now has an explicit editor-level post selector in the `featuredWork` section schema, so it no longer has to rely on whatever post sorts first

## Recommended next tasks

1. Replace file-based CMS persistence with a durable hosted database.
2. Convert `/works` and `/info` index pages into page-builder documents like the homepage.
3. Convert global header/footer into editable global documents.
4. Add nested element selection so titles, labels, buttons, and sub-copy within homepage sections can be clicked directly instead of only selecting the parent section.
5. Add asset upload workflow instead of URL-only media boxes.
6. Add richer text controls in the composer toolbar.
7. Extend homepage curation controls beyond the featured work selector:
   - featured pages
   - recent works source rules
   - optional multi-slot featured works
8. Add SEO fields per entry:
   - meta title
   - meta description
   - OG image
   - canonical URL
9. Add redirect management for old WordPress slugs and alternate legacy routes.
10. Decide whether to migrate legacy `/blog` into the public site or keep it archived.
11. Add preview/draft sharing behavior.

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

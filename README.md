# larscuzner-com

Custom Next.js website and editorial backend for `larscuzner.com`, rebuilt from the exported WordPress database and XML snapshot.

## What exists now

- Public front end at `/`, `/works`, `/works/[slug]`, `/info`, and `/info/[slug]`
- Backend/admin at `/admin`
- Visual block composer with text and media boxes
- Media boxes support:
  - images
  - direct video files
  - YouTube/Vimeo URLs
  - embeddable websites
- WordPress recovery data imported into a writable CMS workspace
- Unpublished content available inside admin

## Main paths

- Public homepage: `/src/app/page.tsx`
- Works index: `/src/app/works/page.tsx`
- Info index: `/src/app/info/page.tsx`
- Public entry shell: `/src/components/site/public-entry-shell.tsx`
- Admin entry composer: `/src/components/cms/entry-composer.tsx`
- Editor schema: `/src/lib/editor-schema.ts`
- Workspace persistence: `/src/lib/server/workspace-store.ts`
- Public site helpers: `/src/lib/server/public-site.ts`
- WordPress recovery snapshot: `/src/data/generated/wordpress-recovery.json`
- Editable workspace seed: `/src/data/workspace/editorial-workspace.json`

## Local development

```bash
npm run dev
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/works`
- `http://localhost:3000/info`
- `http://localhost:3000/admin`

## Scripts

```bash
npm run ingest
npm run seed-workspace
npm run build
npm run lint
```

## Environment variables

For local admin auth:

```env
ADMIN_PASSWORD=your-password
ADMIN_SESSION_SECRET=your-random-secret
CMS_STORE_PROVIDER=file
```

## Important deployment note

`CMS_STORE_PROVIDER=file` works for local development and UI validation, but it is not durable storage on Vercel. The next production-grade step is moving editable CMS persistence to a Vercel-friendly hosted database.

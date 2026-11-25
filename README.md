# Cribwise web

Cribwise is the student housing app by Evolvaer. The first local milestone is a read-only comparison using fictional data.

Run with Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open [the local sample comparison](http://localhost:3000/c/demo). The home page and walkthrough are at `/` and `/how-it-works`. The appearance control offers System, Light and Dark.

`npm run typecheck` validates TypeScript and `npm run build` builds the production application. The workspace shares public comparison types and design tokens between packages.

## Private groups

The group UI lives at `/groups`. It requires a Supabase project before account creation, invitations, or shared group comparisons can operate.

1. Create a Supabase project for Cribwise and enable email authentication.
2. Apply [the private groups migration](infra/migrations/001_private_groups.sql) to that project.
3. Copy `apps/web/.env.example` to `apps/web/.env.local`, then set the project URL and publishable key. The publishable key is intended for browser use. Keep secret or service-role keys out of this file.
4. Restart the web server.

Group comparisons are stored in a separate table guarded by membership-based row-level security. They are not served by the public comparison route or public API. Group invitations are single use and expire after seven days.

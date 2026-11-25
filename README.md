# Cribwise web

Cribwise is the student housing app by Evolvaer. It includes fictional sample comparisons and a browser-local flow for creating your own.

Run with Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open [the local sample comparison](http://localhost:3000/c/demo). The home page and walkthrough are at `/` and `/how-it-works`. The appearance control offers System, Light and Dark.

Use `/create` to enter two places and `/my-comparisons` to reopen drafts. On the creation form, paste a public listing URL and choose **Extract details** to fill details that the page exposes, such as its name, area, weekly rent, bills, room type, and contract length. Check and edit the extracted facts before saving. Starting prices and ambiguous rent figures remain blank. Drafts stay in the current browser and are not published through the public comparison route or API.

Open a draft and choose **Edit comparison** to correct its details or retry extraction from a listing link. Saving updates that draft in place.

Drafts can include up to eight listing photos per place. You can remove extracted photos or add photo links manually. A draft also calculates rent across the full contract where both weekly rent and contract length are known. You can save a private choice and an optional reason, then update or clear it later.

`npm run typecheck` validates TypeScript and `npm run build` builds the production application. The workspace shares public comparison types and design tokens between packages.

## Private groups

The group UI lives at `/groups`. It requires a Supabase project before account creation, invitations, or shared group comparisons can operate.

1. Create a Supabase project for Cribwise and enable email authentication.
2. Apply [the private groups migration](infra/migrations/001_private_groups.sql) to that project.
3. Copy `apps/web/.env.example` to `apps/web/.env.local`, then set the project URL and publishable key. The publishable key is intended for browser use. Keep secret or service-role keys out of this file.
4. Restart the web server.

Group comparisons are stored in a separate table guarded by membership-based row-level security. They are not served by the public comparison route or public API. Group invitations are single use and expire after seven days. Owners can remove members, which revokes their database access to group comparisons.

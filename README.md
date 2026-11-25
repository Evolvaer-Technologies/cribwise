# Cribwise web

Cribwise is the student housing app by Evolvaer. The first local milestone is a read-only comparison using fictional data.

Run with Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open [the local sample comparison](http://localhost:3000/c/demo). The home page and walkthrough are at `/` and `/how-it-works`. The appearance control offers System, Light and Dark.

`npm run typecheck` validates TypeScript and `npm run build` builds the production application. The workspace shares public comparison types and design tokens between packages.

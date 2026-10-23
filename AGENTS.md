# quest-n-click-site — notes for an AI assistant

Read `README.md` first: it says what the site is, where its data comes from and how to run it.

- The engine's content is never copied here. Anything about the engine (features, numbers, commands) is read from
  GitHub or from the documentation archive at run time; if a text has to be written by hand, keep it free of numbers.
- Both languages move together: every string lives in `messages/en.ts` and `messages/fr.ts` (typed against `Messages`).
- The documentation's Markdown markers are documented in `lib/docs/markdown.ts`; test any change to the pipeline
  against a local archive (`QNC_DOCS_SOURCE=$(npm run -s docs:fetch)`).
- After a change: `npm run lint && npm run typecheck && npm run build && npm run test:e2e`, then look at the pages
  (`node scripts/screenshots.mjs`).

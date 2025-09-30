# Zustand Migration Summary

## Scope

- Migrated legacy React Context state to Zustand slices: AI, Chat/Subtitle, Media (ads/laundry/bg), VAD settings, Proactive speak, Group.
- Stabilized WebSocket handler side-effects using refs and precise selectors to avoid render loops.
- Default startup now shows advertisements; wake-word toggles ads and conversation correctly; laundry tutorial hides ads during playback.

## Key Changes

- `src/renderer/src/store/index.ts` becomes the single source of truth. Added/expanded actions for media, chat, proactive, etc. Enabled devtools/persist/immer.
- `websocket-handler.tsx` rewired to Zustand; removed cross-provider writes; minimized dependencies; added refs.
- Providers: flattened provider chain; retained only adapters that still provide APIs (e.g., `bgurl-context`, `chat-history-context`, `group-context`).
- Ads: `AdCarousel` now restarts audio monitoring and local VAD when visible; coordinates with backend adaptive VAD.

## Legacy Clean-up

- Commented legacy contexts (left for reference; scheduled removal):
  - `context/ai-state-context.tsx`
  - `context/subtitle-context.tsx`
  - `context/advertisement-context.tsx`
  - `context/laundry-context.tsx`
- Removed stale imports and references.

## Developer Notes

- Prefer using `useAppStore` selectors or exported `use*Store` helpers, not context.
- When adding effects that set store state, use refs to stabilize callbacks and avoid dependency churn.
- For ads: playlist is fetched via MCP tool messages; ensure backend provides `advertisement_playlist`.

## Verification

- Startup shows ads; wake-word transitions to conversation; "goodbye" returns to ads; laundry tutorial hides ads; settings open without errors.

## Next

- After a release cycle, delete the commented legacy files.


# Legacy Files Commented (Zustand Migration)

These files are fully commented out because their responsibilities were migrated to Zustand. They remain only for reference and will be deleted in a future cleanup.

- src/renderer/src/context/ai-state-context.tsx
  - Reason: AI operational state moved to `useAiStore`.
  - Notes: File is wrapped in a block comment with a LEGACY header.

- src/renderer/src/context/subtitle-context.tsx
  - Reason: Subtitle text/visibility moved to `useChatStore`.
  - Notes: Entire file content wrapped in a block comment with a LEGACY header.

- src/renderer/src/context/advertisement-context.tsx
  - Reason: Advertisement visibility and data moved to `useMediaStore` and `AdCarousel`.
  - Notes: Entire file commented out.

- src/renderer/src/context/laundry-context.tsx
  - Reason: Laundry mode/video/machines moved to `useMediaStore`.
  - Notes: Entire file commented out.

Safe to keep (Zustand-backed adapters still in use):
- src/renderer/src/context/bgurl-context.tsx
- src/renderer/src/context/chat-history-context.tsx
- src/renderer/src/context/group-context.tsx

Removal plan:
- Keep for one release cycle; if no regressions, delete the commented legacy files.

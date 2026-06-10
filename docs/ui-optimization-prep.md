# UI Optimization Prep

## Goal

Prepare Diary Vault for a focused visual and UX overhaul without weakening local archive reliability.

## Current Baseline

- The app is a React + Vite local-first diary tool backed by `server.js` HTTP APIs.
- Recent work added a better welcome page, virtualized timeline, cleaned typography controls, local inline text styling, and a stable textarea-based entry editor.
- The editor still uses Markdown plus inline HTML rather than a full rich text document model.
- The most important remaining UX problems are editor polish, reader polish, image handling, service failure states, and consistent visual language.

## Reference Directions

- iA Writer: focus, calm writing, low-friction text editing.
- Bear: Markdown-oriented writing with attractive themes and approachable organization.
- Day One: diary-specific memory browsing, dates, places, media, and long-term recall.
- Readwise Reader: dense reading workflow, search, and information triage.
- Raycast: precise tool UI, quick actions, small delightful interactions.
- Craft: document hierarchy and refined page treatment, without copying its collaboration-heavy model.

These are references for quality and interaction ideas, not templates to clone.

## Tool Decisions

- Keep Tailwind and local CSS as the main styling layer.
- Keep `@tanstack/react-virtual` only for long archive surfaces.
- Do not add Radix yet. Use it later only if select, popover, dialog, tooltip, or floating menu behavior becomes too costly to maintain.
- Do not add Paged.js yet. Current pagination should keep improving unless print-grade CSS paged media becomes a hard requirement.
- Do not add Tiptap or Lexical yet. Current Markdown inline styling can cover basic local formatting. Reassess when cross-paragraph selection, toolbar active states, undo history, or style inheritance becomes mandatory.

## Recommended Next Phases

1. Visual Foundation
   - Normalize design tokens in CSS.
   - Define dark workspace, paper surface, accent, border, focus, and text roles.
   - Restore visible scroll affordances for long content.
   - Make controls consistently sized.

2. Editor Workbench
   - Improve top toolbar labels, grouping, and selected-text controls.
   - Add a proper split resizer instead of tiny percentage buttons.
   - Improve preview framing, zoom, and page navigation.
   - Add clear invalid-selection feedback for inline styles.

3. Reader And Page Polish
   - Rework reader chrome around the page.
   - Improve page shadows, background, page controls, and image treatment.
   - Add better empty states and loading states.

4. Timeline Refinement
   - Add year/month density controls.
   - Add stronger search feedback and result counts.
   - Consider tags/locations as secondary filters only if useful with real data.

5. Entry Reliability
   - Add explicit archive state machine: idle, analyzing, ready, saving, saved, failed.
   - Improve service connection failure UI.
   - Keep OCR issue hints outside the main textarea unless a robust editor layer is introduced.

## Open Technical Checks

- Confirm all visible Chinese text is correct in browser, despite PowerShell showing mojibake.
- Decide whether unused Electron IPC code should be aligned or removed later.
- Audit all POST endpoints against CORS methods in `server.js`.
- Decide whether local fonts should be copied into the repo or managed outside source control for long-term size control.

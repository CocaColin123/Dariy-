# Diary Vault Redesign Modification Plan

This plan is intentionally staged. The redesign should not be a single large visual rewrite.

## Phase 0: Design Foundation

Goal: establish shared primitives before page rewrites.

Tasks:

- Create new surface tokens for paper, ink, workbench, archive accent, annotation, danger, and status.
- Create typography roles for cover title, entry title, diary body, UI label, metadata, and mono/date text.
- Create motion tokens for enter, exit, tactile press, page change, save confirmation, and reduced motion.
- Define responsive breakpoints and decide whether narrow editor is tabbed or explicitly desktop-only.

Verification:

- Tokens cover Welcome, Reader, Editor, Timeline, Entry, Export, Settings, and AI.
- No page requires a one-off color system to express the new direction.

## Phase 1: Editor Paper-First Rebuild

Goal: fix the highest-friction workflow and the A4 preview problem.

Tasks:

- Replace the current dense top toolbar with a minimal top bar: back, title, save state, save action.
- Introduce editor modes: Write, Preview, Layout.
- Make the preview container own the A4 page fit calculation.
- Ensure the current A4 page fits fully inside the preview viewport by default.
- Keep page navigation visible inside the preview container at all times.
- Add keyboard page navigation.
- Move selected-text styling into a contextual floating toolbar.
- Move layout parameters into an inspector shown only in Layout mode.
- Separate destructive delete from frequent save and formatting controls.

Verification:

- User can change preview page without scrolling.
- User can see the full current A4 page in the editor preview.
- User can identify whether they are writing, previewing, or adjusting layout.
- Save state is visible.
- Delete is not adjacent to common formatting actions.

## Phase 2: Welcome As Editorial Cover

Goal: replace dashboard entry with a beautiful emotional cover.

Tasks:

- Remove above-the-fold dashboard statistics, recent cards, and year distribution.
- Create a cover-like composition using title, date/page motif, paper/ink surface, and negative space.
- Keep one clear primary action to record a diary entry.
- Add subtle entrance or paper-light motion.
- Move recent entries/statistics to Archive or below the fold only if needed.

Verification:

- The page does not tell the user what to do beyond offering entry.
- The primary action is visible and direct.
- The page feels calmer and more beautiful than useful.
- It does not look like a dashboard.

## Phase 3: Timeline Archive Redesign

Goal: turn the archive from a card wall into a memory browser.

Tasks:

- Replace default identical card grid with an editorial archive layout.
- Emphasize year and month rhythm.
- Use title, date, excerpt, and search hits as the main content hierarchy.
- Reduce tag noise by collapsing or moving tags into secondary treatment.
- Keep virtualization if needed, but make estimated heights match the new layout.
- Add search result highlighting and clear empty states.

Verification:

- Month rhythm is visible at a glance.
- Search results show why an entry matched.
- The timeline does not feel like a dashboard grid.
- Long titles and long excerpts degrade gracefully.

## Phase 4: Entry Flow Rebuild

Goal: make recording text primary and AI secondary.

Tasks:

- Make paste/edit area the dominant first object.
- Show parsed metadata as a review step, not a separate card pile.
- Convert AI analysis into suggestions that can be accepted, ignored, or inspected.
- Keep confirmation state clear: what will be saved, where, and with what title/date.
- Make archive failure visible with recovery steps.

Verification:

- User can paste and save without looking at AI.
- AI suggestions do not hide the text.
- The user can review exactly what will be archived.
- Failure does not lose pasted text.

## Phase 5: Reader, Export, Panels Alignment

Goal: bring secondary surfaces into the same visual system.

Tasks:

- Keep the reader paper focus but make controls more elegant and less dashboard-like.
- Align Export with archive selection language, not generic checklist language.
- Redesign API and AI panels using the workbench surface system.
- Remove tiny low-contrast labels where they control repeated workflows.

Verification:

- Reader and editor feel like two states of the same paper system.
- Export scope and status are obvious.
- AI panel is helpful but visually secondary.
- Settings do not dominate the app identity.

## Phase 6: Motion And Polish

Goal: add life without reducing readability.

Tasks:

- Add page-change motion in editor preview.
- Add save confirmation motion.
- Add search-hit reveal.
- Add tactile button press states.
- Add reduced-motion fallback.
- Remove remaining decorative or low-value animation.

Verification:

- Motion helps orientation.
- No continuous decorative animation competes with reading.
- Reduced-motion users get stable transitions.

## Recommended Implementation Order

1. Phase 0 tokens and responsive decision.
2. Phase 1 editor rebuild.
3. Phase 2 Welcome cover.
4. Phase 3 Timeline archive.
5. Phase 4 Entry flow.
6. Phase 5 secondary surfaces.
7. Phase 6 motion polish.

Reasoning:

The editor contains the clearest functional defect: the A4 page is not fully visible and page navigation requires extra scrolling. Fixing it first establishes the paper-first model that the rest of the app can follow.

## Out Of Scope For First Pass

- changing diary file format,
- replacing Markdown storage,
- adding collaborative features,
- building a full mobile editor if desktop-only is chosen for now,
- heavy 3D or generated visual scenes,
- redesigning AI behavior beyond presentation and review flow.

## Definition Of Done For The Redesign

- Welcome feels like an editorial cover, not a dashboard.
- Editor shows the full current A4 page and page controls without scroll.
- Timeline reads as an archive, not a card grid.
- Entry flow centers pasted text and confirmation.
- Reader and editor share the same paper language.
- AI and settings are visually secondary.
- Tests and build pass.
- Desktop screenshots are visually checked.
- Narrow-width behavior is either usable or explicitly unsupported.

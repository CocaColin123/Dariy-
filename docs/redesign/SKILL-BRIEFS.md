# Diary Vault Redesign Skill Briefs

This file defines what each design-related skill should optimize for during the redesign.

All skills should treat `docs/redesign/ART-DIRECTION.md` as the main source of truth.

## Shared Constraints

- Start from the new direction. Do not preserve the old dark-dashboard design by default.
- Welcome is an emotional cover page, not a dashboard.
- Editor is paper-first. A4 preview must fit fully and page controls must always be visible.
- Timeline should not be an identical card grid.
- AI should be a secondary suggestion layer.
- Prioritize Chinese long-text reading and editing.
- Avoid generic AI SaaS visuals.

## ui-ux-pro-max

Use for design reference searches and rule extraction.

Recommended query families:

- `private diary archive editorial magazine reading writing tool`
- `editorial grid magazine literary archive`
- `magazine editorial typography literary`
- `micro-interactions tactile feedback product tool`
- `animation accessibility motion`

Prefer these search results:

- Editorial Grid / Magazine,
- Swiss Modernism 2.0,
- Micro-interactions,
- light Anti-Polish / Raw Aesthetic.

Do not blindly accept:

- generic SaaS product demo patterns,
- dashboard patterns,
- AI-native purple chat patterns,
- heavy 3D or skeuomorphic patterns,
- portfolio masonry as the main archive model.

Expected output from this skill:

- visual references and rationale,
- typography and color candidates,
- motion rules,
- anti-pattern checklist.

## frontend-design

Use for creative UI implementation direction once the design brief is accepted.

The aesthetic commitment:

> Personal editorial archive: magazine structure, paper-first reading, precise workbench controls, small human traces, controlled motion.

Implementation priorities:

- create a distinctive cover-like Welcome page,
- turn the editor into a paper-first workbench,
- use strong typographic hierarchy,
- use editorial asymmetry without harming usability,
- reduce card sameness,
- make controls feel tactile but restrained.

Avoid:

- Inter-only generic SaaS look,
- purple gradients,
- glass panels as the main idea,
- large repeated cards,
- dense horizontal toolbars,
- decorative animation that competes with writing.

## impeccable

Use for critique, audit, polish, layout, typeset, colorize, adapt, and animate passes.

Register:

- product, because design serves writing, reading, editing, and archiving.

For critique:

- score whether Welcome is beautiful and emotionally quiet,
- check whether editor A4 preview is fully visible,
- check whether page navigation requires scrolling,
- check whether timeline still feels like a card wall,
- check whether AI is visually over-dominant,
- check cognitive load in editor and entry flows.

For audit:

- check focus states,
- check contrast on paper and dark workbench surfaces,
- check small targets,
- check keyboard access for page navigation,
- check reduced-motion support,
- check narrow-screen behavior.

For polish:

- tune typography,
- tune page shadows and paper edges,
- tune motion timing,
- remove low-value microcopy,
- reduce visual noise.

## imagegen

Use only if bitmap assets become useful.

Possible uses:

- subtle paper texture,
- scanned paper edge,
- archive stamp texture,
- cover background material.

Do not use image generation for:

- icons,
- logos,
- primary UI structure,
- readable text,
- anything that should remain vector, CSS, or live editable UI.

Generated texture must not reduce text contrast or pagination predictability.

## Manual Design Rules For All Skills

### Welcome

One composition, one primary entry action, no dashboard widgets above the fold.

### Editor

Full A4 page visible, fixed page navigation, mode-based controls, contextual text toolbar.

### Timeline

Archive rhythm before card density. Search should reveal memory, not just filter boxes.

### Entry

Paste and confirmation first. AI suggestions second.

### Reader

Preserve paper focus. Surrounding controls should recede.

### Export

Selection scope and output status must be obvious. Avoid making export look like a generic checklist page.

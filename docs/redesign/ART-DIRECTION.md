# Diary Vault Redesign Art Direction

## Core Direction

Diary Vault should become a **personal editorial archive**.

It is not a dashboard, CMS, admin console, or generic AI writing tool. It should feel like a private archive of authored pages: part literary magazine, part paper desk, part local personal vault.

The stable center is:

- paper,
- ink,
- date,
- title,
- margin,
- excerpt,
- archive rhythm,
- calm entry into writing.

The product may support light and dark surfaces, but the identity is not "night mode". Dark surfaces are a workbench option. Paper and editorial composition are the identity.

## Influences To Blend

### 1. Editorial Grid / Magazine

Use this as the main visual grammar.

- asymmetric page grids,
- large titles and dates,
- strong typographic contrast,
- pull-quote style excerpts,
- issue/section-like archive rhythm,
- generous negative space,
- deliberate page margins.

This direction should replace the current dashboard-card feel.

### 2. Swiss Modernism 2.0

Use this as the structural discipline.

- strict alignment,
- modular spacing,
- clear hierarchy,
- high contrast,
- restrained decoration,
- precise controls.

This prevents the magazine style from becoming loose or ornamental.

### 3. Micro-Interactions

Use motion as functional punctuation.

- page changes,
- save confirmation,
- search hit reveal,
- selected-text toolbar appearance,
- month navigation,
- AI suggestion reveal,
- archive selection feedback.

Motion should be short, contextual, and quiet. Avoid continuous decorative animation.

### 4. Light Anti-Polish / Human Trace

Use this sparingly.

- subtle paper texture,
- scanned edge feeling,
- annotation marks,
- archive stamp motifs,
- ink-like accent details.

Do not turn the product into a scrapbook or hand-account template.

## Visual Positioning

Recommended phrase:

> A paper-first personal editorial archive.

Alternative short labels:

- 私人文学档案编辑台
- 纸上杂志感的私人档案工作台
- Personal Editorial Archive

Avoid:

- 夜间 dashboard,
- AI SaaS cockpit,
- generic dark cards,
- glassmorphism panels,
- hand账模板,
- Word-like ribbon editor.

## Color System

Use two surface families.

### Paper Surfaces

For reading, page preview, export, and any moment where the diary text is the subject.

- warm paper,
- off-white ivory,
- soft cream,
- ink black,
- warm graphite,
- muted red or blue annotations.

Paper should feel readable before it feels decorative.

### Workbench Surfaces

For navigation, archive browsing, editor chrome, AI, and settings.

- graphite,
- deep neutral,
- desaturated blue-gray,
- muted archive green,
- restrained old-gold or oxidized red accents.

Workbench surfaces must support the paper, not compete with it.

### Accent Rules

- Use one main accent per view.
- Use red only for danger, correction, or annotation.
- Use blue/green only for search, metadata, or status when it helps recognition.
- Avoid purple AI gradients.
- Avoid pure black and pure white as large surfaces.

## Typography

Chinese diary content is the priority.

### Diary Body

Use a readable Chinese Song/Ming style body face with complete coverage.

Candidates:

- Noto Serif SC,
- Source Han Serif / 思源宋体,
- SimSun as system fallback,
- KaiTi only for selected title or expressive treatment, not default body.

### UI Text

Use a calm Chinese sans face for controls.

Candidates:

- Noto Sans SC,
- Microsoft YaHei,
- Source Han Sans / 思源黑体.

### Editorial Display

Use sparingly for cover-like moments and English labels.

`ui-ux-pro-max` surfaced these usable directions:

- Libre Bodoni / Public Sans for magazine-like title contrast,
- Cormorant Garamond / Libre Baskerville for literary mood,
- Newsreader-like editorial structure for long-form reading.

For Chinese UI, do not let Latin display fonts dominate the product.

## Welcome Page Direction

The welcome page is not a dashboard.

Its role is emotional entry:

1. look beautiful,
2. slow the user down,
3. provide one direct way to start recording a diary entry.

Above the fold, avoid:

- archive statistics as the main content,
- recent-entry card lists,
- year distribution charts,
- instructional copy,
- feature explanations,
- dashboard-like widgets.

Required above the fold:

- one strong visual composition,
- one clear primary action for diary entry,
- a calm title/date/page motif,
- enough negative space to feel breathable.

The page should not tell the user what to do. It should invite presence.

Primary action examples:

- 录入日记
- 写一页
- 开始这一页

Recent entries and statistics may exist below the fold or inside the archive page, but they must not dominate the welcome page.

Guiding rule:

> If the welcome page starts to look useful, check whether it has stopped being beautiful.

## Editor Direction

The editor is a paper-first workbench.

Non-negotiable:

- The current A4 page must fit inside the preview viewport without requiring vertical scroll.
- Page navigation must stay visible at all times.
- The user must be able to change page without scrolling.
- Ordinary writing must not expose low-level layout controls.

The editor should separate:

- Write: text editing is primary.
- Preview: paper is primary.
- Layout: paper stays visible while layout controls appear.

Do not place all editor controls in one horizontal toolbar.

Selected text styling should appear as a contextual floating toolbar near the selection.

## Timeline Direction

The timeline is not a card wall.

It should emphasize:

- year rhythm,
- month rhythm,
- entry titles,
- memorable excerpts,
- search hits,
- density changes over time.

Avoid identical two-column card grids as the default archive browser.

## Motion Direction

Motion should break stiffness without becoming decoration.

Use:

- 150-300ms UI transitions,
- shorter 50-120ms tactile feedback for buttons,
- smooth page transition for preview page changes,
- search hit reveal,
- save confirmation,
- AI suggestion reveal.

Avoid:

- looping decorative animation,
- scroll-jacking,
- heavy parallax,
- bouncing UI,
- motion that prevents reading.

Respect reduced-motion preferences.

## Acceptance Tests

The redesign is on direction only if:

- Welcome feels like a beautiful cover, not a dashboard.
- The editor preview shows the full current A4 page without scrolling.
- Page navigation is always visible in the editor preview.
- Reading and editing feel visually related.
- The timeline reads like an archive, not a grid of cards.
- AI is helpful but not visually dominant.
- The interface feels calmer and more editorial without becoming static.

# Diary Vault Design System Notes

## Aesthetic Direction

Private archive workstation. The product should feel like a quiet desk at night with a well-lit page, a precise archive index, and restrained controls. Reliability remains non-negotiable, but the visual quality should be closer to a crafted writing tool than a utilitarian admin panel.

## Physical Scene

One person reviews and edits private Chinese diary entries at night on a desktop monitor, moving between pasted OCR text, a local archive timeline, and a carefully typeset page preview.

## Color Strategy

Use a restrained but not monochrome product palette.

- Base: tinted near-black, not pure black. Prefer OKLCH values around `oklch(0.13 0.012 275)` to `oklch(0.18 0.014 275)`.
- Paper: warm off-white surfaces around `oklch(0.96 0.018 82)` with subtle variation.
- Text on dark: off-white, gray-blue, and gray-green neutrals rather than pure white.
- Text on paper: ink black, warm brown-black, and muted graphite.
- Accent: one warm archive accent around `oklch(0.74 0.05 78)` plus a restrained error/correction red.
- Avoid large decorative gradients, colored side stripes, and neon dark-mode cliches.

## Typography

- Chinese diary body: prioritize readable Song/Ming style fonts with complete character coverage.
- Default body remains `Noto Serif SC` unless a better complete local font is validated.
- System fallbacks should include `SimSun`, `KaiTi`, `STKaiti`, and `Microsoft YaHei`.
- Local decorative fonts may be used for titles only when coverage is verified.
- Body line length should stay comfortable for long Chinese reading; avoid wide unbounded text blocks.
- Interface labels need to be larger than the current micro-label baseline when they control repeated workflows.

## Layout

- App shell: fixed side navigation is acceptable, but primary surfaces need stronger hierarchy and more generous hit targets.
- Welcome: should act as an archive dashboard, not a marketing hero.
- Timeline: grouped, searchable, and virtualized. Month and year rhythm should dominate over identical cards.
- Reader: page should be the focal object. Controls should be close enough to be discoverable but visually secondary.
- Editor: left editing surface, center/right page preview, and right parameter panel need clearer tool grouping and resize behavior.
- Entry page: paste/edit stability comes before inline OCR highlight effects.
- Export: should make selection scope and output status obvious.

## Components

- Buttons: icon plus text for primary commands; icon-only only when the symbol is familiar and has a title.
- Selects: stable dark option styling, readable current value, no white invisible dropdowns.
- Inputs: minimum 40px height for frequently used controls.
- Color controls: swatches plus exact values for page/ink parameters.
- Typography controls: separate global page parameters from selected inline text styles.
- Cards: use for actual repeated archive entries only; avoid nested cards and decorative card grids.
- Status: local service connection, saving, AI analysis, and archive errors need explicit states.

## Motion

- Use subtle opacity and transform transitions for entrance and hover.
- Avoid bounce or elastic motion.
- Avoid animating layout properties during pagination or editor resizing.

## Image And Texture

- Do not use generated decoration as a substitute for product function.
- Page texture can be introduced later, but must not reduce text contrast or pagination predictability.
- Image browsing should eventually show real thumbnails, not only filenames.

## Accessibility And Robustness

- Preserve visible scroll affordances where content can overflow.
- Focus states must be visible on keyboard navigation.
- Selected text editing controls should be disabled when no selection exists.
- Long filenames, long titles, and long tags must truncate predictably.
- The interface should remain usable at common desktop widths before mobile refinement.

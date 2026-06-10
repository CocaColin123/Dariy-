# Diary Vault Product Context

## Register

product

## Product Purpose

Diary Vault is a local-first personal diary archive for long-term storage, review, editing, and page-like presentation of private diary entries. It must feel reliable enough for years of writing while offering a refined reading and editing experience that treats diary text as an authored archive rather than loose notes.

## Audience

- Primary user: the owner of the diary archive, working with private Chinese diary entries on a local Windows machine.
- Secondary use case: future self revisiting entries by date, year, place, tags, images, and remembered fragments.
- The product is not designed for public publishing, collaboration, comments, social sharing, or CMS workflows.

## Core Workflows

- Paste or type diary text, optionally let AI help parse title, date, tags, OCR issues, and summary.
- Save entries into a local year/month Markdown archive.
- Browse a growing archive without visual overload or slow scrolling.
- Read an entry in a calm paper-like view.
- Edit diary content, metadata, images, and page parameters.
- Adjust global page layout and selected inline text styles while keeping files portable as Markdown.
- Export selected entries when needed.

## Reliability Principles

- Local diary files are the source of truth.
- Changes must avoid touching diary data unless the user explicitly requests a content operation.
- Editing should preserve Markdown portability and make formatting markup understandable enough to recover manually.
- Any large editor migration should have a backup/export path before it changes saved file format.
- Local service failure must be visible and recoverable, not a silent stuck state.

## Experience Principles

- The tool should be reliable and practical, but the interface should still be visually excellent.
- Writing and reading should feel private, quiet, and precise.
- Archive browsing should reduce clutter and help memory surface naturally.
- Page preview should feel like handled paper, not a generic card.
- Controls should be large enough for repeated use and grouped by intent.
- The product should support long Chinese text, pasted OCR text, spaces, line breaks, and local fonts without fragile layout behavior.

## Anti-References

- Generic dark dashboard with identical cards.
- Decorative glassmorphism as the main visual idea.
- A heavy collaborative document editor.
- A blog or publishing CMS.
- A plain textarea utility with no reading or archive atmosphere.
- A Word clone that hides diary files behind an opaque proprietary model.

## Success Criteria

- The user can archive, find, read, and edit more than one hundred diary entries without friction.
- Text selection, paste, delete, preview sync, and pagination feel predictable.
- The timeline gives structure and rhythm instead of overwhelming the user with cards.
- The editor supports useful local formatting while preserving Markdown.
- The visual system feels crafted, calm, and distinctive without reducing reliability.

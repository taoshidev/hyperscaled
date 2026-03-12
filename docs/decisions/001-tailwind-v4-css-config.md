# 001 — Tailwind v4 CSS-Based Configuration

Date: 2025-03-12
Status: Accepted

## Context

Tailwind v4 supports CSS-based configuration via @theme directives, removing the need for tailwind.config.js.

## Decision

Use CSS-based config exclusively. All theme tokens defined in globals.css via @theme inline blocks and CSS custom properties.

## Consequences

- Simpler config — one file (globals.css) holds all design tokens
- No JavaScript config to maintain
- shadcn/ui components work via CSS variable mapping
- Developers unfamiliar with v4 may look for tailwind.config and not find it

## Alternatives considered

- tailwind.config.js (v3 style): More familiar but unnecessary with v4

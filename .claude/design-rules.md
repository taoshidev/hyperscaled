# Hyperscaled — Design Rules

Loaded automatically by CLAUDE.md. These are non-negotiable.

## Color System

- **Background**: `oklch(0.05 0 0)` — near-black
- **Card surfaces**: `oklch(0.12 0 0)` — elevated dark
- **Borders**: white at 10% opacity
- **Text primary**: `oklch(0.985 0 0)` — near-white
- **Text muted**: `oklch(0.6 0 0)`
- **Accent/brand**: teal-400 `#00C6A7` / teal-500 `#00A88D`
- **Destructive**: `oklch(0.704 0.191 22.216)` — red for losses, errors
- All colors defined as CSS custom properties in globals.css via `@theme inline`

## Typography

- **Font**: Satoshi (loaded from Fontshare, weights 300–900)
- **Mono**: SF Mono / Fira Code — for numbers, addresses, amounts
- Use `font-mono` for all financial figures, hashes, and addresses
- Hierarchy through weight and opacity, not size jumps

## Animation Rules

- **Only animate**: `transform` and `opacity`. Nothing else.
- Use Framer Motion for enter/exit, transition CSS for hover states
- Skeleton shimmer for loading states (`.skeleton` class exists in globals.css)
- `.pulse-teal` for live connection indicators
- Keep durations under 300ms for interactions, 500ms max for page transitions

## Layout

- `min-h-[100dvh]` — never `h-screen`
- Cards use `bg-card` / `text-card-foreground` with `rounded-lg` and `border border-border`
- Consistent spacing: `gap-4` between cards, `p-4` or `p-6` inside cards
- Dashboard is a single-column stack on mobile, grid on desktop

## Component Patterns

- shadcn/ui primitives in `components/ui/` — extend, don't fork
- Use CVA (class-variance-authority) for component variants
- `clsx` + `tailwind-merge` via the `cn()` utility in `lib/utils.js`

## Copy & Content

- Labels describe outcomes: "Start earning" not "Sign up"
- No placeholder names — fake traders get real-sounding names
- No round numbers — `$14,382.61` not `$10,000`
- Status indicators: use teal dot + "Connected" / amber + "Syncing" / red + "Disconnected"

## Icons

- **Phosphor Icons** (`@phosphor-icons/react`) for all new work
- Import specific icons: `import { Wallet } from "@phosphor-icons/react"`
- Lucide only where shadcn components already depend on it

## Scrollbar

- Custom thin scrollbar defined in globals.css — 6px, subtle white on dark
- Don't override or remove

## What "Good" Looks Like

- Feels like a Bloomberg terminal designed by a product studio
- Dense but not cramped — every pixel earns its space
- Financial data is scannable: monospace numbers, right-aligned amounts, color-coded PnL
- Interactions feel instant — no loading spinners, no empty states without skeletons

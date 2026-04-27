/**
 * Alta Moda — Centralized Color Palette
 *
 * All colors are defined as CSS custom properties in globals.css (@theme inline).
 * Use Tailwind classes (e.g. `bg-accent`, `text-dark`, `border-border`) or
 * CSS var() references (e.g. `var(--color-accent)`) instead of hardcoded hex values.
 *
 * This file serves as documentation AND provides JS access when needed
 * (e.g. for inline styles, canvas, charts, or third-party libs).
 */

export const colors = {
  // ── Brand Accent (Anthracite — RAL 7016) ───────────────────
  accent:      '#293133',  // Primary brand color — buttons, links, highlights
  accentLight: '#293133',  // Hover states, subtle accents, scrollbar
  accentDark:  '#1a1d1f',  // Active/pressed states, deeper emphasis

  // ── Backgrounds (Floral White / Bone) ─────────────────────
  background:  '#FFFFFF',  // Page background, floral white
  surface:     '#FFFFFF',  // Cards, modals, elevated surfaces
  muted:       '#f5efe5',  // Muted/disabled backgrounds
  lightAccent: '#D8CFBC',  // Subtle section dividers, shimmer base (bone)

  // ── Text (Smoky Black) ────────────────────────────────────
  foreground:  '#2e2e2e',  // Primary text
  text:        '#2e2e2e',  // Alias for foreground
  textLight:   '#293133',  // Secondary/muted text

  // ── Dark tones (Smoky Black) ──────────────────────────────
  dark:        '#2e2e2e',  // Dark backgrounds, footer
  darkLight:   '#3d3e37',  // Dark hover states, gradients

  // ── Borders (Bone) ────────────────────────────────────────
  border:      '#D8CFBC',  // Default border color (bone)

  // ── Status / Feedback ──────────────────────────────────────
  success:     '#2d7a3a',  // Success messages, confirmations
  error:       '#b5453a',  // Errors, sale badges
  warning:     '#c4883a',  // Warnings, caution states
} as const;

/**
 * Tailwind class reference (available via @theme inline in globals.css):
 *
 *   bg-accent / text-accent / border-accent          → #293133 (Soft Olive)
 *   bg-accent-light / text-accent-light               → #293133
 *   bg-accent-dark / text-accent-dark                 → #1a1d1f
 *   bg-background                                     → #FFFFFF (Floral White)
 *   bg-surface                                        → #FFFFFF
 *   bg-muted                                          → #f5efe5
 *   bg-light-accent                                   → #D8CFBC (Bone)
 *   text-foreground / text-text                       → #2e2e2e (Smoky Black)
 *   text-text-light                                   → #293133
 *   bg-dark / text-dark                               → #2e2e2e
 *   bg-dark-light                                     → #3d3e37
 *   border-border                                     → #D8CFBC
 *   text-success / bg-success                         → #2d7a3a
 *   text-error / bg-error                             → #b5453a
 *   text-warning / bg-warning                         → #c4883a
 *
 * For opacity variants use Tailwind modifiers:
 *   bg-accent/30  → rgba(122, 127, 106, 0.3)
 *   bg-dark/85    → rgba(17, 18, 13, 0.85)
 */

export type ColorToken = keyof typeof colors;

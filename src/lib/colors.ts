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
  // ── Brand Accent (Burgundy/Mauve) ──────────────────────────
  accent:      '#735b28',  // Primary brand color — buttons, links, highlights
  accentLight: '#b07a87',  // Hover states, subtle accents, scrollbar
  accentDark:  '#594312',  // Active/pressed states, deeper emphasis

  // ── Backgrounds ────────────────────────────────────────────
  background:  '#f3f3f3',  // Page background, warm beige
  surface:     '#ffffff',  // Cards, modals, elevated surfaces
  muted:       '#f3f3f3',  // Muted/disabled backgrounds (same as background)
  lightAccent: '#e8e0d4',  // Subtle section dividers, shimmer base

  // ── Text ───────────────────────────────────────────────────
  foreground:  '#2d2d2d',  // Primary text
  text:        '#2d2d2d',  // Alias for foreground
  textLight:   '#6b6b6b',  // Secondary/muted text

  // ── Dark tones ─────────────────────────────────────────────
  dark:        '#2d2d2d',  // Dark backgrounds, footer
  darkLight:   '#4a4a4a',  // Dark hover states, gradients

  // ── Borders ────────────────────────────────────────────────
  border:      '#c4c7c7',  // Default border color (warm taupe)

  // ── Status / Feedback ──────────────────────────────────────
  success:     '#2d7a3a',  // Success messages, confirmations
  error:       '#b5453a',  // Errors, sale badges
  warning:     '#c4883a',  // Warnings, caution states
} as const;

/**
 * Tailwind class reference (available via @theme inline in globals.css):
 *
 *   bg-accent / text-accent / border-accent          → #735b28
 *   bg-accent-light / text-accent-light               → #b07a87
 *   bg-accent-dark / text-accent-dark                 → #594312
 *   bg-background                                     → #f3f3f3
 *   bg-surface                                        → #ffffff
 *   bg-muted                                          → #f3f3f3
 *   bg-light-accent                                   → #e8e0d4
 *   text-foreground / text-text                       → #2d2d2d
 *   text-text-light                                   → #6b6b6b
 *   bg-dark / text-dark                               → #2d2d2d
 *   bg-dark-light                                     → #4a4a4a
 *   border-border                                     → #c4c7c7
 *   text-success / bg-success                         → #2d7a3a
 *   text-error / bg-error                             → #b5453a
 *   text-warning / bg-warning                         → #c4883a
 *   bg-warm-beige                                     → #f3f3f3
 *
 * For opacity variants use Tailwind modifiers:
 *   bg-accent/30  → rgba(140, 74, 90, 0.3)
 *   bg-dark/85    → rgba(45, 45, 45, 0.85)
 */

export type ColorToken = keyof typeof colors;

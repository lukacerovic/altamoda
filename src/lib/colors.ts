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
  // ── Brand Accent ──────────────────────────────────────────
  accent:      '#edb4bd',  // Primary CTA — buttons, links, highlights (gold)
  accentLight: '#dddbd9',  // Hover states, subtle accents, scrollbar
  accentDark:  '#413d3a',  // Active/pressed states, deeper emphasis

  // ── Backgrounds (White / Light Warm Gray) ────────────────
  background:  '#ffffff',  // Page background
  surface:     '#ffffff',  // Cards, modals, elevated surfaces
  muted:       '#dddbd9',  // Muted/disabled backgrounds
  lightAccent: '#dddbd9',  // Subtle section dividers, shimmer base

  // ── Text (Near Black) ─────────────────────────────────────
  foreground:  '#1a1c1e',  // Primary text
  text:        '#1a1c1e',  // Alias for foreground
  textLight:   '#dddbd9',  // Secondary/muted text

  // ── Dark tones (Near Black + Warm Dark Gray) ─────────────
  dark:        '#1a1c1e',  // Dark backgrounds, footer
  darkLight:   '#413d3a',  // Dark hover states, gradients

  // ── Borders ───────────────────────────────────────────────
  border:      '#dddbd9',  // Default border color

  // ── CTA / Button ──────────────────────────────────────────
  cta:         '#edb4bd',  // Primary call-to-action

  // ── Status / Feedback (reserved for messages only) ────────
  success:     '#2d7a3a',  // Success messages, confirmations
  error:       '#ba1a1a',  // Error messages, validation failures
  warning:     '#edb4bd',  // Warnings, caution states (gold)
} as const;

/**
 * Tailwind class reference (available via @theme inline in globals.css):
 *
 *   bg-accent / text-accent / border-accent          → #edb4bd (CTA Gold)
 *   bg-accent-light / text-accent-light               → #dddbd9 (Light Warm Gray)
 *   bg-accent-dark / text-accent-dark                 → #413d3a (Warm Dark Gray)
 *   bg-background                                     → #ffffff (White)
 *   bg-surface                                        → #ffffff
 *   bg-muted                                          → #dddbd9
 *   bg-light-accent                                   → #dddbd9
 *   text-foreground / text-text                       → #1a1c1e (Near Black)
 *   text-text-light                                   → #dddbd9
 *   bg-dark / text-dark                               → #1a1c1e
 *   bg-dark-light                                     → #413d3a
 *   border-border                                     → #dddbd9
 *   text-success / bg-success                         → #edb4bd
 *   text-error / bg-error                             → #edb4bd
 *   text-warning / bg-warning                         → #edb4bd
 *
 * For opacity variants use Tailwind modifiers:
 *   bg-accent/30  → rgba(193,151,66, 0.3)
 *   bg-dark/85    → rgba(26,28,30, 0.85)
 */

export type ColorToken = keyof typeof colors;

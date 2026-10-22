"use client";

import { openCookieSettings } from "@/components/CookieConsent";

/** Reopens the cookie banner with its settings panel, so consent can be
 *  changed or withdrawn at any time (required by the cookie policy). */
export default function CookieSettingsLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {children}
    </button>
  );
}

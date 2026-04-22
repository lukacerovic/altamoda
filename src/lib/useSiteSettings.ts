"use client";

import { useEffect, useState } from "react";

/**
 * Fetch a slice of public site settings (logo, social links, …) from /api/site-settings.
 * Returns a map of key → value. Missing keys are absent from the map.
 * Shared by Header and Footer so a single request backs both.
 */
export function useSiteSettings(keys: string[]): Record<string, string> {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const keyList = keys.join(",");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/site-settings?keys=${encodeURIComponent(keyList)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.success && json.data) {
          setSettings(json.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [keyList]);

  return settings;
}

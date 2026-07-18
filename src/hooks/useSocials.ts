"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SOCIALS, normalizeSocials, type Socials } from "@/lib/socials";

// Client hook that reads the site's social links from /api/config.
export function useSocials(): Socials {
  const [socials, setSocials] = useState<Socials>(DEFAULT_SOCIALS);

  useEffect(() => {
    let active = true;
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (active) setSocials(normalizeSocials(data?.socials));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return socials;
}

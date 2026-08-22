"use client";

import { useEffect } from "react";

const MERCHANT_ID = 5834644742;

export default function GcrBadge() {
  useEffect(() => {
    const scriptId = "gcr-badge-js";
    if (document.getElementById(scriptId)) return;

    (window as unknown as Record<string, unknown>)["renderGcrBadge"] = function () {
      const gapi = (window as unknown as Record<string, unknown>)["gapi"] as {
        load: (mod: string, cb: () => void) => void;
        ratingbadge: { render: (el: HTMLElement, opts: Record<string, unknown>) => void };
      };
      const container = document.createElement("div");
      document.body.appendChild(container);
      gapi.load("ratingbadge", () => {
        gapi.ratingbadge.render(container, {
          merchant_id: MERCHANT_ID,
          position: "BOTTOM_RIGHT",
        });
      });
    };

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://apis.google.com/js/platform.js?onload=renderGcrBadge";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

const PERMISSION_KEY = "location_permission";
const LAT_KEY = "visitor_lat";
const LON_KEY = "visitor_lon";

export default function VisitorTracker() {
  const pathname = usePathname();
  const initialized = useRef(false);

  // If permission was previously granted, silently refresh GPS coords for this session
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (localStorage.getItem(PERMISSION_KEY) !== "granted") return;
    if (sessionStorage.getItem(LAT_KEY)) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sessionStorage.setItem(LAT_KEY, String(pos.coords.latitude));
        sessionStorage.setItem(LON_KEY, String(pos.coords.longitude));
      },
      () => {}
    );
  }, []);

  // Log every page view
  useEffect(() => {
    const lat = sessionStorage.getItem(LAT_KEY);
    const lon = sessionStorage.getItem(LON_KEY);
    void api.post("/api/visitor/log", {
      page: pathname,
      referrer: document.referrer || null,
      latitude: lat ? Number(lat) : null,
      longitude: lon ? Number(lon) : null,
    }).catch(() => {});
  }, [pathname]);

  return null;
}

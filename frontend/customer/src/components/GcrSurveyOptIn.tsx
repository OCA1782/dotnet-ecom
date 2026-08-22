"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const MERCHANT_ID = 5834644742;

type GapiSurvey = {
  load: (mod: string, cb: () => void) => void;
  surveyoptin: { render: (opts: Record<string, unknown>) => void };
};

function addEstimatedDeliveryDays(days: number): string {
  const d = new Date();
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().split("T")[0];
}

export default function GcrSurveyOptIn() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("siparis") ?? "";

  useEffect(() => {
    if (!orderNumber) return;

    let email = "";
    try {
      const stored = localStorage.getItem("user");
      if (stored) email = (JSON.parse(stored) as { email?: string }).email ?? "";
    } catch { /* ignore */ }

    if (!email) return;

    const estimatedDelivery = addEstimatedDeliveryDays(5);

    function renderSurvey() {
      const gapi = (window as unknown as Record<string, unknown>)["gapi"] as GapiSurvey | undefined;
      if (!gapi) return;
      gapi.load("surveyoptin", () => {
        gapi.surveyoptin.render({
          merchant_id: MERCHANT_ID,
          order_id: orderNumber,
          email,
          delivery_country: "TR",
          estimated_delivery_date: estimatedDelivery,
          opt_in_style: "OPT_IN_STYLE_CENTER_DIALOG_TITLE_TEXT_BUTTONS",
        });
      });
    }

    const gapi = (window as unknown as Record<string, unknown>)["gapi"];
    if (gapi) {
      renderSurvey();
      return;
    }

    const scriptId = "gcr-survey-js";
    if (document.getElementById(scriptId)) return;

    (window as unknown as Record<string, unknown>)["initGcrSurvey"] = renderSurvey;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://apis.google.com/js/platform.js?onload=initGcrSurvey";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [orderNumber]);

  return null;
}

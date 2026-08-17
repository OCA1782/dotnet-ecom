import { getSettings } from "@/lib/settings";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const settings = await getSettings();
  const s = settings as Record<string, string | undefined>;
  const codEnabled = settings.PaymentCashOnDeliveryEnabled !== "false";
  const havaleEnabled = s.PaymentHavaleEnabled === "true";
  const havaleIban = s.PaymentHavaleIBAN ?? "";
  const havalebankName = s.PaymentHavaleBankName ?? "";
  const havaleAccountName = s.PaymentHavaleAccountName || settings.SiteName || "";
  return (
    <CheckoutClient
      codEnabled={codEnabled}
      havaleEnabled={havaleEnabled}
      havaleIban={havaleIban}
      havalebankName={havalebankName}
      havaleAccountName={havaleAccountName}
    />
  );
}

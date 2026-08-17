import { getSettings } from "@/lib/settings";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const settings = await getSettings();
  const codEnabled = settings.PaymentCashOnDeliveryEnabled !== "false";
  const havaleIban = (settings as Record<string, string | undefined>).PaymentHavaleIBAN ?? "";
  const havalebankName = (settings as Record<string, string | undefined>).PaymentHavaleBankName ?? "";
  const havaleAccountName = settings.SiteName ?? "";
  return (
    <CheckoutClient
      codEnabled={codEnabled}
      havaleIban={havaleIban}
      havalebankName={havalebankName}
      havaleAccountName={havaleAccountName}
    />
  );
}

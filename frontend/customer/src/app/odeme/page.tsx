import { getSettings } from "@/lib/settings";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const settings = await getSettings();
  const codEnabled = settings.PaymentCashOnDeliveryEnabled !== "false";
  return <CheckoutClient codEnabled={codEnabled} />;
}

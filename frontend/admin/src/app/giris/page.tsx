import { getSettings } from "@/lib/settings";
import AdminLoginForm from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const settings = await getSettings();
  const siteTitle = settings.SiteName || "";
  const logoUrl = settings.AdminLogoIcon || settings.CustomerLogoIcon || settings.LogoUrl || "/logo-icon.png";

  return <AdminLoginForm siteTitle={siteTitle} logoUrl={logoUrl} />;
}

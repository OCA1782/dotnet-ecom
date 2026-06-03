import { cookies } from "next/headers";
import { type Lang, t as translate, translations } from "./i18n";

export async function getServerLang(): Promise<Lang> {
  const jar = await cookies();
  const val = jar.get("ecom_lang")?.value as Lang | undefined;
  return val && translations[val] ? val : "tr";
}

export async function st(key: string): Promise<string> {
  const lang = await getServerLang();
  return translate(lang, key);
}

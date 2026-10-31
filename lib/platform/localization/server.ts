import { cookies } from "next/headers";
import { createTranslator, resolvePlatformLocale, type PlatformLocale } from "@/lib/platform/localization";
import { platformLocaleCookieName } from "@/lib/platform/localization/locales";

export async function getServerLocale(): Promise<PlatformLocale> {
  const cookieStore = await cookies();
  return resolvePlatformLocale(cookieStore.get(platformLocaleCookieName)?.value);
}

export async function getServerTranslator() {
  return createTranslator(await getServerLocale());
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createTranslator,
  platformDefaultLocale,
  platformLocaleCookieName,
  platformLocaleStorageKey,
  resolvePlatformLocale,
  supportedLocales,
  type PlatformLocale
} from "@/lib/platform/localization";

export function usePlatformLocalization() {
  const [locale, setLocaleState] = useState<PlatformLocale>(platformDefaultLocale);

  useEffect(() => {
    setLocaleState(resolvePlatformLocale(readCookie(platformLocaleCookieName) ?? window.localStorage.getItem(platformLocaleStorageKey)));
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);

  function setLocale(nextLocale: PlatformLocale) {
    document.cookie = `${platformLocaleCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.localStorage.setItem(platformLocaleStorageKey, nextLocale);
    setLocaleState(nextLocale);
    window.location.reload();
  }

  return { locale, setLocale, supportedLocales, t };
}

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];
}

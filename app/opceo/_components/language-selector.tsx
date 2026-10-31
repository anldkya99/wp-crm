"use client";

import { usePlatformLocalization } from "@/lib/platform/localization/client";

export function LanguageSelector() {
  const { locale, setLocale, supportedLocales, t } = usePlatformLocalization();

  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA8A8]">
      <span>{t("language.selector.label")}</span>
      <select
        className="mt-2 w-full rounded-lg border border-[#1C3434] bg-[#071113] px-3 py-2 text-sm normal-case tracking-normal text-[#F4F1EA] outline-none transition focus:border-[#C8A45D]"
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
      >
        {supportedLocales.map((item) => (
          <option key={item.code} value={item.code}>
            {t(`language.selector.${item.code}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

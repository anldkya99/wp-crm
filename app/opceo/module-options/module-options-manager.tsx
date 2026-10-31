"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { usePlatformLocalization } from "@/lib/platform/localization/client";

type ModuleSummary = {
  moduleId: string;
  name: string;
  category: string;
};

type OptionTypeSummary = {
  moduleId: string;
  key: string;
  labelKey: string;
  descriptionKey: string;
  allowedScopes: Array<"PLATFORM" | "COMPANY">;
  defaultStatus: "ACTIVE" | "DISABLED";
  version: string;
  sortOrder: number;
  companyManageable: boolean;
  foundationOnly: boolean;
};

type CompanySummary = {
  id: string;
  name: string;
  slug: string;
};

type ModuleOptionRecord = {
  id: string;
  moduleId: string;
  optionTypeKey: string;
  scope: "PLATFORM" | "COMPANY";
  companyId: string | null;
  key: string;
  displayName: string;
  description: string | null;
  configurationJson: unknown;
  metadataJson: unknown;
  status: "ACTIVE" | "DISABLED" | "ARCHIVED";
  version: number;
  sortOrder: number;
};

type ModuleOptionsPayload = {
  modules: ModuleSummary[];
  optionTypes: OptionTypeSummary[];
  companies: CompanySummary[];
  options: ModuleOptionRecord[];
};

const defaultConfiguration = "{\n  \"enabled\": true\n}";
const defaultMetadata = "{\n  \"foundation\": true\n}";

export function ModuleOptionsManager() {
  const { t } = usePlatformLocalization();
  const [payload, setPayload] = useState<ModuleOptionsPayload>({ modules: [], optionTypes: [], companies: [], options: [] });
  const [filters, setFilters] = useState({ scope: "PLATFORM", companyId: "", moduleId: "", optionTypeKey: "", status: "" });
  const [form, setForm] = useState({
    id: "",
    expectedVersion: 0,
    key: "",
    displayName: "",
    description: "",
    configurationJson: defaultConfiguration,
    metadataJson: defaultMetadata,
    sortOrder: "10"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedOptionType = useMemo(
    () => payload.optionTypes.find((optionType) => optionType.moduleId === filters.moduleId && optionType.key === filters.optionTypeKey) ?? payload.optionTypes[0],
    [filters.moduleId, filters.optionTypeKey, payload.optionTypes]
  );
  const optionTypesForModule = payload.optionTypes.filter((optionType) => !filters.moduleId || optionType.moduleId === filters.moduleId);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (filters.scope) params.set("scope", filters.scope);
    if (filters.companyId) params.set("companyId", filters.companyId);
    if (filters.moduleId) params.set("moduleId", filters.moduleId);
    if (filters.optionTypeKey) params.set("optionTypeKey", filters.optionTypeKey);
    if (filters.status) params.set("status", filters.status);
    const response = await fetch(`/api/opceo/module-options?${params.toString()}`, { cache: "no-store" });
    const nextPayload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(t("opceo.moduleOptions.actionFailed"));
      return;
    }
    setPayload(nextPayload);
    const firstOptionType = nextPayload.optionTypes[0];
    setFilters((current) => ({
      ...current,
      moduleId: current.moduleId || firstOptionType?.moduleId || "",
      optionTypeKey: current.optionTypeKey || firstOptionType?.key || "",
      companyId: current.companyId || nextPayload.companies[0]?.id || ""
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const body = {
      moduleId: filters.moduleId,
      optionTypeKey: filters.optionTypeKey,
      scope: filters.scope,
      companyId: filters.scope === "COMPANY" ? filters.companyId : null,
      key: form.key,
      displayName: form.displayName,
      description: form.description,
      configurationJson: parseJson(form.configurationJson),
      metadataJson: parseJson(form.metadataJson),
      sortOrder: Number(form.sortOrder)
    };
    if (!body.configurationJson || body.metadataJson === undefined) return;

    const response = await fetch("/api/opceo/module-options", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form.id ? { action: "update", id: form.id, expectedVersion: form.expectedVersion, ...body } : body)
    });
    await response.json();
    if (!response.ok) {
      setError(t("opceo.moduleOptions.saveFailed"));
      return;
    }
    resetForm();
    await load();
  }

  async function action(option: ModuleOptionRecord, actionName: "activate" | "disable" | "archive" | "restore") {
    setError("");
    const response = await fetch("/api/opceo/module-options", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName, id: option.id, expectedVersion: option.version })
    });
    await response.json();
    if (!response.ok) {
      setError(t("opceo.moduleOptions.actionFailed"));
      return;
    }
    await load();
  }

  function edit(option: ModuleOptionRecord) {
    setFilters({
      scope: option.scope,
      companyId: option.companyId ?? filters.companyId,
      moduleId: option.moduleId,
      optionTypeKey: option.optionTypeKey,
      status: filters.status
    });
    setForm({
      id: option.id,
      expectedVersion: option.version,
      key: option.key,
      displayName: option.displayName,
      description: option.description ?? "",
      configurationJson: JSON.stringify(option.configurationJson, null, 2),
      metadataJson: JSON.stringify(option.metadataJson ?? {}, null, 2),
      sortOrder: String(option.sortOrder)
    });
  }

  function resetForm() {
    setForm({ id: "", expectedVersion: 0, key: "", displayName: "", description: "", configurationJson: defaultConfiguration, metadataJson: defaultMetadata, sortOrder: "10" });
  }

  function parseJson(value: string) {
    try {
      const parsed = JSON.parse(value || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      return parsed;
    } catch {
      setError(t("opceo.moduleOptions.saveFailed"));
      return undefined;
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.moduleOptions.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.moduleOptions.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.moduleOptions.description")}</p>

      <DashboardSection title={t("opceo.moduleOptions.modules")}>
        <DashboardCard title={t("opceo.moduleOptions.modules")} value={String(payload.modules.length)} description={t("opceo.moduleOptions.description")} />
        <DashboardCard title={t("opceo.moduleOptions.optionTypes")} value={String(payload.optionTypes.length)} description={selectedOptionType ? t(selectedOptionType.descriptionKey) : t("opceo.empty")} />
        <DashboardCard title={t("opceo.moduleOptions.options")} value={String(payload.options.length)} description={loading ? t("opceo.pending") : t("opceo.ready")} />
      </DashboardSection>

      <section className="mt-8 rounded-lg border border-[#1C3434] bg-[#0B1718] p-5">
        <h2 className="text-base font-semibold text-[#F4F1EA]">{t("opceo.moduleOptions.filters")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Select label={t("opceo.moduleOptions.scope")} value={filters.scope} options={[{ value: "PLATFORM", label: t("opceo.moduleOptions.platform") }, { value: "COMPANY", label: t("opceo.moduleOptions.companyScope") }]} onChange={(value) => setFilters({ ...filters, scope: value })} />
          <Select label={t("opceo.moduleOptions.company")} value={filters.companyId} disabled={filters.scope !== "COMPANY"} options={payload.companies.map((company) => ({ value: company.id, label: company.name }))} onChange={(value) => setFilters({ ...filters, companyId: value })} />
          <Select label={t("opceo.moduleOptions.module")} value={filters.moduleId} options={payload.modules.map((module) => ({ value: module.moduleId, label: module.name }))} onChange={(value) => setFilters({ ...filters, moduleId: value, optionTypeKey: "" })} />
          <Select label={t("opceo.moduleOptions.optionType")} value={filters.optionTypeKey} options={optionTypesForModule.map((optionType) => ({ value: optionType.key, label: t(optionType.labelKey) }))} onChange={(value) => setFilters({ ...filters, optionTypeKey: value })} />
          <Select label={t("opceo.moduleOptions.status")} value={filters.status} options={[{ value: "", label: t("opceo.moduleOptions.all") }, { value: "ACTIVE", label: t("opceo.moduleOptions.active") }, { value: "DISABLED", label: t("opceo.moduleOptions.disabled") }, { value: "ARCHIVED", label: t("opceo.moduleOptions.archived") }]} onChange={(value) => setFilters({ ...filters, status: value })} />
        </div>
        <button className="mt-4 rounded-full border border-[#C8A45D]/40 px-4 py-2 text-sm font-semibold text-[#C8A45D]" onClick={() => void load()}>{t("opceo.moduleOptions.refresh")}</button>
      </section>

      <form className="mt-8 rounded-lg border border-[#1C3434] bg-[#0B1718] p-5" onSubmit={submit}>
        <h2 className="text-base font-semibold text-[#F4F1EA]">{form.id ? t("opceo.moduleOptions.edit") : t("opceo.moduleOptions.create")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input label={t("opceo.moduleOptions.key")} value={form.key} disabled={Boolean(form.id)} onChange={(value) => setForm({ ...form, key: value })} />
          <Input label={t("opceo.moduleOptions.displayName")} value={form.displayName} onChange={(value) => setForm({ ...form, displayName: value })} />
          <Input label={t("opceo.moduleOptions.sortOrder")} type="number" value={form.sortOrder} onChange={(value) => setForm({ ...form, sortOrder: value })} />
          <Input label={t("opceo.moduleOptions.descriptionField")} value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <Textarea label={t("opceo.moduleOptions.configuration")} value={form.configurationJson} onChange={(value) => setForm({ ...form, configurationJson: value })} />
          <Textarea label={t("opceo.moduleOptions.metadata")} value={form.metadataJson} onChange={(value) => setForm({ ...form, metadataJson: value })} />
        </div>
        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <button className="mt-5 rounded-full border border-[#C8A45D]/50 bg-[#C8A45D] px-5 py-2 text-sm font-semibold text-[#05080A]" type="submit">
          {form.id ? t("opceo.moduleOptions.update") : t("opceo.moduleOptions.create")}
        </button>
      </form>

      <DashboardSection title={t("opceo.moduleOptions.options")}>
        {payload.options.length === 0 && <DashboardCard title={t("opceo.moduleOptions.options")} value="0" description={t("opceo.moduleOptions.noOptions")} />}
        {payload.options.map((option) => (
          <DashboardCard key={option.id} title={option.displayName} value={statusLabel(option.status, t)} description={`${option.moduleId} / ${option.optionTypeKey} / ${option.key}`}>
            <div className="space-y-3 text-xs leading-5 text-[#9CA8A8]">
              <p>{t("opceo.moduleOptions.scope")}: {scopeLabel(option.scope, t)}</p>
              <p>{t("opceo.moduleOptions.version")}: {option.version}</p>
              <div className="flex flex-wrap gap-2">
                {option.status === "ARCHIVED" ? (
                  <button className="rounded-full border border-[#1C3434] px-3 py-1 text-[#F4F1EA]" onClick={() => void action(option, "restore")} type="button">{t("opceo.moduleOptions.restore")}</button>
                ) : (
                  <>
                    <button className="rounded-full border border-[#1C3434] px-3 py-1 text-[#F4F1EA]" onClick={() => edit(option)} type="button">{t("opceo.moduleOptions.edit")}</button>
                    {option.status !== "ACTIVE" && <button className="rounded-full border border-[#1C3434] px-3 py-1 text-[#F4F1EA]" onClick={() => void action(option, "activate")} type="button">{t("opceo.moduleOptions.activate")}</button>}
                    {option.status === "ACTIVE" && <button className="rounded-full border border-[#1C3434] px-3 py-1 text-[#F4F1EA]" onClick={() => void action(option, "disable")} type="button">{t("opceo.moduleOptions.disable")}</button>}
                    <button className="rounded-full border border-[#1C3434] px-3 py-1 text-[#F4F1EA]" onClick={() => void action(option, "archive")} type="button">{t("opceo.moduleOptions.archive")}</button>
                  </>
                )}
              </div>
            </div>
          </DashboardCard>
        ))}
      </DashboardSection>
    </div>
  );
}

function statusLabel(status: ModuleOptionRecord["status"], t: (key: string) => string) {
  if (status === "ACTIVE") return t("opceo.moduleOptions.active");
  if (status === "ARCHIVED") return t("opceo.moduleOptions.archived");
  return t("opceo.moduleOptions.disabled");
}

function scopeLabel(scope: ModuleOptionRecord["scope"], t: (key: string) => string) {
  return scope === "PLATFORM" ? t("opceo.moduleOptions.platform") : t("opceo.moduleOptions.companyScope");
}

function Input({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  return (
    <label className="block text-sm text-[#9CA8A8]">
      <span className="font-medium text-[#F4F1EA]">{label}</span>
      <input className="mt-2 w-full rounded-lg border border-[#1C3434] bg-[#071113] px-3 py-2 text-[#F4F1EA] outline-none transition focus:border-[#C8A45D] disabled:opacity-60" type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-[#9CA8A8]">
      <span className="font-medium text-[#F4F1EA]">{label}</span>
      <textarea className="mt-2 min-h-28 w-full rounded-lg border border-[#1C3434] bg-[#071113] px-3 py-2 font-mono text-xs text-[#F4F1EA] outline-none transition focus:border-[#C8A45D]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="block text-sm text-[#9CA8A8]">
      <span className="font-medium text-[#F4F1EA]">{label}</span>
      <select className="mt-2 w-full rounded-lg border border-[#1C3434] bg-[#071113] px-3 py-2 text-[#F4F1EA] outline-none transition focus:border-[#C8A45D] disabled:opacity-60" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

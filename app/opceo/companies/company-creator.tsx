"use client";

import { useMemo, useState } from "react";
import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformCapabilityFramework } from "@/lib/platform/capabilities/capability-framework";
import { licensePackages, type LicensePackageKey } from "@/lib/platform/license-packages";
import { getPlatformLicenseEngine } from "@/lib/platform/licensing/license-engine";
import { industryProfiles, type IndustryProfileKey } from "@/lib/platform/industry-profiles";
import { usePlatformLocalization } from "@/lib/platform/localization/client";
import { getPlatformModuleFramework } from "@/lib/platform/modules/module-framework";

type ProvisioningResult = {
  companyId: string;
  companySlug: string;
  ownerId: string;
  departmentsCreated: number;
  usersCreated: number;
  modulesEnabled: number;
  capabilitiesEnabled: number;
  featureFlagsEnabled: number;
  auditRecordsCreated: number;
};

const defaultFeatureFlags = ["crm", "whatsapp", "ticketing"];
const registeredCapabilities = getPlatformCapabilityFramework().capabilities;
const licenseEngine = getPlatformLicenseEngine();
const registeredFeatureFlags = Array.from(
  new Map(
    [
      ...getPlatformModuleFramework().featureFlags,
      ...registeredCapabilities.flatMap((capability) =>
        capability.featureFlags.map((featureFlag) => ({
          ...featureFlag,
          moduleId: capability.moduleId,
          capabilityId: capability.capabilityId
        }))
      )
    ].map((featureFlag) => [featureFlag.key, featureFlag])
  ).values()
);

export function CompanyCreator() {
  const { t } = usePlatformLocalization();
  const [company, setCompany] = useState({
    name: "",
    industryProfile: "custom" as IndustryProfileKey,
    licensePackage: "starter" as LicensePackageKey,
    country: "TR",
    timezone: "Europe/Istanbul",
    language: "tr",
    currency: "TRY",
    logoUrl: ""
  });
  const [owner, setOwner] = useState({ fullName: "", email: "", password: "", phoneNumber: "" });
  const [organization, setOrganization] = useState({ companyAdminCount: 1, departmentAdminCount: 2, operatorCount: 5 });
  const [featureFlags, setFeatureFlags] = useState<string[]>(defaultFeatureFlags);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProvisioningResult | null>(null);

  const selectedLicense = licensePackages[company.licensePackage];
  const selectedProfile = industryProfiles[company.industryProfile];
  const allowedFeatures = useMemo(() => {
    const allRegisteredFlags = registeredFeatureFlags.map((featureFlag) => featureFlag.key);
    return licenseEngine.resolveLicense({
      packageId: company.licensePackage,
      requestedFeatureFlags: allRegisteredFlags
    }).features.enabledFeatureFlags;
  }, [company.licensePackage]);

  function setFeature(flag: string, enabled: boolean) {
    setFeatureFlags((current) => {
      const next = new Set(current);
      if (enabled) next.add(flag);
      else next.delete(flag);
      return Array.from(next);
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/opceo/company-provisioning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company,
        owner,
        organization,
        featureFlags
      })
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? t("opceo.company.provisioningFailed"));
      return;
    }

    setResult(payload.result);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">{t("opceo.company.eyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t("opceo.company.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">{t("opceo.company.description")}</p>

      <DashboardSection title={t("opceo.company.scope")}>
        <DashboardCard title={t("opceo.company.transaction")} value={t("opceo.single")} description={t("opceo.company.transaction.description")} />
        <DashboardCard title={t("opceo.company.industryProfile")} value={selectedProfile.name} description={t("opceo.company.industryProfile.description")} />
        <DashboardCard title={t("opceo.company.license")} value={selectedLicense.name} description={t("opceo.company.license.description")} />
      </DashboardSection>

      <form className="mt-8 space-y-5" onSubmit={submit}>
        <WizardPanel title={t("opceo.company.step.company")}>
          <Input label={t("opceo.company.fields.companyName")} value={company.name} onChange={(value) => setCompany({ ...company, name: value })} required />
          <Select label={t("opceo.company.industryProfile")} value={company.industryProfile} options={Object.values(industryProfiles).map((profile) => ({ label: profile.name, value: profile.key }))} onChange={(value) => setCompany({ ...company, industryProfile: value as IndustryProfileKey })} />
          <Select label={t("opceo.company.fields.licensePackage")} value={company.licensePackage} options={Object.values(licensePackages).map((license) => ({ label: license.name, value: license.key }))} onChange={(value) => setCompany({ ...company, licensePackage: value as LicensePackageKey })} />
          <Input label={t("opceo.company.fields.country")} value={company.country} onChange={(value) => setCompany({ ...company, country: value })} />
          <Input label={t("opceo.company.fields.timezone")} value={company.timezone} onChange={(value) => setCompany({ ...company, timezone: value })} />
          <Input label={t("opceo.company.fields.language")} value={company.language} onChange={(value) => setCompany({ ...company, language: value })} />
          <Input label={t("opceo.company.fields.currency")} value={company.currency} onChange={(value) => setCompany({ ...company, currency: value })} />
          <Input label={t("opceo.company.fields.logoUrl")} value={company.logoUrl} onChange={(value) => setCompany({ ...company, logoUrl: value })} />
        </WizardPanel>

        <WizardPanel title={t("opceo.company.step.owner")}>
          <Input label={t("opceo.company.fields.fullName")} value={owner.fullName} onChange={(value) => setOwner({ ...owner, fullName: value })} required />
          <Input label={t("opceo.company.fields.email")} type="email" value={owner.email} onChange={(value) => setOwner({ ...owner, email: value })} required />
          <Input label={t("opceo.company.fields.password")} type="password" value={owner.password} onChange={(value) => setOwner({ ...owner, password: value })} required />
          <Input label={t("opceo.company.fields.phoneNumber")} value={owner.phoneNumber} onChange={(value) => setOwner({ ...owner, phoneNumber: value })} />
        </WizardPanel>

        <WizardPanel title={t("opceo.company.step.organization")}>
          <Input label={t("opceo.company.fields.companyAdminCount")} type="number" value={String(organization.companyAdminCount)} onChange={(value) => setOrganization({ ...organization, companyAdminCount: Number(value) })} />
          <Input label={t("opceo.company.fields.departmentAdminCount")} type="number" value={String(organization.departmentAdminCount)} onChange={(value) => setOrganization({ ...organization, departmentAdminCount: Number(value) })} />
          <Input label={t("opceo.company.fields.operatorCount")} type="number" value={String(organization.operatorCount)} onChange={(value) => setOrganization({ ...organization, operatorCount: Number(value) })} />
          <p className="text-xs leading-5 text-[#9CA8A8]">{t("opceo.company.departmentsFromProfile", { departments: selectedProfile.departments.join(", ") })}</p>
        </WizardPanel>

        <WizardPanel title={t("opceo.company.step.features")}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {registeredFeatureFlags.map((featureFlag) => {
              const allowed = allowedFeatures.has(featureFlag.key);
              return (
                <label key={`${featureFlag.moduleId}:${featureFlag.key}`} className="flex items-center gap-3 rounded-lg border border-[#1C3434] bg-[#071113] px-3 py-2 text-sm text-[#F4F1EA]">
                  <input
                    type="checkbox"
                    checked={featureFlags.includes(featureFlag.key) && allowed}
                    disabled={!allowed}
                    onChange={(event) => setFeature(featureFlag.key, event.target.checked)}
                  />
                  <span className={!allowed ? "text-[#5F6C6C]" : ""}>{featureFlag.key.replaceAll("_", " ")}</span>
                </label>
              );
            })}
          </div>
        </WizardPanel>

        {error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        {result && (
          <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
            {t("opceo.company.result", {
              companySlug: result.companySlug,
              departments: result.departmentsCreated,
              users: result.usersCreated,
              modules: result.modulesEnabled,
              capabilities: result.capabilitiesEnabled,
              audit: result.auditRecordsCreated
            })}
          </p>
        )}
        <button className="rounded-full border border-[#C8A45D]/50 bg-[#C8A45D] px-5 py-2 text-sm font-semibold text-[#05080A] transition hover:bg-[#D9B96D]" disabled={loading}>
          {loading ? t("opceo.company.provisioning") : t("opceo.company.create")}
        </button>
      </form>
    </div>
  );
}

function WizardPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#1C3434] bg-[#0B1718] p-5">
      <h2 className="text-base font-semibold text-[#F4F1EA]">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-[#9CA8A8]">
      <span className="font-medium text-[#F4F1EA]">{label}</span>
      <input
        className="mt-2 w-full rounded-lg border border-[#1C3434] bg-[#071113] px-3 py-2 text-[#F4F1EA] outline-none transition focus:border-[#C8A45D]"
        type={type}
        value={value}
        required={required}
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-[#9CA8A8]">
      <span className="font-medium text-[#F4F1EA]">{label}</span>
      <select className="mt-2 w-full rounded-lg border border-[#1C3434] bg-[#071113] px-3 py-2 text-[#F4F1EA] outline-none transition focus:border-[#C8A45D]" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

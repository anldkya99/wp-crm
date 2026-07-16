import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformLicenseEngine } from "@/lib/platform/licensing/license-engine";

export default function LicenseCenterFoundationPage() {
  const licensing = getPlatformLicenseEngine();
  const packageCount = licensing.packages.length;
  const entitlementSamples = licensing.packages.map((licensePackage) =>
    licensing.resolveLicense({ packageId: licensePackage.packageId })
  );
  const totalModules = entitlementSamples.reduce((sum, sample) => sum + sample.licenseContext.purchasedModules.size, 0);
  const totalCapabilities = entitlementSamples.reduce((sum, sample) => sum + sample.licenseContext.purchasedCapabilities.size, 0);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Licensing Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">License Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for centralized packages, feature management, entitlement resolution, package hierarchy, and runtime license context.
      </p>

      <DashboardSection title="Licensing">
        <DashboardCard title="Packages" value={String(packageCount)} description="License packages registered through the centralized License Registry." />
        <DashboardCard title="Entitled Modules" value={String(totalModules)} description="Package module entitlements resolved through package inheritance." />
        <DashboardCard title="Entitled Capabilities" value={String(totalCapabilities)} description="Capability activation is controlled by entitlement validation." />
      </DashboardSection>

      <DashboardSection title="Separation">
        <DashboardCard title="Permissions" value="User" description="Permission Engine answers whether a user may perform an action." />
        <DashboardCard title="Configuration" value="Behavior" description="Configuration Framework answers how an available feature behaves." />
        <DashboardCard title="Licensing" value="Entitlement" description="License Engine answers whether a company is entitled to use a module or capability." />
      </DashboardSection>

      <DashboardSection title="Packages">
        {licensing.packages.map((licensePackage) => {
          const resolved = licensing.resolveLicense({ packageId: licensePackage.packageId });
          return (
            <DashboardCard
              key={licensePackage.packageId}
              title={licensePackage.packageName}
              value={licensePackage.packageId}
              description={`${resolved.licenseContext.purchasedModules.size} modules, ${resolved.licenseContext.purchasedCapabilities.size} capabilities, ${resolved.licenseContext.limits.length} limits.`}
            />
          );
        })}
      </DashboardSection>
    </div>
  );
}

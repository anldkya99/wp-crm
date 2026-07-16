import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformServiceFramework } from "@/lib/platform/services/service-framework";

export default function ServiceCenterFoundationPage() {
  const serviceFramework = getPlatformServiceFramework();
  const activeServices = serviceFramework.services.filter((service) => service.lifecycle === "active");
  const dependencyCount = serviceFramework.services.filter((service) => service.dependencies.length > 0).length;
  const deprecatedServices = serviceFramework.services.filter((service) => service.lifecycle === "deprecated");

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Platform Service Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Service Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for registered platform services, dependency resolution, standardized service context, lifecycle states, workflow execution, and event-driven service invocation.
      </p>

      <DashboardSection title="Service Framework">
        <DashboardCard title="Registered Services" value={String(serviceFramework.services.length)} description="Services are discoverable through the centralized Service Registry." />
        <DashboardCard title="Active Services" value={String(activeServices.length)} description="Active services are available through the Service Runtime." />
        <DashboardCard title="Dependencies" value={String(dependencyCount)} description="Service dependencies are validated and ordered by the framework." />
      </DashboardSection>

      <DashboardSection title="Runtime">
        <DashboardCard title="Executions" value={String(serviceFramework.executions.length)} description="Service execution records are tracked in-memory as a foundation." />
        <DashboardCard title="Event Bridge" value={serviceFramework.eventBridge.active ? "Active" : "Inactive"} description="Events may invoke registered services through the Service Framework." />
        <DashboardCard title="Deprecated" value={String(deprecatedServices.length)} description="Lifecycle metadata supports future deprecation and disablement flows." />
      </DashboardSection>

      <DashboardSection title="Service Registry">
        {serviceFramework.services.map((service) => (
          <DashboardCard
            key={service.serviceId}
            title={service.name}
            value={service.lifecycle}
            description={`${service.serviceId}. Version ${service.version}. Dependencies: ${service.dependencies.join(", ") || "none"}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}

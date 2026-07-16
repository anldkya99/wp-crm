import { DashboardCard, DashboardSection } from "@/app/opceo/_components/dashboard-card";
import { getPlatformWorkflowEngine } from "@/lib/platform/workflows/workflow-engine";

export default function WorkflowCenterFoundationPage() {
  const workflowEngine = getPlatformWorkflowEngine();
  const enabledWorkflows = workflowEngine.workflows.filter((workflow) => workflow.enabled);
  const eventDrivenWorkflows = workflowEngine.workflows.filter((workflow) => Boolean(workflow.trigger.eventId));

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C8A45D]">Workflow Framework</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Workflow Center</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9CA8A8]">
        Foundation for event-driven workflows, reusable triggers, reusable conditions, reusable actions, isolated execution, and future automation orchestration.
      </p>

      <DashboardSection title="Workflow Engine">
        <DashboardCard title="Workflows" value={String(workflowEngine.workflows.length)} description="Workflow manifests registered through the centralized Workflow Registry." />
        <DashboardCard title="Enabled" value={String(enabledWorkflows.length)} description="Enabled workflows are available to the Workflow Runtime." />
        <DashboardCard title="Event Driven" value={String(eventDrivenWorkflows.length)} description="Event-triggered workflows subscribe through the Platform Event Bus." />
      </DashboardSection>

      <DashboardSection title="Reusable Building Blocks">
        <DashboardCard title="Triggers" value={String(workflowEngine.triggers.length)} description="Platform event, company event, runtime event, manual, and scheduled trigger foundations are registered." />
        <DashboardCard title="Conditions" value={String(workflowEngine.conditions.length)} description="Reusable condition handlers are centralized in the Condition Engine." />
        <DashboardCard title="Actions" value={String(workflowEngine.actions.length)} description="Reusable action handlers are centralized in the Action Registry." />
      </DashboardSection>

      <DashboardSection title="Runtime">
        <DashboardCard title="Executions" value={String(workflowEngine.executions.length)} description="Workflow execution tracking is in-memory foundation only." />
        <DashboardCard title="Event Subscribers" value={String(workflowEngine.eventSubscriberCount)} description="Workflow subscribers are registered through the Event Framework." />
        <DashboardCard title="Isolation" value="Ready" description="Workflow Context exposes event, runtime, company, department, operator, configuration, and license context." />
      </DashboardSection>

      <DashboardSection title="Workflow Registry">
        {workflowEngine.workflows.map((workflow) => (
          <DashboardCard
            key={workflow.workflowId}
            title={workflow.name}
            value={workflow.enabled ? "Enabled" : "Disabled"}
            description={`${workflow.workflowId}. Trigger: ${workflow.trigger.type}${workflow.trigger.eventId ? ` (${workflow.trigger.eventId})` : ""}.`}
          />
        ))}
      </DashboardSection>
    </div>
  );
}

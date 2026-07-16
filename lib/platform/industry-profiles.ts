export type IndustryProfileKey =
  | "casino"
  | "customer_support"
  | "healthcare"
  | "retail"
  | "logistics"
  | "education"
  | "government"
  | "custom";

export type IndustryProfile = {
  key: IndustryProfileKey;
  name: string;
  departments: readonly string[];
  navigation: readonly string[];
  dashboard: readonly string[];
  templates: readonly string[];
  shortcuts: readonly string[];
  labels: Record<string, string>;
  reports: readonly string[];
};

export const industryProfiles: Record<IndustryProfileKey, IndustryProfile> = {
  casino: {
    key: "casino",
    name: "Casino",
    departments: ["VIP", "Bonus", "Risk", "Finance", "Support"],
    navigation: ["Dashboard", "Members", "Requests", "Messages"],
    dashboard: ["Active Members", "Open Requests", "Risk Queue"],
    templates: ["Welcome", "Bonus Follow Up", "Withdrawal Check"],
    shortcuts: ["VIP Review", "Bonus Approval"],
    labels: { customer: "Member", request: "Request" },
    reports: ["Operation Summary", "Risk Overview"]
  },
  customer_support: {
    key: "customer_support",
    name: "Customer Support",
    departments: ["Intake", "Support", "Escalation", "Quality"],
    navigation: ["Dashboard", "Tickets", "Customers", "Messages"],
    dashboard: ["Open Tickets", "SLA Watch", "Escalations"],
    templates: ["Greeting", "Resolution", "Escalation"],
    shortcuts: ["Create Ticket", "Escalate"],
    labels: { customer: "Customer", request: "Ticket" },
    reports: ["Support Summary", "SLA Overview"]
  },
  healthcare: {
    key: "healthcare",
    name: "Healthcare",
    departments: ["Reception", "Appointment", "Doctors", "Laboratory", "Billing"],
    navigation: ["Dashboard", "Patients", "Appointments", "Messages"],
    dashboard: ["Appointments", "Patient Queue", "Billing Tasks"],
    templates: ["Appointment Reminder", "Lab Follow Up"],
    shortcuts: ["Schedule", "Patient Note"],
    labels: { customer: "Patient", request: "Case" },
    reports: ["Appointment Summary", "Care Operations"]
  },
  retail: {
    key: "retail",
    name: "Retail",
    departments: ["Sales", "Support", "Returns", "Warehouse"],
    navigation: ["Dashboard", "Customers", "Orders", "Messages"],
    dashboard: ["Open Orders", "Returns", "Support Queue"],
    templates: ["Order Update", "Return Follow Up"],
    shortcuts: ["Order Check", "Customer Note"],
    labels: { customer: "Customer", request: "Order Request" },
    reports: ["Retail Operations", "Returns Overview"]
  },
  logistics: {
    key: "logistics",
    name: "Logistics",
    departments: ["Dispatch", "Tracking", "Warehouse", "Billing"],
    navigation: ["Dashboard", "Shipments", "Customers", "Messages"],
    dashboard: ["Active Shipments", "Exceptions", "Dispatch Queue"],
    templates: ["Tracking Update", "Delivery Exception"],
    shortcuts: ["Track Shipment", "Notify Customer"],
    labels: { customer: "Client", request: "Shipment" },
    reports: ["Logistics Summary", "Exception Report"]
  },
  education: {
    key: "education",
    name: "Education",
    departments: ["Admissions", "Student Support", "Finance", "Academics"],
    navigation: ["Dashboard", "Students", "Requests", "Messages"],
    dashboard: ["Admissions Queue", "Student Requests", "Finance Tasks"],
    templates: ["Admission Follow Up", "Student Support"],
    shortcuts: ["Student Note", "Application Review"],
    labels: { customer: "Student", request: "Request" },
    reports: ["Education Operations", "Admissions Overview"]
  },
  government: {
    key: "government",
    name: "Government",
    departments: ["Citizen Desk", "Case Review", "Field Operations", "Records"],
    navigation: ["Dashboard", "Citizens", "Cases", "Messages"],
    dashboard: ["Open Cases", "Citizen Queue", "Records Review"],
    templates: ["Case Update", "Document Request"],
    shortcuts: ["Case Note", "Escalate Case"],
    labels: { customer: "Citizen", request: "Case" },
    reports: ["Civic Operations", "Case Summary"]
  },
  custom: {
    key: "custom",
    name: "Custom",
    departments: ["Operations", "Support", "Finance"],
    navigation: ["Dashboard", "Customers", "Requests", "Messages"],
    dashboard: ["Open Work", "Customers", "Messages"],
    templates: ["Welcome", "Follow Up"],
    shortcuts: ["Create Note", "Follow Up"],
    labels: { customer: "Customer", request: "Request" },
    reports: ["Operations Summary"]
  }
};

export function getIndustryProfile(key: string) {
  return industryProfiles[key as IndustryProfileKey] ?? null;
}

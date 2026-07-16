import type { PlatformRole } from "@/types/domain";

export const platformPermissionDefinitions = {
  OP_CEO: {
    accessPanel: "op_ceo:access_panel"
  },
  Company: {
    accessModule: "company:access_module",
    manageCompanies: "company:manage_companies",
    manageCompany: "company:manage_company",
    manageOperators: "company:manage_operators"
  },
  Department: {
    accessModule: "department:access_module",
    manageDepartments: "department:manage_departments"
  },
  Operator: {
    accessModule: "operator:access_module"
  },
  Communications: {
    accessModule: "communications:access_module",
    manageModule: "communications:manage_module"
  },
  Management: {
    accessModule: "management:access_module",
    manageOperators: "management:manage_operators",
    manageDepartments: "management:manage_departments"
  },
  Analytics: {
    accessModule: "analytics:access_module",
    viewAnalytics: "analytics:view"
  },
  Engineering: {
    accessModule: "engineering:access_module",
    manageModule: "engineering:manage_module"
  },
  ProductCenter: {
    accessModule: "product_center:access_module",
    manageModule: "product_center:manage_module"
  }
} as const;

type PermissionDefinitionGroup = typeof platformPermissionDefinitions;
type Values<T> = T[keyof T];

export type PermissionGroup = keyof PermissionDefinitionGroup;
export type PlatformPermissionKey = {
  [Group in PermissionGroup]: Values<PermissionDefinitionGroup[Group]>;
}[PermissionGroup];

export type PlatformModuleKey =
  | "OP_CEO"
  | "Company"
  | "Department"
  | "Operator"
  | "Communications"
  | "Management"
  | "Analytics"
  | "Engineering"
  | "ProductCenter";

export const platformRolePermissionGrants: Record<PlatformRole, readonly PlatformPermissionKey[]> = {
  OP_CEO: [
    platformPermissionDefinitions.OP_CEO.accessPanel,
    platformPermissionDefinitions.Company.accessModule,
    platformPermissionDefinitions.Company.manageCompanies,
    platformPermissionDefinitions.Company.manageCompany,
    platformPermissionDefinitions.Company.manageOperators,
    platformPermissionDefinitions.Department.accessModule,
    platformPermissionDefinitions.Department.manageDepartments,
    platformPermissionDefinitions.Operator.accessModule,
    platformPermissionDefinitions.Communications.accessModule,
    platformPermissionDefinitions.Communications.manageModule,
    platformPermissionDefinitions.Management.accessModule,
    platformPermissionDefinitions.Management.manageOperators,
    platformPermissionDefinitions.Management.manageDepartments,
    platformPermissionDefinitions.Analytics.accessModule,
    platformPermissionDefinitions.Analytics.viewAnalytics,
    platformPermissionDefinitions.Engineering.accessModule,
    platformPermissionDefinitions.Engineering.manageModule,
    platformPermissionDefinitions.ProductCenter.accessModule,
    platformPermissionDefinitions.ProductCenter.manageModule
  ],
  COMPANY_BOSS: [
    platformPermissionDefinitions.Company.accessModule,
    platformPermissionDefinitions.Company.manageCompany,
    platformPermissionDefinitions.Company.manageOperators,
    platformPermissionDefinitions.Department.accessModule,
    platformPermissionDefinitions.Department.manageDepartments,
    platformPermissionDefinitions.Operator.accessModule,
    platformPermissionDefinitions.Communications.accessModule,
    platformPermissionDefinitions.Communications.manageModule,
    platformPermissionDefinitions.Management.accessModule,
    platformPermissionDefinitions.Management.manageOperators,
    platformPermissionDefinitions.Management.manageDepartments,
    platformPermissionDefinitions.Analytics.accessModule,
    platformPermissionDefinitions.Analytics.viewAnalytics
  ],
  COMPANY_ADMIN: [
    platformPermissionDefinitions.Company.accessModule,
    platformPermissionDefinitions.Company.manageCompany,
    platformPermissionDefinitions.Company.manageOperators,
    platformPermissionDefinitions.Department.accessModule,
    platformPermissionDefinitions.Department.manageDepartments,
    platformPermissionDefinitions.Operator.accessModule,
    platformPermissionDefinitions.Communications.accessModule,
    platformPermissionDefinitions.Communications.manageModule,
    platformPermissionDefinitions.Management.accessModule,
    platformPermissionDefinitions.Management.manageOperators,
    platformPermissionDefinitions.Management.manageDepartments,
    platformPermissionDefinitions.Analytics.accessModule,
    platformPermissionDefinitions.Analytics.viewAnalytics
  ],
  DEPARTMENT_ADMIN: [
    platformPermissionDefinitions.Department.accessModule,
    platformPermissionDefinitions.Operator.accessModule,
    platformPermissionDefinitions.Communications.accessModule,
    platformPermissionDefinitions.Management.accessModule,
    platformPermissionDefinitions.Analytics.accessModule,
    platformPermissionDefinitions.Analytics.viewAnalytics
  ],
  OPERATOR: [
    platformPermissionDefinitions.Operator.accessModule,
    platformPermissionDefinitions.Communications.accessModule
  ]
};

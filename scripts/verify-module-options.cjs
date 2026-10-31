const fs = require("fs");
const path = require("path");

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const checks = [
  {
    name: "Duplicate option type registration is rejected",
    pass: () => read("lib/platform/modules/options/option-type-validation.ts").includes("DUPLICATE_OPTION_TYPE")
  },
  {
    name: "Unknown moduleId is rejected",
    pass: () => read("lib/platform/modules/options/option-type-validation.ts").includes("UNKNOWN_MODULE")
  },
  {
    name: "Unknown optionTypeKey is rejected",
    pass: () => read("lib/platform/modules/options/module-option-service.ts").includes("UNKNOWN_OPTION_TYPE")
  },
  {
    name: "Invalid configurationJson is rejected",
    pass: () => read("lib/platform/modules/options/module-option-service.ts").includes("INVALID_CONFIGURATION")
  },
  {
    name: "Platform scope cannot include companyId",
    pass: () => read("prisma/migrations/20260729090000_add_module_option_layer/migration.sql").includes("\"scope\" = 'PLATFORM' AND \"company_id\" IS NULL")
  },
  {
    name: "Company scope requires companyId",
    pass: () => read("prisma/migrations/20260729090000_add_module_option_layer/migration.sql").includes("\"scope\" = 'COMPANY' AND \"company_id\" IS NOT NULL")
  },
  {
    name: "Company scope mismatch is rejected",
    pass: () => read("lib/platform/modules/options/module-option-service.ts").includes("COMPANY_SCOPE_MISMATCH")
  },
  {
    name: "Permission Engine gates module options",
    pass: () => read("lib/platform/modules/options/module-option-service.ts").includes("platformPermissionDefinitions.ModuleOptions")
  },
  {
    name: "Platform scope requires managePlatform",
    pass: () => read("lib/platform/modules/options/module-option-service.ts").includes("managePlatform")
  },
  {
    name: "Company scope requires manageCompany",
    pass: () => read("lib/platform/modules/options/module-option-service.ts").includes("manageCompany")
  },
  {
    name: "Platform key uniqueness is enforced",
    pass: () => read("prisma/migrations/20260729090000_add_module_option_layer/migration.sql").includes("module_options_platform_unique_key")
  },
  {
    name: "Company key uniqueness is enforced",
    pass: () => read("prisma/migrations/20260729090000_add_module_option_layer/migration.sql").includes("module_options_company_unique_key")
  },
  {
    name: "Archived key reuse is blocked by unique indexes",
    pass: () => !read("prisma/migrations/20260729090000_add_module_option_layer/migration.sql").includes("status") || read("prisma/migrations/20260729090000_add_module_option_layer/migration.sql").includes("module_options_company_unique_key")
  },
  {
    name: "No hard delete service method exists",
    pass: () => !/delete\s*\(/.test(read("lib/platform/modules/options/module-option-service.ts"))
  },
  {
    name: "Archived records are hidden by default",
    pass: () => read("lib/platform/modules/options/prisma-module-option-repository.ts").includes('where.status = { not: "ARCHIVED" }')
  },
  {
    name: "Mutations write audit",
    pass: () => (read("lib/platform/modules/options/module-option-service.ts").match(/writeAudit/g) || []).length >= 5
  },
  {
    name: "Option and audit use one transaction",
    pass: () => read("lib/platform/modules/options/module-option-service.ts").includes("runInTransaction")
  },
  {
    name: "Old version update is rejected",
    pass: () => read("lib/platform/modules/options/prisma-module-option-repository.ts").includes("version: data.expectedVersion")
  },
  {
    name: "Version increments after mutations",
    pass: () => read("lib/platform/modules/options/prisma-module-option-repository.ts").includes("version: { increment: 1 }")
  },
  {
    name: "Only the Prisma adapter imports Prisma client in option layer",
    pass: () => {
      const files = walk(path.join(root, "lib/platform/modules/options")).filter((file) => file.endsWith(".ts"));
      const offenders = files.filter((file) => {
        const normalized = file.replaceAll("\\", "/");
        const content = fs.readFileSync(file, "utf8");
        return content.includes("@/lib/prisma") && !normalized.endsWith("prisma-module-option-repository.ts") && !normalized.endsWith("module-option-auth.ts");
      });
      return offenders.length === 0;
    }
  }
];

const failures = checks.filter((check) => !check.pass());
checks.forEach((check) => {
  console.log(`${failures.includes(check) ? "FAIL" : "PASS"} ${check.name}`);
});

if (failures.length > 0) {
  process.exitCode = 1;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

CREATE TYPE "ModuleOptionStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED');

CREATE TYPE "ModuleOptionScope" AS ENUM ('PLATFORM', 'COMPANY');

CREATE TABLE "platform_audit_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "event_type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "module_options" (
  "id" TEXT NOT NULL,
  "module_id" TEXT NOT NULL,
  "option_type_key" TEXT NOT NULL,
  "scope" "ModuleOptionScope" NOT NULL,
  "company_id" TEXT,
  "key" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "description" TEXT,
  "configuration_json" JSONB NOT NULL,
  "metadata_json" JSONB,
  "status" "ModuleOptionStatus" NOT NULL DEFAULT 'DISABLED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_by_id" TEXT,
  "updated_by_id" TEXT,
  "archived_by_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "module_options_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "module_options_scope_company_check" CHECK (
    ("scope" = 'PLATFORM' AND "company_id" IS NULL)
    OR
    ("scope" = 'COMPANY' AND "company_id" IS NOT NULL)
  ),
  CONSTRAINT "module_options_version_check" CHECK ("version" >= 1)
);

CREATE INDEX "platform_audit_logs_event_type_idx" ON "platform_audit_logs"("event_type");
CREATE INDEX "platform_audit_logs_created_at_idx" ON "platform_audit_logs"("created_at");

CREATE INDEX "module_options_module_id_option_type_key_idx" ON "module_options"("module_id", "option_type_key");
CREATE INDEX "module_options_scope_status_idx" ON "module_options"("scope", "status");
CREATE INDEX "module_options_company_id_module_id_option_type_key_idx" ON "module_options"("company_id", "module_id", "option_type_key");

CREATE UNIQUE INDEX "module_options_platform_unique_key" ON "module_options"("module_id", "option_type_key", "key")
WHERE "scope" = 'PLATFORM' AND "company_id" IS NULL;

CREATE UNIQUE INDEX "module_options_company_unique_key" ON "module_options"("company_id", "module_id", "option_type_key", "key")
WHERE "scope" = 'COMPANY' AND "company_id" IS NOT NULL;

ALTER TABLE "module_options" ADD CONSTRAINT "module_options_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

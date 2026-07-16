CREATE TABLE "company_capabilities" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "module_id" TEXT NOT NULL,
  "capability_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "permission_group" TEXT NOT NULL,
  "license_requirement" TEXT NOT NULL,
  "feature_flags_json" JSONB NOT NULL DEFAULT '[]',
  "dependencies_json" JSONB NOT NULL DEFAULT '[]',
  "default_enabled" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "lifecycle_state" TEXT NOT NULL DEFAULT 'registered',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "company_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_capabilities_company_id_capability_id_key"
  ON "company_capabilities"("company_id", "capability_id");

CREATE INDEX "company_capabilities_module_id_idx" ON "company_capabilities"("module_id");

ALTER TABLE "company_capabilities" ADD CONSTRAINT "company_capabilities_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

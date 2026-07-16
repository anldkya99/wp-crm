CREATE TABLE "configuration_versions" (
  "id" TEXT NOT NULL,
  "configuration_id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "company_id" TEXT,
  "department_id" TEXT,
  "operator_id" TEXT,
  "previous_value_json" JSONB,
  "new_value_json" JSONB NOT NULL,
  "changed_by" TEXT,
  "version" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "configuration_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "configuration_versions_configuration_id_scope_idx"
  ON "configuration_versions"("configuration_id", "scope");

CREATE INDEX "configuration_versions_company_id_configuration_id_idx"
  ON "configuration_versions"("company_id", "configuration_id");

ALTER TABLE "configuration_versions" ADD CONSTRAINT "configuration_versions_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

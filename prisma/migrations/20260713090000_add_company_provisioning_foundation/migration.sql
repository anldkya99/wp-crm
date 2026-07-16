ALTER TABLE "companies" ADD COLUMN "company_type" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "companies" ADD COLUMN "industry_profile" TEXT NOT NULL DEFAULT 'custom';
ALTER TABLE "companies" ADD COLUMN "license_package" TEXT NOT NULL DEFAULT 'starter';
ALTER TABLE "companies" ADD COLUMN "license_status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "companies" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'TR';
ALTER TABLE "companies" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul';
ALTER TABLE "companies" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'tr';
ALTER TABLE "companies" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TRY';
ALTER TABLE "companies" ADD COLUMN "logo_url" TEXT;
ALTER TABLE "companies" ADD COLUMN "created_by" TEXT;

CREATE TABLE "departments" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_company_id_slug_key" ON "departments"("company_id", "slug");

ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN "department_id" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "company_modules" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "module_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "navigation_group" TEXT NOT NULL,
  "permission_group" TEXT NOT NULL,
  "license_requirement" TEXT NOT NULL,
  "feature_flag" TEXT,
  "audit_enabled" BOOLEAN NOT NULL DEFAULT false,
  "dependencies_json" JSONB NOT NULL DEFAULT '[]',
  "default_enabled" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "company_modules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_modules_company_id_module_id_key" ON "company_modules"("company_id", "module_id");

ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "company_feature_flags" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL DEFAULT 'provisioning',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "company_feature_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_feature_flags_company_id_key_key" ON "company_feature_flags"("company_id", "key");

ALTER TABLE "company_feature_flags" ADD CONSTRAINT "company_feature_flags_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "company_settings" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_settings_company_id_key_key" ON "company_settings"("company_id", "key");

ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "company_permission_grants" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "platform_role" "PlatformRole" NOT NULL,
  "permission" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_permission_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_permission_grants_company_id_platform_role_permission_key"
  ON "company_permission_grants"("company_id", "platform_role", "permission");

ALTER TABLE "company_permission_grants" ADD CONSTRAINT "company_permission_grants_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "company_audit_logs" (
  "id" TEXT NOT NULL,
  "company_id" TEXT,
  "actor_id" TEXT,
  "event_type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "company_audit_logs_company_id_created_at_idx" ON "company_audit_logs"("company_id", "created_at");
CREATE INDEX "company_audit_logs_event_type_idx" ON "company_audit_logs"("event_type");

ALTER TABLE "company_audit_logs" ADD CONSTRAINT "company_audit_logs_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

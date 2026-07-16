CREATE TYPE "PlatformRole" AS ENUM ('OP_CEO', 'COMPANY_BOSS', 'COMPANY_ADMIN', 'DEPARTMENT_ADMIN', 'OPERATOR');

ALTER TABLE "users" ADD COLUMN "platform_role" "PlatformRole" NOT NULL DEFAULT 'OPERATOR';

UPDATE "users"
SET "platform_role" = CASE
  WHEN "role" = 'ADMIN' THEN 'COMPANY_ADMIN'::"PlatformRole"
  WHEN "role" = 'TEAM_LEAD' THEN 'DEPARTMENT_ADMIN'::"PlatformRole"
  ELSE 'OPERATOR'::"PlatformRole"
END;

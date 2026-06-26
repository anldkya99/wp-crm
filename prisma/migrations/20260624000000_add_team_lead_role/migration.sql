ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TEAM_LEAD';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "team_lead_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_team_lead_id_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_team_lead_id_fkey"
      FOREIGN KEY ("team_lead_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

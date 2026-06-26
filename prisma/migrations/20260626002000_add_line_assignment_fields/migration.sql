ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "assigned_operator_id" TEXT;
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "assigned_at" TIMESTAMP(3);
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "assigned_by_admin_id" TEXT;
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "assignment_note" TEXT;

CREATE INDEX IF NOT EXISTS "communication_lines_assigned_operator_id_idx" ON "communication_lines"("assigned_operator_id");

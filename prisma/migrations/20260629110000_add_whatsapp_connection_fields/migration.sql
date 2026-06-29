ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "connection_status" TEXT NOT NULL DEFAULT 'disconnected';
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "session_path" TEXT;
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "qr_updated_at" TIMESTAMP(3);
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "last_disconnected_at" TIMESTAMP(3);
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "last_error" TEXT;
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "is_active_operation_line" BOOLEAN NOT NULL DEFAULT false;

UPDATE "communication_lines"
SET "connection_status" = CASE
  WHEN "status" = 'connected' THEN 'connected'
  WHEN "status" = 'connecting' THEN 'connecting'
  WHEN "status" = 'qr_waiting' THEN 'qr_pending'
  WHEN "status" = 'blocked' THEN 'error'
  ELSE 'disconnected'
END
WHERE "connection_status" IS NULL OR "connection_status" = 'disconnected';

UPDATE "communication_lines"
SET "is_active_operation_line" = "is_default"
WHERE "is_active_operation_line" = false AND "is_default" = true;

CREATE INDEX IF NOT EXISTS "communication_lines_connection_status_idx" ON "communication_lines"("connection_status");
CREATE INDEX IF NOT EXISTS "communication_lines_is_active_operation_line_idx" ON "communication_lines"("is_active_operation_line");

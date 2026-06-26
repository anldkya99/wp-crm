CREATE TABLE IF NOT EXISTS "whatsapp_session_logs" (
  "id" TEXT NOT NULL,
  "line_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "details" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "whatsapp_session_logs_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_session_logs_line_id_fkey') THEN
    ALTER TABLE "whatsapp_session_logs"
      ADD CONSTRAINT "whatsapp_session_logs_line_id_fkey"
      FOREIGN KEY ("line_id") REFERENCES "communication_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "whatsapp_session_logs_line_id_idx" ON "whatsapp_session_logs"("line_id");
CREATE INDEX IF NOT EXISTS "whatsapp_session_logs_event_type_idx" ON "whatsapp_session_logs"("event_type");
CREATE INDEX IF NOT EXISTS "whatsapp_session_logs_created_at_idx" ON "whatsapp_session_logs"("created_at");

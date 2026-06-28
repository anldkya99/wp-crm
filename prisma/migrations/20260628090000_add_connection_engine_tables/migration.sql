CREATE TABLE IF NOT EXISTS "communication_sessions" (
  "id" TEXT NOT NULL,
  "line_id" TEXT NOT NULL,
  "provider_type" TEXT NOT NULL,
  "session_status" TEXT NOT NULL DEFAULT 'disconnected',
  "qr_code" TEXT,
  "last_qr_at" TIMESTAMP(3),
  "connected_at" TIMESTAMP(3),
  "disconnected_at" TIMESTAMP(3),
  "last_health_check_at" TIMESTAMP(3),
  "reconnect_attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "session_storage_path" TEXT,
  "session_key" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "communication_sessions_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_sessions_line_id_key') THEN
    ALTER TABLE "communication_sessions" ADD CONSTRAINT "communication_sessions_line_id_key" UNIQUE ("line_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_sessions_line_id_fkey') THEN
    ALTER TABLE "communication_sessions"
      ADD CONSTRAINT "communication_sessions_line_id_fkey"
      FOREIGN KEY ("line_id") REFERENCES "communication_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "communication_sessions_provider_type_idx" ON "communication_sessions"("provider_type");
CREATE INDEX IF NOT EXISTS "communication_sessions_session_status_idx" ON "communication_sessions"("session_status");

CREATE TABLE IF NOT EXISTS "connection_activity_logs" (
  "id" TEXT NOT NULL,
  "line_id" TEXT,
  "provider_type" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "details" TEXT,
  "metadata_json" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "connection_activity_logs_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'connection_activity_logs_line_id_fkey') THEN
    ALTER TABLE "connection_activity_logs"
      ADD CONSTRAINT "connection_activity_logs_line_id_fkey"
      FOREIGN KEY ("line_id") REFERENCES "communication_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "connection_activity_logs_line_id_idx" ON "connection_activity_logs"("line_id");
CREATE INDEX IF NOT EXISTS "connection_activity_logs_provider_type_idx" ON "connection_activity_logs"("provider_type");
CREATE INDEX IF NOT EXISTS "connection_activity_logs_event_type_idx" ON "connection_activity_logs"("event_type");
CREATE INDEX IF NOT EXISTS "connection_activity_logs_created_at_idx" ON "connection_activity_logs"("created_at");

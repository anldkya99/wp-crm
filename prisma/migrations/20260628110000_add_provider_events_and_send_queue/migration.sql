ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "provider_type" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "provider_message_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_line_id_idx') THEN
    CREATE INDEX "messages_line_id_idx" ON "messages"("line_id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_provider_type_provider_message_id_key') THEN
    CREATE UNIQUE INDEX "messages_provider_type_provider_message_id_key" ON "messages"("provider_type", "provider_message_id");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "communication_events" (
  "id" TEXT NOT NULL,
  "line_id" TEXT,
  "provider_type" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "provider_message_id" TEXT,
  "contact_phone" TEXT,
  "payload_json" TEXT,
  "status" TEXT NOT NULL DEFAULT 'received',
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_events_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communication_events_line_id_fkey') THEN
    ALTER TABLE "communication_events"
      ADD CONSTRAINT "communication_events_line_id_fkey"
      FOREIGN KEY ("line_id") REFERENCES "communication_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'communication_events_provider_type_provider_message_id_event_type_key') THEN
    CREATE UNIQUE INDEX "communication_events_provider_type_provider_message_id_event_type_key" ON "communication_events"("provider_type", "provider_message_id", "event_type");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "communication_events_line_id_idx" ON "communication_events"("line_id");
CREATE INDEX IF NOT EXISTS "communication_events_provider_type_idx" ON "communication_events"("provider_type");
CREATE INDEX IF NOT EXISTS "communication_events_event_type_idx" ON "communication_events"("event_type");
CREATE INDEX IF NOT EXISTS "communication_events_created_at_idx" ON "communication_events"("created_at");

CREATE TABLE IF NOT EXISTS "message_send_queue" (
  "id" TEXT NOT NULL,
  "message_id" TEXT,
  "line_id" TEXT NOT NULL,
  "provider_type" TEXT NOT NULL,
  "recipient_phone" TEXT NOT NULL,
  "message_text" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 3,
  "next_attempt_at" TIMESTAMP(3),
  "last_error" TEXT,
  "provider_message_id" TEXT,
  "metadata_json" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "sent_at" TIMESTAMP(3),
  CONSTRAINT "message_send_queue_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_send_queue_message_id_fkey') THEN
    ALTER TABLE "message_send_queue"
      ADD CONSTRAINT "message_send_queue_message_id_fkey"
      FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_send_queue_line_id_fkey') THEN
    ALTER TABLE "message_send_queue"
      ADD CONSTRAINT "message_send_queue_line_id_fkey"
      FOREIGN KEY ("line_id") REFERENCES "communication_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "message_send_queue_line_id_idx" ON "message_send_queue"("line_id");
CREATE INDEX IF NOT EXISTS "message_send_queue_provider_type_idx" ON "message_send_queue"("provider_type");
CREATE INDEX IF NOT EXISTS "message_send_queue_status_idx" ON "message_send_queue"("status");
CREATE INDEX IF NOT EXISTS "message_send_queue_next_attempt_at_idx" ON "message_send_queue"("next_attempt_at");

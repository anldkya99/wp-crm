ALTER TABLE "message_send_queue" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "message_send_queue" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);
ALTER TABLE "message_send_queue" ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "message_send_queue_priority_idx" ON "message_send_queue"("priority");
CREATE INDEX IF NOT EXISTS "message_send_queue_scheduled_at_idx" ON "message_send_queue"("scheduled_at");

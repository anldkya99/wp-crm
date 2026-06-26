CREATE TABLE IF NOT EXISTS "timeline_events" (
  "id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  "operator_id" TEXT,
  "event_type" TEXT NOT NULL,
  "event_title" TEXT NOT NULL,
  "event_description" TEXT,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'timeline_events_member_id_fkey'
  ) THEN
    ALTER TABLE "timeline_events"
      ADD CONSTRAINT "timeline_events_member_id_fkey"
      FOREIGN KEY ("member_id") REFERENCES "contacts"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'timeline_events_operator_id_fkey'
  ) THEN
    ALTER TABLE "timeline_events"
      ADD CONSTRAINT "timeline_events_operator_id_fkey"
      FOREIGN KEY ("operator_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "timeline_events_member_id_created_at_idx" ON "timeline_events"("member_id", "created_at");
CREATE INDEX IF NOT EXISTS "timeline_events_reference_type_reference_id_idx" ON "timeline_events"("reference_type", "reference_id");

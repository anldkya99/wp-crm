ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "line_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_line_id_fkey') THEN
    ALTER TABLE "conversations"
      ADD CONSTRAINT "conversations_line_id_fkey"
      FOREIGN KEY ("line_id") REFERENCES "communication_lines"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "conversations_line_id_idx" ON "conversations"("line_id");

ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "replacement_of_line_id" TEXT;
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "replaced_by_line_id" TEXT;
ALTER TABLE "communication_lines" ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);

CREATE TABLE "task_notes" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "note_text" TEXT NOT NULL,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "task_notes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "task_notes"
ADD CONSTRAINT "task_notes_task_id_fkey"
FOREIGN KEY ("task_id") REFERENCES "daily_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_notes"
ADD CONSTRAINT "task_notes_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "automation_task_logs" (
  "id" TEXT NOT NULL,
  "rule_key" TEXT NOT NULL,
  "member_id" TEXT,
  "task_id" TEXT,
  "task_title" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "explanation" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_task_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "automation_task_logs_created_at_idx" ON "automation_task_logs"("created_at");

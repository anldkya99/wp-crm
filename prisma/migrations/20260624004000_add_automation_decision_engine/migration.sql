ALTER TABLE "daily_tasks" ADD COLUMN IF NOT EXISTS "automation_rule_key" TEXT;
ALTER TABLE "daily_tasks" ADD COLUMN IF NOT EXISTS "automation_reason" TEXT;
ALTER TABLE "daily_tasks" ADD COLUMN IF NOT EXISTS "automation_questions_json" JSONB;

CREATE TABLE IF NOT EXISTS "automation_decision_logs" (
  "id" TEXT NOT NULL,
  "member_id" TEXT,
  "operator_id" TEXT,
  "rule_key" TEXT NOT NULL,
  "decision_type" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "question_answers_json" JSONB NOT NULL,
  "created_task_id" TEXT,
  "completed_task_id" TEXT,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "automation_decision_logs_created_at_idx" ON "automation_decision_logs"("created_at");

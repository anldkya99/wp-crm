CREATE TABLE "operator_line_sessions" (
  "id" TEXT NOT NULL,
  "operator_id" TEXT NOT NULL,
  "line_id" TEXT NOT NULL,
  "slot_number" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "opened_at" TIMESTAMP(3),
  "last_used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "operator_line_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operator_line_sessions_operator_id_slot_number_key" ON "operator_line_sessions"("operator_id", "slot_number");
CREATE INDEX "operator_line_sessions_operator_id_idx" ON "operator_line_sessions"("operator_id");
CREATE INDEX "operator_line_sessions_line_id_idx" ON "operator_line_sessions"("line_id");
ALTER TABLE "operator_line_sessions" ADD CONSTRAINT "operator_line_sessions_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operator_line_sessions" ADD CONSTRAINT "operator_line_sessions_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "communication_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

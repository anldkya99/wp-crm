CREATE UNIQUE INDEX IF NOT EXISTS "operator_line_sessions_active_line_unique" ON "operator_line_sessions"("line_id") WHERE "is_active" = true;

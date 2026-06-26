ALTER TABLE "users" ADD COLUMN "tts_daily_limit" INTEGER NOT NULL DEFAULT 50;

CREATE TABLE "tts_usage_logs" (
    "id" TEXT NOT NULL,
    "operator_id" TEXT,
    "member_id" TEXT,
    "message_text" TEXT NOT NULL,
    "character_count" INTEGER NOT NULL,
    "estimated_token_count" INTEGER NOT NULL,
    "audio_duration_seconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "audio_file_url" TEXT NOT NULL,
    "audio_file_size_bytes" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(10, 6) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tts_usage_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tts_usage_logs" ADD CONSTRAINT "tts_usage_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tts_usage_logs" ADD CONSTRAINT "tts_usage_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

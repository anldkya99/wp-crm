ALTER TABLE "tts_usage_logs" ADD COLUMN "message_id" TEXT;
ALTER TABLE "tts_usage_logs" ADD COLUMN "file_size_bytes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tts_usage_logs" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'created';
ALTER TABLE "tts_usage_logs" ADD COLUMN "error_message" TEXT;
ALTER TABLE "tts_usage_logs" ADD COLUMN "sent_at" TIMESTAMP(3);

UPDATE "tts_usage_logs" SET "file_size_bytes" = "audio_file_size_bytes" WHERE "file_size_bytes" = 0;

ALTER TABLE "tts_usage_logs" ADD CONSTRAINT "tts_usage_logs_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

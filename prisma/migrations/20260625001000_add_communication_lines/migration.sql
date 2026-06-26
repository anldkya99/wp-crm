CREATE TABLE "communication_lines" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone_number" TEXT NOT NULL,
  "country_code" TEXT NOT NULL DEFAULT '+90',
  "provider_type" TEXT NOT NULL DEFAULT 'manual',
  "status" TEXT NOT NULL DEFAULT 'active',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "last_connected_at" TIMESTAMP(3),
  "last_message_at" TIMESTAMP(3),
  "blocked_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "communication_lines_is_default_idx" ON "communication_lines"("is_default");

ALTER TABLE "messages" ADD COLUMN "line_id" TEXT;
ALTER TABLE "messages" ADD CONSTRAINT "messages_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "communication_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

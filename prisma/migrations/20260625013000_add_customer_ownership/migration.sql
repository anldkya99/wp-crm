ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "owner_operator_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "ownership_status" TEXT NOT NULL DEFAULT 'pool';
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "assigned_at" TIMESTAMP(3);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "last_contact_at" TIMESTAMP(3);
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "assigned_by_admin_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "ownership_notes" TEXT;

CREATE TABLE IF NOT EXISTS "contact_ownership_requests" (
  "id" TEXT NOT NULL,
  "contact_id" TEXT NOT NULL,
  "customer_phone" TEXT NOT NULL,
  "requested_by_operator_id" TEXT,
  "current_owner_operator_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "note" TEXT,
  "decision_note" TEXT,
  "decided_by_admin_id" TEXT,
  "decided_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contact_ownership_requests_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_ownership_requests_contact_id_fkey') THEN
    ALTER TABLE "contact_ownership_requests"
      ADD CONSTRAINT "contact_ownership_requests_contact_id_fkey"
      FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "contact_ownership_requests_contact_id_idx" ON "contact_ownership_requests"("contact_id");
CREATE INDEX IF NOT EXISTS "contact_ownership_requests_status_idx" ON "contact_ownership_requests"("status");

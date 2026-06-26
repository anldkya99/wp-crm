ALTER TABLE "contacts" ADD COLUMN "first_name" TEXT;
ALTER TABLE "contacts" ADD COLUMN "last_name" TEXT;
ALTER TABLE "contacts" ADD COLUMN "username" TEXT;
ALTER TABLE "contacts" ADD COLUMN "national_id" TEXT;
ALTER TABLE "contacts" ADD COLUMN "member_status" TEXT NOT NULL DEFAULT 'Aktif';
ALTER TABLE "contacts" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'Manuel';

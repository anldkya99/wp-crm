CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED');

CREATE TYPE "AlarmStatus" AS ENUM ('PENDING', 'SNOOZED', 'COMPLETED', 'CLOSED');

CREATE TABLE "daily_tasks" (
  "id" TEXT NOT NULL,
  "contact_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "task_date" DATE NOT NULL,
  "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "daily_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alarms" (
  "id" TEXT NOT NULL,
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "note" TEXT NOT NULL,
  "status" "AlarmStatus" NOT NULL DEFAULT 'PENDING',
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "alarms_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "daily_tasks"
ADD CONSTRAINT "daily_tasks_contact_id_fkey"
FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

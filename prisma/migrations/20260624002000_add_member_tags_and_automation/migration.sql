ALTER TABLE "daily_tasks" ADD COLUMN IF NOT EXISTS "due_at" TIMESTAMP(3);
ALTER TABLE "daily_tasks" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'Manuel';
ALTER TABLE "daily_tasks" ADD COLUMN IF NOT EXISTS "source_reference_id" TEXT;

CREATE TABLE IF NOT EXISTS "member_tags" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT 'slate',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "member_tags_name_key" ON "member_tags"("name");

CREATE TABLE IF NOT EXISTS "member_tag_relations" (
  "id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_tag_relations_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'member_tag_relations_member_id_fkey') THEN
    ALTER TABLE "member_tag_relations"
      ADD CONSTRAINT "member_tag_relations_member_id_fkey"
      FOREIGN KEY ("member_id") REFERENCES "contacts"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'member_tag_relations_tag_id_fkey') THEN
    ALTER TABLE "member_tag_relations"
      ADD CONSTRAINT "member_tag_relations_tag_id_fkey"
      FOREIGN KEY ("tag_id") REFERENCES "member_tags"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "member_tag_relations_member_id_tag_id_key" ON "member_tag_relations"("member_id", "tag_id");

CREATE TABLE IF NOT EXISTS "automation_rule_settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "value" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "automation_rule_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "automation_rule_settings_key_key" ON "automation_rule_settings"("key");

INSERT INTO "member_tags" ("id", "name", "color")
VALUES
  ('tag_vip', 'VIP', 'emerald'),
  ('tag_riskli', 'Riskli', 'rose'),
  ('tag_bonus_avcisi', 'Bonus Avcısı', 'amber'),
  ('tag_yeni_uye', 'Yeni Üye', 'sky'),
  ('tag_pasif', 'Pasif', 'slate'),
  ('tag_yuksek_potansiyel', 'Yüksek Potansiyel', 'mint'),
  ('tag_cekim_bekliyor', 'Çekim Bekliyor', 'violet'),
  ('tag_aktif_takip', 'Aktif Takip', 'cyan')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "automation_rule_settings" ("id", "key", "enabled", "value", "updated_at")
VALUES
  ('auto_engine_enabled', 'engine_enabled', true, NULL, CURRENT_TIMESTAMP),
  ('auto_new_member_task', 'new_member_task', true, NULL, CURRENT_TIMESTAMP),
  ('auto_inactive_member_task', 'inactive_member_task', true, '3', CURRENT_TIMESTAMP),
  ('auto_request_control_task', 'request_control_task', true, '30', CURRENT_TIMESTAMP),
  ('auto_voice_followup_task', 'voice_followup_task', true, '120', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

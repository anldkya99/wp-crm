ALTER TABLE "message_templates"
ADD COLUMN "hashtag" TEXT NOT NULL DEFAULT '';

UPDATE "message_templates"
SET "hashtag" = "title"
WHERE "hashtag" = '';

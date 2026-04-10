-- Add EXTERNAL_API to ScheduledMessageType enum
ALTER TYPE "ScheduledMessageType" ADD VALUE IF NOT EXISTS 'EXTERNAL_API';

-- Create api_keys table
CREATE TABLE "api_keys" (
    "id"           TEXT NOT NULL,
    "key_hash"     TEXT NOT NULL,
    "label"        TEXT NOT NULL,
    "tenant_id"    TEXT,
    "is_active"    BOOLEAN NOT NULL DEFAULT true,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

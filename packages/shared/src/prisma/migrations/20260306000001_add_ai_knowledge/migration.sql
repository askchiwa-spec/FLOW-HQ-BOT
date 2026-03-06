-- Add AI and knowledge base fields to tenant_configs
ALTER TABLE "tenant_configs"
  ADD COLUMN "business_context" TEXT,
  ADD COLUMN "ai_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "website_url" TEXT;

-- Create business_documents table
CREATE TABLE "business_documents" (
  "id"           TEXT NOT NULL,
  "tenant_id"    TEXT NOT NULL,
  "filename"     TEXT NOT NULL,
  "file_type"    TEXT NOT NULL,
  "file_path"    TEXT,
  "url"          TEXT,
  "content_text" TEXT,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "business_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "business_documents_tenant_id_idx" ON "business_documents"("tenant_id");

ALTER TABLE "business_documents"
  ADD CONSTRAINT "business_documents_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create conversation_messages table
CREATE TABLE "conversation_messages" (
  "id"         TEXT NOT NULL,
  "tenant_id"  TEXT NOT NULL,
  "contact"    TEXT NOT NULL,
  "role"       TEXT NOT NULL,
  "content"    TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "conversation_messages_tenant_id_contact_created_at_idx"
  ON "conversation_messages"("tenant_id", "contact", "created_at");

ALTER TABLE "conversation_messages"
  ADD CONSTRAINT "conversation_messages_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

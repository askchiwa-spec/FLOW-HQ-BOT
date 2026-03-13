-- Fix cascade deletes: allow tenant deletion without orphaning related records

-- SetupRequest: cascade delete when tenant is deleted
ALTER TABLE "setup_requests" DROP CONSTRAINT IF EXISTS "setup_requests_tenant_id_fkey";
ALTER TABLE "setup_requests" ADD CONSTRAINT "setup_requests_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SetupRequest: cascade delete when user is deleted
ALTER TABLE "setup_requests" DROP CONSTRAINT IF EXISTS "setup_requests_user_id_fkey";
ALTER TABLE "setup_requests" ADD CONSTRAINT "setup_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User: set null when tenant is deleted (tenant_id is nullable)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_tenant_id_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

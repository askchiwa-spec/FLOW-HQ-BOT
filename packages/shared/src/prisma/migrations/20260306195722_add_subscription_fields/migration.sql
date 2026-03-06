-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "subscription_end_date" TIMESTAMP(3),
ADD COLUMN     "subscription_status" TEXT NOT NULL DEFAULT 'ACTIVE';

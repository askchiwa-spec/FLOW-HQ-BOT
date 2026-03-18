-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "FollowupStatus" AS ENUM ('ACTIVE', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ScheduledMessageType" AS ENUM ('APPOINTMENT_REMINDER_24H', 'APPOINTMENT_REMINDER_2H', 'APPOINTMENT_MISSED', 'ORDER_FOLLOWUP');

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "contact_name" TEXT,
    "service" TEXT,
    "appointment_at" TIMESTAMP(3),
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "reminder_24h_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_2h_sent" BOOLEAN NOT NULL DEFAULT false,
    "missed_sent" BOOLEAN NOT NULL DEFAULT false,
    "raw_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_followups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "order_summary" TEXT,
    "status" "FollowupStatus" NOT NULL DEFAULT 'ACTIVE',
    "followup_count" INTEGER NOT NULL DEFAULT 0,
    "next_followup_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "ScheduledMessageType" NOT NULL,
    "send_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "appointment_id" TEXT,
    "followup_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_tenant_id_appointment_at_idx" ON "appointments"("tenant_id", "appointment_at");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_contact_phone_idx" ON "appointments"("tenant_id", "contact_phone");

-- CreateIndex
CREATE INDEX "order_followups_tenant_id_status_next_followup_at_idx" ON "order_followups"("tenant_id", "status", "next_followup_at");

-- CreateIndex
CREATE INDEX "order_followups_tenant_id_contact_phone_idx" ON "order_followups"("tenant_id", "contact_phone");

-- CreateIndex
CREATE INDEX "scheduled_messages_tenant_id_send_at_sent_at_idx" ON "scheduled_messages"("tenant_id", "send_at", "sent_at");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_followups" ADD CONSTRAINT "order_followups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_followup_id_fkey" FOREIGN KEY ("followup_id") REFERENCES "order_followups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

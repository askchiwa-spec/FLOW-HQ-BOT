-- Add CART_REMINDER to ScheduledMessageType enum
-- PostgreSQL requires ALTER TYPE ... ADD VALUE for enum additions
ALTER TYPE "ScheduledMessageType" ADD VALUE IF NOT EXISTS 'CART_REMINDER';

-- Migration: Add senderid column to notifications table
-- This adds the foreign key to track who sent each notification

ALTER TABLE notifications ADD COLUMN senderid uuid NOT NULL DEFAULT gen_random_uuid();

-- If you want to set it properly after adding, you can add a foreign key constraint:
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_senderid 
-- FOREIGN KEY (senderid) REFERENCES users(userid) ON DELETE CASCADE;

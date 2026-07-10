-- Phase 7: admin can suspend users. Suspended users cannot log in or refresh.
ALTER TABLE users
  ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT FALSE AFTER is_verified,
  ADD COLUMN suspended_reason VARCHAR(255) NULL AFTER is_suspended;

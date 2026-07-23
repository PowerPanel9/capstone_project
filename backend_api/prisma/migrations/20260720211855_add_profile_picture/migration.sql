-- AlterTable
-- Duplicate of 20260720184116_add_user_profile_picture (created during a branch merge).
-- IF NOT EXISTS makes replaying this migration on a clean shadow DB a no-op.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profile_picture" TEXT;

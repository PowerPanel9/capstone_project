-- Reconciliation migration.
-- The message.listing_id column + foreign key already exist in the database
-- (added outside of migration history during earlier development), but no
-- migration file recorded them. This closes that gap. IF NOT EXISTS / guarded
-- constraint creation make it a safe no-op when replayed on a database that
-- already has these objects.

-- AlterTable
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "listing_id" INTEGER;

-- AddForeignKey (guard so re-applying does not error if it already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'message_listing_id_fkey'
    ) THEN
        ALTER TABLE "message"
            ADD CONSTRAINT "message_listing_id_fkey"
            FOREIGN KEY ("listing_id") REFERENCES "listing"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

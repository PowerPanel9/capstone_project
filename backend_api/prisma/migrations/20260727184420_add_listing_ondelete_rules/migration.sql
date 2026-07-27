-- DropForeignKey
ALTER TABLE "application" DROP CONSTRAINT "application_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "bookmark" DROP CONSTRAINT "bookmark_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_listing_id_fkey";

-- AddForeignKey
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

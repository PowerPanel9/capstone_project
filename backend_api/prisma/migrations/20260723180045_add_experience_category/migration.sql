-- AlterTable
ALTER TABLE "experience" ADD COLUMN     "category" "ListingCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "custom_category" TEXT;

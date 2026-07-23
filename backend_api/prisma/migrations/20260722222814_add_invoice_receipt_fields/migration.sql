-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "invoice_url" TEXT,
ADD COLUMN     "stripe_invoice_id" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "stripe_customer_id" TEXT;

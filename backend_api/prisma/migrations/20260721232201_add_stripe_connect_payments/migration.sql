-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'HELD', 'RELEASED', 'REFUNDED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "stripe_account_id" TEXT;

-- CreateTable
CREATE TABLE "payment" (
    "id" SERIAL NOT NULL,
    "listing_id" INTEGER NOT NULL,
    "application_id" INTEGER,
    "client_id" INTEGER NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_payment_intent_id" TEXT,
    "stripe_transfer_id" TEXT,
    "transfer_group" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

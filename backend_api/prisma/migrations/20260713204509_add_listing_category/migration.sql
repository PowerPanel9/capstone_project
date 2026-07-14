/*
  Warnings:

  - Added the required column `category` to the `listing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('CLEANING', 'TUTORING', 'PLUMBING', 'GARDENING', 'BEAUTY', 'BABYSITTING', 'MOVING', 'HANDYMAN', 'DELIVERY', 'OTHER');

-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "category" "ListingCategory" NOT NULL;

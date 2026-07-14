-- AlterTable
ALTER TABLE "user" ADD COLUMN     "auth_provider" TEXT NOT NULL DEFAULT 'local',
ALTER COLUMN "password" DROP NOT NULL;

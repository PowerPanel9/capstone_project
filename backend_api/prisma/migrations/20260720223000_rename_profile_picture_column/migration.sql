-- Rename snake_case column to camelCase for consistency with Prisma model
ALTER TABLE "user"
RENAME COLUMN "profile_picture" TO "profilePicture";

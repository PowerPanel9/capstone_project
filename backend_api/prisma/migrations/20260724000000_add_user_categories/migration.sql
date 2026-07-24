-- Add provider categories selected during onboarding.
ALTER TABLE "user"
ADD COLUMN "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];

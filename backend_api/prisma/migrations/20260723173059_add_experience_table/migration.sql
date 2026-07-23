-- CreateTable
CREATE TABLE "experience" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "job_title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experience_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "experience" ADD CONSTRAINT "experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

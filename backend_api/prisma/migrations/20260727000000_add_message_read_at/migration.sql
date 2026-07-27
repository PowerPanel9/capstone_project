-- Add read_at to message: null means the message has not been read yet.
ALTER TABLE "message" ADD COLUMN "read_at" TIMESTAMP(3);

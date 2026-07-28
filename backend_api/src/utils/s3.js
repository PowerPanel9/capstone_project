const { S3Client } = require("@aws-sdk/client-s3");

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET_NAME) {
  console.warn("⚠️   AWS S3 is not fully configured — file uploads will not work.");
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = s3;

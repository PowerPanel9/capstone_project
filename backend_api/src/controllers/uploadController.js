const { PutObjectCommand } = require("@aws-sdk/client-s3"); 
const crypto = require("crypto");
const s3 = require("../utils/s3");

async function uploadFile(req, res) {
  try {
    // multer put the file on req.file. If it's missing, the client sent nothing.
    if (!req.file) {   
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Build a unique file name so two "photo.jpg" uploads don't overwrite.      
    const uniqueName = `${crypto.randomUUID()}-${req.file.originalname}`;

    // Send the file's bytes to S3.
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,       
        Key: uniqueName,                 // the file's name inside the bucket
        Body: req.file.buffer,           // the actual file data
        ContentType: req.file.mimetype,  // e.g. image/png, application/pdf
      })
    );

    // Public URL of the file we just stored (works because of the bucket policy).
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueName}`;

    return res.status(201).json({ url: fileUrl });
  } catch (error) {
    console.error("uploadFile error:", error.message);
    return res.status(500).json({ error: "File upload failed" });
  }
}

module.exports = { uploadFile };


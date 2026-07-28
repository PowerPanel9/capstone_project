const express = require("express");
  const multer = require("multer");
  const router = express.Router();
  const { uploadFile } = require("../controllers/uploadController");
  const { requireAuth } = require("../middleware/security");

  // Keep the file in memory (not on disk) so we can pass it straight to S3.
  // Limit to 5 MB so nobody uploads a giant file.
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  // POST /api/upload  — must be logged in. `upload.single("file")` reads the
  // one file the frontend attached under the field name "file".
  router.post("/", requireAuth, upload.single("file"), uploadFile);

  module.exports = router;

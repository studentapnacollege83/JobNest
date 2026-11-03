
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(__dirname, "../private-resumes");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const hasPdfExtension =
    path.extname(file.originalname).toLowerCase() === ".pdf";

  const hasPdfMimeType = file.mimetype === "application/pdf";

  if (!hasPdfExtension || !hasPdfMimeType) {
    return cb(new Error("Only PDF resumes are allowed."));
  }

  cb(null, true);
};

const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

const saveResume = (buffer) => {
  return new Promise((resolve, reject) => {
    // Check PDF signature before saving to disk.
    if (buffer.subarray(0, 5).toString() !== "%PDF-") {
      return reject(new Error("Invalid PDF file."));
    }

    const filename = `${crypto.randomUUID()}.pdf`;
    const filePath = path.join(uploadDirectory, filename);

    fs.writeFile(filePath, buffer, { flag: "wx" }, (error) => {
      if (error) return reject(error);
      resolve({ filename, filePath });
    });
  });
};

module.exports = {
  resumeUpload,
  uploadDirectory,
  saveResume,
};

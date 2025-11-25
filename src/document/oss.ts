// Object storage server (OSS) configuration

import * as fs from 'fs';
import * as multer from 'multer';

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      fs.mkdirSync('uploads/documents', { recursive: true });
    } catch (error) {}
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      file.mimetype.replace('/', '.');
    cb(null, uniqueSuffix);
  },
});

// Delete file function
export const deleteFile = (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
    } else {
      console.log('File deleted successfully');
    }
  });
};

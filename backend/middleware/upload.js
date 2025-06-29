import multer from 'multer';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow images and videos
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
  
  // For profile and additional photos
  if (file.fieldname === 'profilePhoto' || file.fieldname === 'additionalPhotos') {
    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed for photos.'), false);
  }
  
  // For audition videos
  if (file.fieldname === 'auditionVideo') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid file type. Only MP4, MOV, AVI, and WMV video formats are allowed.'), false);
  }
  
  // For Aadhar card uploads
  if (file.fieldname === 'aadharFront' || file.fieldname === 'aadharBack') {
    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed for Aadhar card.'), false);
  }
  
  cb(new Error('Invalid field name'), false);
};

// Initialize multer with configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10,
    fieldSize: 10 * 1024 * 1024 // 10MB max request size
  },
  fileFilter: fileFilter
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware to get video duration using ffmpeg
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration; // Duration in seconds
      resolve(duration);
    });
  });
};

// Middleware to check video duration
const checkVideoDuration = async (req, res, next) => {
  if (!req.file) return next();
  
  if (req.file.fieldname === 'auditionVideo') {
    try {
      const filePath = path.join(__dirname, '..', req.file.path);
      const duration = await getVideoDuration(filePath);
      
      // Check if video is longer than 3 minutes (180 seconds)
      if (duration > 180) {
        // Delete the uploaded file
        fs.unlinkSync(filePath);
        return next(new Error('Video duration must be 3 minutes or less'));
      }
      
      // Add duration to the file object
      req.file.duration = duration;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
};

export const uploadProfilePhoto = upload.single('profilePhoto');
export const uploadAdditionalPhotos = upload.array('additionalPhotos', 10); // Max 10 files
export const uploadAuditionVideo = upload.single('auditionVideo');
export const uploadAadharCard = upload.fields([
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 }
]);

export const handleFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  try {
    if (req.file) {
      // Single file upload
      req.file.url = `/uploads/${req.file.filename}`;
      // Add mimeType to file object
      req.file.mimeType = req.file.mimetype;
      
      // If it's a video, add duration if available
      if (req.file.duration) {
        req.file.duration = req.file.duration;
      }
    } else if (req.files) {
      // Multiple files upload
      req.files = req.files.map(file => ({
        ...file,
        url: `/uploads/${file.filename}`,
        mimeType: file.mimetype
      }));
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to handle file upload and add file URLs to request
const handleFileUpload = (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  // Handle single file
  if (req.file) {
    req.file.url = `/uploads/${req.file.filename}`;
    return next();
  }

  // Handle multiple files
  if (req.files) {
    Object.keys(req.files).forEach(fieldName => {
      if (Array.isArray(req.files[fieldName])) {
        req.files[fieldName].forEach(file => {
          file.url = `/uploads/${file.filename}`;
        });
      } else {
        req.files[fieldName].url = `/uploads/${req.files[fieldName].filename}`;
      }
    });
  }
  
  next();
};

// Configure upload for Aadhar card (front and back)
const uploadAadharCard = upload.fields([
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 }
]);

// Function to delete a file
const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export { 
  checkVideoDuration, 
  handleFileUpload, 
  uploadAadharCard, 
  deleteFile,
  upload 
};

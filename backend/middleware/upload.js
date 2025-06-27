import multer from 'multer';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
  
  if (file.fieldname === 'profilePhoto' || file.fieldname === 'additionalPhotos') {
    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid file type. Only JPEG, JPG, and PNG files are allowed for photos.'), false);
  }
  
  if (file.fieldname === 'auditionVideo') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid file type. Only MP4, MOV, AVI, and WMV video formats are allowed.'), false);
  }
  
  cb(new Error('Invalid field name'), false);
};

// Initialize multer with configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    files: 10
  },
  fileFilter: fileFilter
});

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

export { checkVideoDuration };

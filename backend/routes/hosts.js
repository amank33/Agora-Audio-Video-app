import express from 'express';
import Host from '../models/Host.js';
import { 
  uploadProfilePhoto, 
  uploadAdditionalPhotos, 
  uploadAuditionVideo, 
  handleFileUpload, 
  checkVideoDuration 
} from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to delete file
const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Error deleting file ${filename}:`, err);
    }
  }
};

// Upload profile photo
router.post('/:id/profile-photo', uploadProfilePhoto, handleFileUpload, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error',
        message: 'No file uploaded' 
      });
    }

    const host = await Host.findById(req.params.id);
    if (!host) {
      // Clean up the uploaded file if host not found
      fs.unlinkSync(path.join(uploadDir, req.file.filename));
      return res.status(404).json({ 
        status: 'error',
        message: 'Host not found' 
      });
    }

    // If there's an existing profile photo, delete it
    if (host.profilePhoto && host.profilePhoto.filename) {
      try {
        fs.unlinkSync(path.join(uploadDir, host.profilePhoto.filename));
      } catch (err) {
        console.error('Error deleting old profile photo:', err);
      }
    }

    // Update host's profile photo
    host.profilePhoto = {
      url: req.file.url,
      filename: req.file.filename,
      uploadDate: new Date()
    };

    await host.save();
    res.status(200).json({
      status: 'success',
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhoto: host.profilePhoto
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message || 'Something went wrong!' 
    });
    next(error);
  }
});

// Upload additional photos
router.post('/:id/additional-photos', uploadAdditionalPhotos, handleFileUpload, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'No files uploaded' 
      });
    }

    const host = await Host.findById(req.params.id);
    if (!host) {
      // Clean up uploaded files if host not found
      req.files.forEach(file => {
        fs.unlinkSync(path.join(uploadDir, file.filename));
      });
      return res.status(404).json({ 
        status: 'error',
        message: 'Host not found' 
      });
    }

    // Add new photos to additionalPhotos array
    const newPhotos = req.files.map(file => ({
      url: file.url,
      filename: file.filename,
      uploadDate: new Date()
    }));

    host.additionalPhotos.push(...newPhotos);
    await host.save();

    res.status(200).json({
      status: 'success',
      message: 'Additional photos uploaded successfully',
      data: {
        photos: newPhotos
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get host's photos
router.get('/:id/photos', async (req, res, next) => {
  try {
    const host = await Host.findById(req.params.id, 'profilePhoto additionalPhotos');
    if (!host) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Host not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        profilePhoto: host.profilePhoto,
        additionalPhotos: host.additionalPhotos
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete an additional photo
router.delete('/:hostId/photos/:photoId', async (req, res, next) => {
  try {
    const { hostId, photoId } = req.params;
    
    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Host not found' 
      });
    }

    const photoIndex = host.additionalPhotos.findIndex(photo => photo._id.toString() === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Photo not found' 
      });
    }

    // Delete the file from the filesystem
    const photo = host.additionalPhotos[photoIndex];
    deleteFile(photo.filename);

    // Remove from the array
    host.additionalPhotos.splice(photoIndex, 1);
    await host.save();

    res.status(200).json({ 
      status: 'success',
      message: 'Photo deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
});

// Upload or update audition video
router.post(
  '/:id/audition-video',
  uploadAuditionVideo,
  checkVideoDuration,
  handleFileUpload,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          status: 'error',
          message: 'No video file uploaded' 
        });
      }

      const host = await Host.findById(req.params.id);
      if (!host) {
        deleteFile(req.file.filename);
        return res.status(404).json({ 
          status: 'error',
          message: 'Host not found' 
        });
      }

      // If there's an existing audition video, delete it
      if (host.auditionVideo && host.auditionVideo.filename) {
        deleteFile(host.auditionVideo.filename);
      }

      // Update host's audition video
      host.auditionVideo = {
        url: req.file.url,
        filename: req.file.filename,
        mimeType: req.file.mimeType,
        duration: req.file.duration,
        uploadDate: new Date()
      };

      await host.save();
      res.status(200).json({
        status: 'success',
        message: 'Audition video uploaded successfully',
        data: {
          video: host.auditionVideo
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get audition video
router.get('/:id/audition-video', async (req, res, next) => {
  try {
    const host = await Host.findById(req.params.id, 'auditionVideo');
    if (!host) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Host not found' 
      });
    }
    
    if (!host.auditionVideo) {
      return res.status(404).json({ 
        status: 'error',
        message: 'No audition video found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: host.auditionVideo
    });
  } catch (error) {
    next(error);
  }
});

// Delete audition video
router.delete('/:id/audition-video', async (req, res, next) => {
  try {
    const host = await Host.findById(req.params.id);
    if (!host) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Host not found' 
      });
    }

    if (!host.auditionVideo) {
      return res.status(404).json({ 
        status: 'error',
        message: 'No audition video found' 
      });
    }

    // Delete the file from the filesystem
    deleteFile(host.auditionVideo.filename);

    // Remove the audition video
    host.auditionVideo = null;
    await host.save();

    res.status(200).json({ 
      status: 'success',
      message: 'Audition video deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
});

export default router;

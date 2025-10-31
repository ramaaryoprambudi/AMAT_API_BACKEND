const path = require('path');
const fs = require('fs');

/**
 * Middleware untuk melindungi akses langsung ke direktori
 * Mencegah directory listing dan akses ke folder
 */
const directoryProtection = (req, res, next) => {
  // Cek apakah request adalah untuk static files
  if (req.url.startsWith('/uploads/')) {
    const requestedPath = path.join(__dirname, '../../', req.url);
    
    try {
      // Cek apakah path yang diminta adalah direktori
      if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
        return res.status(403).json({
          success: false,
          message: 'Access to directory is forbidden',
          error_code: 'DIRECTORY_ACCESS_DENIED',
          details: 'Directory listing is not allowed for security reasons'
        });
      }
      
      // Cek apakah file yang diminta benar-benar ada
      if (req.url.includes('/uploads/profile-photos/')) {
        // Extract filename dari URL
        const filename = path.basename(req.url);
        
        // Validasi format filename (harus sesuai dengan format yang kita generate)
        const validFilenamePattern = /^profile-\d+-\d+\.(jpg|jpeg|png)$/i;
        
        if (!validFilenamePattern.test(filename)) {
          return res.status(404).json({
            success: false,
            message: 'File not found',
            error_code: 'FILE_NOT_FOUND',
            details: 'The requested file does not exist or has invalid format'
          });
        }
        
        // Cek apakah file benar-benar ada
        if (!fs.existsSync(requestedPath)) {
          return res.status(404).json({
            success: false,
            message: 'File not found',
            error_code: 'FILE_NOT_FOUND',
            details: 'The requested profile photo does not exist'
          });
        }
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error while accessing file',
        error_code: 'FILE_ACCESS_ERROR',
        details: 'Unable to process file request'
      });
    }
  }
  
  next();
};

/**
 * Middleware khusus untuk menangani request ke root uploads directory
 */
const handleUploadsRoot = (req, res, next) => {
  // Tangani akses ke /uploads atau /uploads/
  if (req.url === '/uploads' || req.url === '/uploads/') {
    return res.status(403).json({
      success: false,
      message: 'Access to uploads directory is forbidden',
      error_code: 'UPLOADS_ACCESS_DENIED',
      details: 'Direct access to uploads folder is not allowed'
    });
  }
  
  // Tangani akses ke /uploads/profile-photos atau /uploads/profile-photos/
  if (req.url === '/uploads/profile-photos' || req.url === '/uploads/profile-photos/') {
    return res.status(403).json({
      success: false,
      message: 'Access to profile photos directory is forbidden',
      error_code: 'DIRECTORY_ACCESS_DENIED',
      details: 'Directory listing is not allowed. Please access specific files only.'
    });
  }
  
  next();
};

/**
 * Middleware untuk logging akses ke files
 */
const logFileAccess = (req, res, next) => {
  if (req.url.startsWith('/uploads/')) {
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Only log file access in development
    if (process.env.NODE_ENV !== 'production') {  
      console.log(`[${timestamp}] File Access: ${req.url} | IP: ${ip} | User-Agent: ${userAgent}`);
    }
  }
  
  next();
};

module.exports = {
  directoryProtection,
  handleUploadsRoot,
  logFileAccess
};
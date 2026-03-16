import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'menu');
    
    // Ensure upload directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filename: (name, ext, part, form) => {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `menu-${timestamp}-${randomStr}${ext}`;
      },
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const uploadedFile = files.image?.[0] || files.image;
    
    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(uploadedFile.mimetype)) {
      await fs.unlink(uploadedFile.filepath);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' 
      });
    }

    const fileName = path.basename(uploadedFile.filepath);
    const imageUrl = `/uploads/menu/${fileName}`;

    return res.status(200).json({
      success: true,
      imageUrl,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload image: ' + error.message,
    });
  }
}

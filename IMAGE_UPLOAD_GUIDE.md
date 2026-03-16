# Menu Item Image Upload Guide

## Overview
You can now add images to menu items either by uploading files directly or providing image URLs. Images are displayed throughout the ordering interface to enhance the customer experience.

## Features Added

### 1. **Image Upload in Admin Panel**
- Navigate to Admin → Menu Manager tab
- When adding or editing menu items, you'll see two options:
  - **Upload File**: Click "Choose File" to upload an image from your device
  - **Image URL**: Paste a URL to an online image
- **Supported formats**: JPEG, JPG, PNG, WebP, GIF
- **Max file size**: 5MB per image
- **Image preview**: See your image before saving

### 2. **Image Display in Order Interface**
Images now appear in:
- **Category Modal**: When browsing menu items (large preview)
- **Item Detail Modal**: When viewing item details
- **Cart Panel**: Small thumbnail next to each cart item

### 3. **Safari & Mobile Printing Support**
Receipt printing now works on:
- ✅ Safari browser (desktop and iPad)
- ✅ Mobile devices (iOS Safari, Chrome Mobile)
- ✅ Desktop browsers (Chrome, Firefox, Edge)

## How to Add Images

### Method 1: Upload from Computer
1. Go to Admin → Menu Manager
2. Click "Add New Item" or edit an existing item
3. Under "Item Image", click the file input
4. Select an image from your computer (JPG, PNG, WebP, GIF)
5. Preview appears automatically
6. Click "Add to menu" or "Save"
7. Image is uploaded to `/public/uploads/menu/` folder

### Method 2: Use Image URL
1. Go to Admin → Menu Manager
2. When adding/editing an item
3. In the "Image URL" field, paste the full URL to an image
4. Example: `https://example.com/momos.jpg`
5. Preview appears if URL is valid
6. Click "Add to menu" or "Save"

### Method 3: Use Existing Images in Project
If you have images in your project already:
1. Place images in `/public/images/` folder
2. In admin, use relative path like: `/images/momos.jpg`

## Image Storage

### Uploaded Files
- Location: `/public/uploads/menu/`
- Naming: `menu-[timestamp]-[random].ext`
- Example: `menu-1708387200000-abc123.jpg`
- Files are publicly accessible at: `/uploads/menu/filename.jpg`

### URL Images
- Stored as URL string in database
- No file uploaded to server
- Must be publicly accessible online

## Printing on Different Devices

### Safari (Mac/iPad)
- Printing works automatically
- If print dialog doesn't appear, use ⌘+P or File → Print

### Mobile Devices (iOS/Android)
1. Tap "Print Receipt" button
2. If print dialog doesn't appear automatically:
   - Tap the Share button (⬆️ on iOS)
   - Select "Print" from the share menu
3. Choose your printer or save as PDF

### Desktop Browsers
- Works automatically with all modern browsers
- Chrome, Firefox, Edge, Safari all supported

## Technical Details

### Image Upload API
- Endpoint: `POST /api/upload-image`
- Accepts: `multipart/form-data` with `image` field
- Returns: `{ success: true, imageUrl: "/uploads/menu/filename.jpg" }`
- Error handling: Invalid file types rejected

### Database Schema
Menu items now include:
```javascript
{
  name: String,
  category: String,
  imageUrl: String,  // ← New field
  price: { large: Number, small: Number },
  // ... other fields
}
```

### Print Compatibility
- Detects Safari/Mobile browsers
- Adjusts print timing for better compatibility
- Fallback instructions for iOS Safari
- Works with thermal printers and standard printers

## Tips & Best Practices

### Image Guidelines
- **Recommended size**: 800x600 pixels or larger
- **Aspect ratio**: 4:3 or 16:9 works best
- **File size**: Keep under 2MB for fast loading
- **Format**: JPEG for photos, PNG for graphics with transparency
- **Quality**: Use clear, well-lit photos of actual dishes

### Performance
- Images are optimized by browser
- Lazy loading in menus (images load as needed)
- Failed images hide automatically (no broken image icons)

### Troubleshooting

**Image not appearing:**
- Check if URL is publicly accessible
- Verify file was uploaded successfully
- Clear browser cache and refresh

**Upload fails:**
- Check file size (max 5MB)
- Verify file format (JPEG, PNG, WebP, GIF only)
- Ensure `/public/uploads/menu/` folder exists

**Print not working on mobile:**
- Ensure popup blockers are disabled
- Try using browser's native print (Share → Print)
- Some mobile browsers require manual print activation

## Future Enhancements

Potential additions:
- Image cropping/resizing tool
- Bulk image upload
- Image optimization (automatic compression)
- Gallery view of all uploaded images
- Delete unused images feature

## Questions?

If you encounter issues:
1. Check browser console for errors (F12)
2. Verify image file formats and sizes
3. Test with different browsers
4. Contact support with error messages

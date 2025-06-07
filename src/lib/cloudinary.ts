
import { v2 as cloudinary } from 'cloudinary';

if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
) {
    console.warn(
        'Cloudinary environment variables are not fully set. Uploads will likely fail.'
    );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(
    dataUri: string, 
    folder: string = 'hanoi_explorer',
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto' // 'raw' for PDFs, 'auto' for auto-detection
): Promise<{ success: boolean; url?: string; public_id?: string; message?: string }> {
    if (!dataUri) {
        return { success: false, message: 'No data URI provided for upload.' };
    }
    try {
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: folder,
            resource_type: resourceType,
        });
        return { success: true, url: result.secure_url, public_id: result.public_id };
    } catch (error: any) {
        console.error('Cloudinary Upload Error:', error.message);
        return { success: false, message: `Failed to upload file to Cloudinary: ${error.message}` };
    }
}

export async function deleteFromCloudinary(publicId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok' || result.result === 'not found') { // 'not found' can be considered success for deletion
            return { success: true };
        }
        return { success: false, message: `Cloudinary deletion failed: ${result.result}` };
    } catch (error: any) {
        console.error('Cloudinary Deletion Error:', error.message);
        return { success: false, message: `Failed to delete file from Cloudinary: ${error.message}` };
    }
}

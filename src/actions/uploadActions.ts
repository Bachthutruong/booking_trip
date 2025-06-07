
'use server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function uploadFile(
    dataUri: string,
    folder: string = 'hanoi_explorer',
    resourceType: 'image' | 'raw' | 'auto' = 'auto'
): Promise<{ success: boolean; url?: string; public_id?: string; message?: string }> {
    if (!dataUri) {
        return { success: false, message: 'No file data provided.' };
    }
    // Determine resource type for PDF explicitly if needed, though 'auto' should work
    let finalResourceType = resourceType;
    if (dataUri.startsWith('data:application/pdf')) {
        finalResourceType = 'image'; // Cloudinary treats PDF as image for display, 'raw' for download
    }
    
    return uploadToCloudinary(dataUri, folder, finalResourceType);
}


import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

// Temporary direct R2 credentials for testing
const R2_ACCOUNT_ID = 'b2888a3d8376e00697353928a2efef5e';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const BUCKET_NAME = 'pexly';

// TODO: Move these to environment variables later
const R2_ACCESS_KEY_ID = '24f3e5c84ffe5690a299f2521a06a493';
const R2_SECRET_ACCESS_KEY = 'fd8c0ab1aebfd90b03a18a6e3d86f97752a7962cbf3ab424aacd7aff754fb323';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  file: File,
  folder: 'profile-pictures' | 'verification-documents' | 'verification-videos' | 'liveness-captures',
  userId: string
): Promise<UploadResult> {
  try {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const key = `${folder}/${userId}/${timestamp}-${randomString}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Use the public R2 domain for accessing uploaded files
    const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    
    let errorMessage = 'Upload failed';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function uploadBase64ToR2(
  base64Data: string,
  folder: 'profile-pictures' | 'verification-documents' | 'verification-videos' | 'liveness-captures',
  userId: string,
  fileExtension: string = 'jpg'
): Promise<UploadResult> {
  try {
    const base64Content = base64Data.split(',')[1] || base64Data;
    const binaryData = atob(base64Content);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    const contentType = fileExtension === 'jpg' || fileExtension === 'jpeg' 
      ? 'image/jpeg' 
      : fileExtension === 'png' 
      ? 'image/png' 
      : 'application/octet-stream';

    const blob = new Blob([bytes], { type: contentType });
    const file = new File([blob], `capture.${fileExtension}`, { type: contentType });

    return uploadToR2(file, folder, userId);
  } catch (error) {
    console.error('R2 base64 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

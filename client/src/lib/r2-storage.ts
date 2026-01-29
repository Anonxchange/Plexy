export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

const EDGE_FUNCTION_URL = 'https://hvpeycnedmzrjshmvgri.supabase.co/functions/v1/r2-storage';

export async function uploadToR2(
  file: File,
  folder: 'profile-pictures' | 'verification-documents' | 'verification-videos' | 'liveness-captures' | 'gift-cards' | 'shop',
  userId: string
): Promise<UploadResult> {
  try {
    console.log(`[R2] Starting upload via Edge Function - File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
    
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const key = `${folder}/${userId}/${timestamp}.${fileExtension}`;

    console.log(`[R2] Sending to Edge Function with direct-upload...`);
    const startTime = Date.now();
    
    const uploadUrl = `${EDGE_FUNCTION_URL}?action=direct-upload&key=${encodeURIComponent(key)}`;
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: file,
    });

    const result = await response.json();
    
    const uploadTime = Date.now() - startTime;
    console.log(`[R2] Upload completed in ${uploadTime}ms`);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log(`[R2] Public URL: ${result.url}`);

    return {
      success: true,
      url: result.url,
      key: result.key,
    };
  } catch (error) {
    console.error('[R2] Upload error:', error);
    
    let errorMessage = 'Upload failed';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.name === 'TimeoutError' || errorMessage.includes('timeout')) {
        errorMessage = 'Upload timed out - please try again with a smaller file';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function uploadBase64ToR2(
  base64Data: string,
  folder: 'profile-pictures' | 'verification-documents' | 'verification-videos' | 'liveness-captures' | 'gift-cards' | 'shop',
  userId: string,
  fileExtension: string = 'jpg'
): Promise<UploadResult> {
  try {
    const base64Content = base64Data.split(',')[1] || base64Data;
    
    const contentType = fileExtension === 'jpg' || fileExtension === 'jpeg' 
      ? 'image/jpeg' 
      : fileExtension === 'png' 
      ? 'image/png' 
      : 'application/octet-stream';

    const timestamp = Date.now();
    const key = `${folder}/${userId}/${timestamp}.${fileExtension}`;

    console.log(`[R2] Starting base64 upload via Edge Function with direct-upload...`);
    const startTime = Date.now();
    
    const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: contentType });
    
    const uploadUrl = `${EDGE_FUNCTION_URL}?action=direct-upload&key=${encodeURIComponent(key)}`;
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: blob,
    });

    const result = await response.json();
    
    const uploadTime = Date.now() - startTime;
    console.log(`[R2] Upload completed in ${uploadTime}ms`);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      success: true,
      url: result.url,
      key: result.key,
    };
  } catch (error) {
    console.error('[R2] Base64 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

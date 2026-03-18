import { getSupabase } from "./supabase";

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-storage`;

const ALLOWED_FOLDERS = [
  'profile-pictures',
  'verification-documents',
  'verification-videos',
  'liveness-captures',
  'gift-cards',
  'shop',
] as const;

type AllowedFolder = typeof ALLOWED_FOLDERS[number];

function sanitizeExtension(filename: string): string {
  const raw = filename.split('.').pop() ?? 'bin';
  return raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10) || 'bin';
}

function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9\-_]/g, '');
}

async function getAuthToken(): Promise<string> {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
}

export async function uploadToR2(
  file: File,
  folder: AllowedFolder,
  userId: string
): Promise<UploadResult> {
  try {
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return { success: false, error: 'Invalid upload folder' };
    }

    const fileExtension = sanitizeExtension(file.name);
    const safeUserId = sanitizePathSegment(userId);
    const timestamp = Date.now();
    const key = `${folder}/${safeUserId}/${timestamp}.${fileExtension}`;

    console.log(`[R2] Starting upload via Edge Function - File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
    console.log(`[R2] Sending to Edge Function with direct-upload...`);
    const startTime = Date.now();

    const token = await getAuthToken();
    const uploadUrl = `${EDGE_FUNCTION_URL}?action=direct-upload&key=${encodeURIComponent(key)}`;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Authorization': `Bearer ${token}`,
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
  folder: AllowedFolder,
  userId: string,
  fileExtension: string = 'jpg'
): Promise<UploadResult> {
  try {
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return { success: false, error: 'Invalid upload folder' };
    }

    const safeExtension = sanitizeExtension(`file.${fileExtension}`);
    const safeUserId = sanitizePathSegment(userId);

    const contentType = safeExtension === 'jpg' || safeExtension === 'jpeg'
      ? 'image/jpeg'
      : safeExtension === 'png'
      ? 'image/png'
      : 'application/octet-stream';

    const timestamp = Date.now();
    const key = `${folder}/${safeUserId}/${timestamp}.${safeExtension}`;

    console.log(`[R2] Starting base64 upload via Edge Function with direct-upload...`);
    const startTime = Date.now();

    const base64Content = base64Data.split(',')[1] || base64Data;
    const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: contentType });

    const token = await getAuthToken();
    const uploadUrl = `${EDGE_FUNCTION_URL}?action=direct-upload&key=${encodeURIComponent(key)}`;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Authorization': `Bearer ${token}`,
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

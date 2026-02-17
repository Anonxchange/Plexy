import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "dompurify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeImageUrl(url: string | undefined): string {
  if (!url) return "";
  
  // 1. Basic protocol check
  try {
    const parsed = new URL(url, window.location.origin);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
  } catch (e) {
    // If it's a relative path, it's fine
    if (url.startsWith("javascript:")) return "";
  }

  // 2. DOMPurify sanitization
  return DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_TRUSTED_TYPE: false,
  });
}

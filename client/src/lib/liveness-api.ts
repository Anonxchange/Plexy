
export interface LivenessResult {
  isLive: boolean;
  confidence: number;
  message: string;
}

let modelsLoaded = false;
let faceapi: any = null;

async function loadFaceAPI() {
  if (faceapi) return faceapi;
  
  // Dynamically import face-api.js
  faceapi = await import('face-api.js');
  return faceapi;
}

async function loadModels() {
  if (modelsLoaded) return;
  
  const api = await loadFaceAPI();
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
  
  await Promise.all([
    api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
}

export async function checkLiveness(imageBase64: string): Promise<LivenessResult> {
  try {
    await loadModels();
    const api = await loadFaceAPI();
    
    // Convert base64 to image element
    const img = new Image();
    img.src = imageBase64;
    await new Promise((resolve) => { img.onload = resolve; });
    
    // Detect face with landmarks
    const detection = await api
      .detectSingleFace(img, new api.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    if (!detection) {
      return {
        isLive: false,
        confidence: 0,
        message: 'No face detected. Please ensure your face is clearly visible.',
      };
    }
    
    // Basic liveness checks
    const faceBox = detection.detection.box;
    const imageWidth = img.width;
    const imageHeight = img.height;
    
    const faceArea = (faceBox.width * faceBox.height) / (imageWidth * imageHeight);
    const isFaceSizeGood = faceArea > 0.1 && faceArea < 0.8;
    
    // Check face position (should be relatively centered)
    const faceCenterX = faceBox.x + faceBox.width / 2;
    const faceCenterY = faceBox.y + faceBox.height / 2;
    const isCentered = 
      faceCenterX > imageWidth * 0.3 && faceCenterX < imageWidth * 0.7 &&
      faceCenterY > imageHeight * 0.2 && faceCenterY < imageHeight * 0.8;
    
    // Calculate confidence based on checks
    let confidence = detection.detection.score;
    if (isFaceSizeGood) confidence += 0.1;
    if (isCentered) confidence += 0.1;
    confidence = Math.min(confidence, 1.0);
    
    const isLive = confidence >= 0.7 && isFaceSizeGood && isCentered;
    
    return {
      isLive,
      confidence,
      message: isLive 
        ? 'Liveness verified successfully' 
        : 'Please center your face and ensure good lighting',
    };
  } catch (error) {
    console.error('Liveness check error:', error);
    throw new Error('Failed to verify liveness. Please try again.');
  }
}

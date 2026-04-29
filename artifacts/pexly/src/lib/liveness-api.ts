
export interface LivenessResult {
  isLive: boolean;
  confidence: number;
  message: string;
  capturedImage?: File;
  imageBase64?: string;
  details?: {
    faceDetected: boolean;
    faceQuality: number;
    faceCentered: boolean;
    faceSize: number;
    headPoseScore: number;
    expressionDetected: boolean;
    imageQuality: number;
  };
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
  
  try {
    // Try loading enhanced models for better detection
    await Promise.all([
      api.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // More accurate than tinyFaceDetector
      api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      api.nets.faceExpressionNet.loadFromUri(MODEL_URL), // For expression detection
      api.nets.ageGenderNet.loadFromUri(MODEL_URL), // For additional verification
    ]);
  } catch (error) {
    console.warn('Failed to load enhanced models, using basic detection:', error);
    // Fallback to basic model if enhanced models fail
    await Promise.all([
      api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);
  }
  
  modelsLoaded = true;
}

// Analyze image quality (blur, brightness, contrast)
function analyzeImageQuality(img: HTMLImageElement): number {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return 0;
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate average brightness
  let totalBrightness = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
    pixelCount++;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  // Quality score based on brightness (ideal range: 80-180)
  let qualityScore = 1.0;
  if (avgBrightness < 60) {
    qualityScore = 0.3; // Too dark
  } else if (avgBrightness < 80) {
    qualityScore = 0.6; // Dim
  } else if (avgBrightness > 200) {
    qualityScore = 0.4; // Too bright/overexposed
  } else if (avgBrightness > 180) {
    qualityScore = 0.7; // Bright
  }
  
  return qualityScore;
}

// Calculate head pose from landmarks
function calculateHeadPose(landmarks: any): { pitch: number; yaw: number; roll: number; score: number } {
  const positions = landmarks.positions;
  
  // Key landmark points for head pose estimation
  const noseTip = positions[30]; // Nose tip
  const leftEye = positions[36]; // Left eye outer corner
  const rightEye = positions[45]; // Right eye outer corner
  const leftMouth = positions[48]; // Left mouth corner
  const rightMouth = positions[54]; // Right mouth corner
  
  // Calculate face center
  const faceCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2
  };
  
  // Estimate yaw (left-right rotation) from nose position relative to eye center
  const eyeDistance = Math.abs(rightEye.x - leftEye.x);
  const noseOffset = noseTip.x - faceCenter.x;
  const yaw = (noseOffset / eyeDistance) * 100; // Normalized to ~-50 to 50 degrees
  
  // Estimate pitch (up-down rotation) from nose to eye vertical distance
  const eyeNoseDistance = Math.abs(noseTip.y - faceCenter.y);
  const mouthNoseDistance = Math.abs((leftMouth.y + rightMouth.y) / 2 - noseTip.y);
  const pitch = ((eyeNoseDistance / mouthNoseDistance) - 1) * 100;
  
  // Estimate roll (tilt) from eye alignment
  const eyeSlope = (rightEye.y - leftEye.y) / (rightEye.x - leftEye.x);
  const roll = Math.atan(eyeSlope) * (180 / Math.PI);
  
  // Calculate pose quality score (centered face has score near 1.0)
  const yawScore = Math.max(0, 1 - Math.abs(yaw) / 50);
  const pitchScore = Math.max(0, 1 - Math.abs(pitch) / 50);
  const rollScore = Math.max(0, 1 - Math.abs(roll) / 30);
  const poseScore = (yawScore + pitchScore + rollScore) / 3;
  
  return { pitch, yaw, roll, score: poseScore };
}

export async function checkLiveness(imageBase64: string): Promise<LivenessResult> {
  try {
    await loadModels();
    const api = await loadFaceAPI();
    
    // Convert base64 to image element
    const img = new Image();
    img.src = imageBase64;
    await new Promise((resolve) => { img.onload = resolve; });
    
    // Analyze image quality
    const imageQuality = analyzeImageQuality(img);
    
    // Detect face with all features for comprehensive analysis
    let detection;
    try {
      // Try enhanced detection first
      detection = await api
        .detectSingleFace(img, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();
    } catch (error) {
      console.warn('Enhanced detection failed, using basic detection:', error);
      // Fallback to basic detection
      detection = await api
        .detectSingleFace(img, new api.TinyFaceDetectorOptions())
        .withFaceLandmarks();
    }
    
    if (!detection) {
      return {
        isLive: false,
        confidence: 0,
        message: 'No face detected. Please ensure your face is clearly visible.',
        details: {
          faceDetected: false,
          faceQuality: 0,
          faceCentered: false,
          faceSize: 0,
          headPoseScore: 0,
          expressionDetected: false,
          imageQuality,
        }
      };
    }
    
    // Enhanced liveness checks
    const faceBox = detection.detection.box;
    const imageWidth = img.width;
    const imageHeight = img.height;
    
    // Face size analysis (should be appropriate for verification)
    const faceArea = (faceBox.width * faceBox.height) / (imageWidth * imageHeight);
    const isFaceSizeGood = faceArea > 0.15 && faceArea < 0.75; // Stricter size requirements
    
    // Face position (should be well-centered)
    const faceCenterX = faceBox.x + faceBox.width / 2;
    const faceCenterY = faceBox.y + faceBox.height / 2;
    const isCentered = 
      faceCenterX > imageWidth * 0.35 && faceCenterX < imageWidth * 0.65 &&
      faceCenterY > imageHeight * 0.25 && faceCenterY < imageHeight * 0.75;
    
    // Head pose analysis
    const headPose = calculateHeadPose(detection.landmarks);
    
    // Expression detection (verify natural expressions are detected)
    const expressions = detection.expressions || null;
    const hasValidExpression = expressions && Object.keys(expressions).length > 0;
    const maxExpression = hasValidExpression ? 
      (Object.entries(expressions).reduce((a, b) => (a[1] as number) > (b[1] as number) ? a : b)[1] as number) : 0;
    
    // Face quality score based on detection confidence
    const faceQuality = detection.detection.score;
    
    // Anti-spoofing: Check for natural variations (only if expressions available)
    const hasNaturalVariation = !expressions || (hasValidExpression && maxExpression < 0.95); // Too perfect = suspicious
    
    // Calculate comprehensive confidence score
    let confidence = 0;
    
    // Base detection confidence (40% weight)
    confidence += faceQuality * 0.4;
    
    // Image quality (15% weight)
    confidence += imageQuality * 0.15;
    
    // Face size and position (20% weight)
    if (isFaceSizeGood) confidence += 0.10;
    if (isCentered) confidence += 0.10;
    
    // Head pose quality (15% weight)
    confidence += headPose.score * 0.15;
    
    // Expression naturalness (10% weight) - only if expression detection available
    if (!expressions || (hasValidExpression && hasNaturalVariation)) confidence += 0.10;
    
    // Ensure confidence is within bounds
    confidence = Math.min(Math.max(confidence, 0), 1.0);
    
    // Determine if liveness check passed
    const isLive = confidence >= 0.65 && 
                   isFaceSizeGood && 
                   isCentered && 
                   faceQuality >= 0.6 &&
                   imageQuality >= 0.4;
    
    // Generate detailed feedback message
    let message = '';
    if (!isLive) {
      if (imageQuality < 0.4) {
        message = 'Poor lighting detected. Please move to a well-lit area.';
      } else if (!isFaceSizeGood) {
        message = faceArea < 0.15 ? 'Move closer to the camera.' : 'Move back from the camera.';
      } else if (!isCentered) {
        message = 'Please center your face in the frame.';
      } else if (faceQuality < 0.6) {
        message = 'Face not clearly visible. Ensure your face is in focus.';
      } else {
        message = 'Verification failed. Please try again with better positioning.';
      }
    } else {
      message = 'Liveness verified successfully!';
    }
    
    return {
      isLive,
      confidence,
      message,
      details: {
        faceDetected: true,
        faceQuality,
        faceCentered: isCentered,
        faceSize: faceArea,
        headPoseScore: headPose.score,
        expressionDetected: hasValidExpression,
        imageQuality,
      }
    };
  } catch (error) {
    console.error('Liveness check error:', error);
    if (error instanceof Error) {
      throw new Error(`Liveness verification failed: ${error.message}`);
    }
    throw new Error('Failed to verify liveness. Please try again.');
  }
}

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle, XCircle, Video, Loader2 } from "lucide-react";
import { checkLiveness, LivenessResult } from "@/lib/liveness-api";

interface LivenessCheckProps {
  onSuccess: (result: LivenessResult) => void;
  onError?: (error: string) => void;
}

export default function LivenessCheck({ onSuccess, onError }: LivenessCheckProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<LivenessResult | null>(null);
  const [error, setError] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      console.log("Requesting camera access...");
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user" 
        },
        audio: false,
      });
      
      console.log("Camera access granted, stream:", mediaStream);
      console.log("Video tracks:", mediaStream.getVideoTracks());
      
      // Set video element first
      if (videoRef.current) {
        console.log("Setting video srcObject");
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          console.log("Video metadata loaded");
          try {
            await videoRef.current?.play();
            console.log("Video playing successfully");
          } catch (e) {
            console.error("Error playing video:", e);
            setError("Failed to start video playback: " + (e as Error).message);
          }
        };
      } else {
        console.error("Video ref is null");
      }
      
      setStream(mediaStream);
      setIsCapturing(true);
      setError("");
      setResult(null);
    } catch (err) {
      console.error("Camera error:", err);
      let errorMessage = "Failed to access camera. ";
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage += "Please grant camera permissions in your browser settings.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMessage += "No camera found. Please connect a camera.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage += "Camera is already in use by another application.";
        } else {
          errorMessage += err.message;
        }
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);

    setIsChecking(true);
    
    try {
      const livenessResult = await checkLiveness(imageBase64);
      setResult(livenessResult);
      
      if (livenessResult.isLive && livenessResult.confidence >= 0.85) {
        stopCamera();
        onSuccess(livenessResult);
      } else if (livenessResult.confidence < 0.85) {
        setError(`Low confidence (${(livenessResult.confidence * 100).toFixed(0)}%). Please try again in better lighting with your face clearly visible.`);
      } else {
        setError("Liveness check failed. Please ensure you're using a live camera and not a photo or video.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Liveness check failed";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsChecking(false);
    }
  }, [onSuccess, onError, stopCamera]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Liveness Verification
        </CardTitle>
        <CardDescription>
          Level 2 security: Verify you're a real person, not a photo or video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && result.isLive && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✓ Liveness verified! Confidence: {(result.confidence * 100).toFixed(0)}%
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {!isCapturing ? (
            <div className="text-center py-8">
              <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to start your liveness check. Make sure you're in a well-lit area.
              </p>
              <Button onClick={startCamera} size="lg">
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-2xl mx-auto aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-primary/50 rounded-xl pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-72 h-96 border-2 border-primary rounded-full opacity-50" />
                  </div>
                </div>
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex gap-2">
                <Button 
                  onClick={capturePhoto} 
                  disabled={isChecking}
                  className="flex-1"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Capture & Verify
                    </>
                  )}
                </Button>
                <Button 
                  onClick={stopCamera} 
                  variant="outline"
                  disabled={isChecking}
                >
                  Cancel
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Position your face within the oval guide</p>
                <p>• Ensure good lighting without glare</p>
                <p>• Remove glasses or face coverings if possible</p>
                <p>• Look directly at the camera</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

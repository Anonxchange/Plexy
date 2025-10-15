import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle, XCircle, Video, Loader2, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from "lucide-react";
import { checkLiveness, LivenessResult } from "@/lib/liveness-api";

interface LivenessCheckProps {
  onSuccess: (result: LivenessResult) => void;
  onError?: (error: string) => void;
}

type LivenessAction = "center" | "turn-left" | "turn-right" | "nod-down" | "nod-up" | "complete";

const actionInstructions: Record<LivenessAction, { text: string; icon: any }> = {
  "center": { text: "Look straight at the camera", icon: Camera },
  "turn-left": { text: "Turn your head to the LEFT", icon: ArrowLeft },
  "turn-right": { text: "Turn your head to the RIGHT", icon: ArrowRight },
  "nod-down": { text: "Nod your head DOWN", icon: ArrowDown },
  "nod-up": { text: "Nod your head UP", icon: ArrowUp },
  "complete": { text: "Verification complete!", icon: CheckCircle }
};

export default function LivenessCheck({ onSuccess, onError }: LivenessCheckProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<LivenessResult | null>(null);
  const [error, setError] = useState<string>("");
  const [pendingStream, setPendingStream] = useState<MediaStream | null>(null);
  const [currentAction, setCurrentAction] = useState<LivenessAction>("center");
  const [actionSequence, setActionSequence] = useState<LivenessAction[]>([]);
  const [completedActions, setCompletedActions] = useState<LivenessAction[]>([]);
  const [countdown, setCountdown] = useState<number>(3);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle video setup after element is rendered
  useEffect(() => {
    if (pendingStream && videoRef.current && isCapturing) {
      console.log("Setting up video with stream");
      const video = videoRef.current;
      video.srcObject = pendingStream;
      
      const playVideo = () => {
        console.log("Video metadata loaded, attempting to play");
        video.play()
          .then(() => {
            console.log("Video playing successfully");
            setStream(pendingStream);
            setPendingStream(null);
          })
          .catch((e) => {
            console.error("Error playing video:", e);
            setError("Failed to start video playback: " + (e as Error).message);
          });
      };
      
      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.addEventListener('loadedmetadata', playVideo, { once: true });
      }
    }
  }, [pendingStream, isCapturing]);

  const startCamera = useCallback(async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      console.log("Requesting camera access...");
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user" 
        },
        audio: false,
      });
      
      console.log("Camera access granted, stream:", mediaStream);
      console.log("Video tracks:", mediaStream.getVideoTracks());
      
      // Generate random action sequence (2-3 actions)
      const possibleActions: LivenessAction[] = ["turn-left", "turn-right", "nod-down", "nod-up"];
      const numActions = Math.floor(Math.random() * 2) + 2; // 2 or 3 actions
      const shuffled = [...possibleActions].sort(() => Math.random() - 0.5);
      const sequence = ["center", ...shuffled.slice(0, numActions), "complete"] as LivenessAction[];
      
      setActionSequence(sequence);
      setCurrentAction("center");
      setCompletedActions([]);
      setCountdown(3);
      
      // Set capturing first to render the video element
      setIsCapturing(true);
      setError("");
      setResult(null);
      
      // Store stream to be set up in useEffect after render
      setPendingStream(mediaStream);
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
      setIsCapturing(false);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (pendingStream) {
      pendingStream.getTracks().forEach(track => track.stop());
      setPendingStream(null);
    }
    setIsCapturing(false);
  }, [stream, pendingStream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Capture at lower resolution for faster processing
    const targetWidth = 640;
    const targetHeight = 480;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.drawImage(video, 0, 0, targetWidth, targetHeight);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

    setIsChecking(true);
    setError("");
    
    try {
      const livenessResult = await checkLiveness(imageBase64);
      
      if (livenessResult.isLive && livenessResult.confidence >= 0.65) {
        // Move to next action
        const currentIndex = actionSequence.indexOf(currentAction);
        const nextAction = actionSequence[currentIndex + 1];
        
        if (nextAction) {
          setCompletedActions(prev => [...prev, currentAction]);
          setCurrentAction(nextAction);
          setCountdown(3); // Reset countdown for next action
          
          if (nextAction === "complete") {
            // All actions completed successfully
            setResult(livenessResult);
            setTimeout(() => {
              stopCamera();
              onSuccess(livenessResult);
            }, 1500);
          }
        }
      } else if (livenessResult.confidence < 0.65) {
        setError(livenessResult.message || `Low confidence (${(livenessResult.confidence * 100).toFixed(0)}%). Please follow the instruction carefully.`);
        setCountdown(3); // Reset countdown to try again
      } else {
        setError(livenessResult.message || "Face not detected. Please ensure your face is clearly visible.");
        setCountdown(3); // Reset countdown to try again
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Liveness check failed";
      setError(errorMessage);
      onError?.(errorMessage);
      setCountdown(3); // Reset countdown
    } finally {
      setIsChecking(false);
    }
  }, [onSuccess, onError, stopCamera, stream, currentAction, actionSequence]);

  // Countdown timer effect
  useEffect(() => {
    if (!stream || !isCapturing || countdown === 0 || isChecking) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [stream, isCapturing, countdown, isChecking]);

  // Trigger photo capture when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && stream && isCapturing && !isChecking) {
      capturePhoto();
    }
  }, [countdown, stream, isCapturing, isChecking, capturePhoto]);

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
              <div className="relative w-full max-w-3xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ height: '600px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute inset-0 border-4 border-primary/50 rounded-2xl pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-80 h-[500px] border-4 border-primary/70 rounded-full opacity-60" />
                  </div>
                </div>
                
                {/* Action instruction overlay */}
                {stream && currentAction !== "complete" && (
                  <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-4 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-sm px-8 py-4 rounded-2xl border-2 border-primary/50">
                      <div className="flex items-center gap-3 text-white">
                        {(() => {
                          const ActionIcon = actionInstructions[currentAction].icon;
                          return <ActionIcon className="h-8 w-8 text-primary animate-pulse" />;
                        })()}
                        <p className="text-2xl font-bold">{actionInstructions[currentAction].text}</p>
                      </div>
                    </div>
                    
                    {countdown > 0 && (
                      <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold animate-pulse">
                        {countdown}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Progress indicator */}
                {stream && actionSequence.length > 0 && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                    {actionSequence.filter(a => a !== "complete").map((action, idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all ${
                          completedActions.includes(action)
                            ? "bg-green-500"
                            : action === currentAction
                            ? "bg-primary animate-pulse"
                            : "bg-gray-500"
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                {!stream && isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                )}
                
                {isChecking && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex gap-2">
                <Button 
                  onClick={stopCamera} 
                  variant="outline"
                  disabled={isChecking}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Follow the on-screen instructions</p>
                <p>• Keep your face within the oval guide</p>
                <p>• Ensure good lighting without glare</p>
                <p>• Photos will be captured automatically</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

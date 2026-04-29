import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan?: (data: string) => void;
}

export function QRScannerDialog({ open, onOpenChange, onScan }: QRScannerDialogProps) {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setHasPermission(true);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setScanning(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasPermission(false);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleManualInput = () => {
    toast({
      title: "Manual input",
      description: "Use the Send dialog to enter recipient details manually",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasPermission === false && (
            <Alert variant="destructive">
              <AlertDescription>
                Camera access is required to scan QR codes. Please enable camera permissions in your browser settings.
              </AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden aspect-square flex items-center justify-center">
            {scanning ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white">
                <Camera className="h-16 w-16 opacity-50" />
                <p className="text-sm opacity-75">Initializing camera...</p>
              </div>
            )}
            
            {/* Scanning overlay */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-primary/50 m-12 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Position the QR code within the frame to scan
          </p>

          <div className="space-y-2">
            <Button 
              onClick={handleManualInput}
              variant="outline" 
              className="w-full"
            >
              Enter details manually
            </Button>
            <Button 
              onClick={() => onOpenChange(false)}
              variant="ghost" 
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

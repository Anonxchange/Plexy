import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Smartphone, Shield, RefreshCw, Mail } from 'lucide-react';
import { sessionSecurity } from '@/lib/security/session-security';

interface DeviceOTPVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  userId: string;
  email: string;
  deviceInfo?: {
    deviceName: string;
    browser: string;
    os: string;
  };
}

export function DeviceOTPVerification({
  isOpen,
  onClose,
  onVerified,
  userId,
  email,
  deviceInfo,
}: DeviceOTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setError(null);
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await sessionSecurity.verifyOTP(userId, otp);
      
      if (result.verified) {
        onVerified();
      } else {
        setError(result.error || 'Invalid verification code');
        setOtp('');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    try {
      const result = await sessionSecurity.resendOTP(userId, email);
      
      if (result.sent) {
        setResendCooldown(60);
        setOtp('');
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">New Device Detected</DialogTitle>
          <DialogDescription className="text-center">
            We noticed you're logging in from a new device. For your security, 
            please verify this login with the code sent to your email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {deviceInfo && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{deviceInfo.deviceName}</p>
                <p className="text-muted-foreground">
                  {deviceInfo.browser} on {deviceInfo.os}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Code sent to {maskedEmail}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              onComplete={handleVerify}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleVerify}
              disabled={otp.length !== 6 || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Device'
              )}
            </Button>

            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Didn't receive the code?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="h-auto p-0 text-primary hover:text-primary/80"
              >
                {isResending ? (
                  'Sending...'
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend Code'
                )}
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground"
            >
              Cancel Login
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Monitor, Laptop, RefreshCw, HelpCircle } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';

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
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
      setEmailSent(false);
      setResendCooldown(0);
    }
  }, [isOpen]);

  const handleSendEmail = async () => {
    setIsSending(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionToken = sessionData.session?.access_token;

      // If no session token, user needs to authenticate first
      if (!sessionToken) {
        setError('Please sign in again to verify your device.');
        setIsSending(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('device-otp-generation', {
        body: { email, type: 'device_verification' },
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      
      if (fnError) {
        // Handle specific auth errors
        const errorMsg = fnError.message || '';
        if (errorMsg.includes('missing sub claim') || errorMsg.includes('Invalid auth token')) {
          setError('Your session has expired. Please sign in again.');
        } else {
          setError(fnError.message || 'Failed to send verification code');
        }
      } else {
        setEmailSent(true);
        setResendCooldown(60);
        setOtp('');
      }
    } catch (err) {
      setError('Failed to send code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionToken = sessionData.session?.access_token;

      // If no session token, user needs to authenticate first
      if (!sessionToken) {
        setError('Your session has expired. Please sign in again.');
        setIsVerifying(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('device-otp-verify', {
        body: { email, otp, userId },
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      
      if (fnError) {
        // Handle specific auth errors
        const errorMsg = fnError.message || '';
        if (errorMsg.includes('missing sub claim') || errorMsg.includes('Invalid auth token')) {
          setError('Your session has expired. Please sign in again.');
        } else {
          setError(fnError.message || 'Invalid verification code');
        }
        setOtp('');
      } else {
        onVerified();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await handleSendEmail();
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <>
      <Drawer open={isOpen} onOpenChange={() => {}}>
        <DrawerContent className="px-4 pb-8 max-h-[90vh]">
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader className="text-center pt-6 pb-4">
              <DrawerTitle className="text-2xl font-semibold">New device detected</DrawerTitle>
              <DrawerDescription className="text-center text-muted-foreground mt-2">
                {emailSent ? (
                  <>
                    Confirm this is your device from the email we just sent to{' '}
                    <span className="text-primary font-medium">{maskedEmail}</span>
                  </>
                ) : (
                  <>
                    We'll send a verification code to{' '}
                    <span className="text-primary font-medium">{maskedEmail}</span>
                  </>
                )}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex justify-center py-4">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <Monitor className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="w-12 h-10 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <Laptop className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground text-sm mb-6">
              We don't recognize this device
            </p>

            {!emailSent ? (
              <div className="space-y-3">
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="w-full h-12 text-base font-medium rounded-xl bg-[#c8e45a] text-black hover:bg-[#b8d44a]"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send email'
                  )}
                </Button>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium rounded-xl border-border"
                  onClick={() => setShowHelp(true)}
                >
                  Try another way
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-10 text-sm text-destructive hover:text-destructive/80"
                  onClick={onClose}
                >
                  Cancel signing in
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  disabled={isSending || resendCooldown > 0}
                  variant="outline"
                  className={`w-full h-12 text-base font-medium rounded-xl ${
                    resendCooldown > 0 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-[#c8e45a] text-black hover:bg-[#b8d44a] border-0'
                  }`}
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend email (${resendCooldown} sec.)`
                  ) : (
                    'Resend email'
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium rounded-xl border-border"
                  onClick={() => setShowHelp(true)}
                >
                  Try another way
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-10 text-sm text-destructive hover:text-destructive/80"
                  onClick={onClose}
                >
                  Cancel signing in
                </Button>

                <div className="flex flex-col items-center gap-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 6-digit code from your email:
                  </p>
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
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Sheet open={showHelp} onOpenChange={setShowHelp}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">More ways to access your account</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Access your account with the options below
            </p>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Troubleshoot</h4>
                <p className="text-sm text-muted-foreground">
                  Visit our Help center for quick solutions
                </p>
              </div>
              <Button variant="outline" size="sm">
                Visit help center
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full mt-6 text-primary"
            onClick={() => setShowHelp(false)}
          >
            Cancel signing in
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}

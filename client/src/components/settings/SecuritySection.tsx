import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { createAccountChangeNotification } from "@/lib/notifications-api";
import { TwoFactorSetupDialog } from "@/components/two-factor-setup-dialog";
import { WithdrawalWhitelistDialog } from "@/components/withdrawal-whitelist-dialog";
import { IPWhitelistDialog } from "@/components/ip-whitelist-dialog";
import { nonCustodialWalletManager } from "@/lib/non-custodial-wallet";
import {
  Shield,
  CheckCircle2,
  Info,
  AlertTriangle,
  Trash2,
  Copy,
} from "lucide-react";


export function SecuritySection() {
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [smsAuth, setSmsAuth] = useState(false);
  const [appAuth, setAppAuth] = useState(false);
  const [emailAuth, setEmailAuth] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [phone, setPhone] = useState("");

  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showSMS2FADialog, setShowSMS2FADialog] = useState(false);
  const [showEmail2FADialog, setShowEmail2FADialog] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [showWithdrawalWhitelistDialog, setShowWithdrawalWhitelistDialog] = useState(false);
  const [showIPWhitelistDialog, setShowIPWhitelistDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  const [smsVerificationCode, setSmsVerificationCode] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);

  const [disable2FACode, setDisable2FACode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [backupPassword, setBackupPassword] = useState("");
  const [showBackupPhrase, setShowBackupPhrase] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [isVerifyingBackupPassword, setIsVerifyingBackupPassword] = useState(false);

  const [loginNotifications, setLoginNotifications] = useState(true);
  const [suspiciousActivity, setSuspiciousActivity] = useState(true);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [ipWhitelistEnabled, setIPWhitelistEnabled] = useState(false);
  const [ipRequireWithdrawals, setIPRequireWithdrawals] = useState(false);
  const [ipRequireTrades, setIPRequireTrades] = useState(false);
  const [ipRequireAPI, setIPRequireAPI] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetch2FAStatus = async () => {
    if (!user?.id) return;
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const hasTOTP = (factorsData?.totp?.filter((f) => f.status === "verified").length ?? 0) > 0;
      setTwoFactorEnabled(hasTOTP);
      setAppAuth(hasTOTP);

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("sms_two_factor_enabled, email_two_factor_enabled, phone_number")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setSmsAuth(profileData.sms_two_factor_enabled === true);
        setEmailAuth(profileData.email_two_factor_enabled === true);
        if (profileData.phone_number) setPhone(profileData.phone_number);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
    }
  };

  const fetchWhitelistStatus = async () => {
    setLoadingWhitelist(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("withdrawal_whitelist_enabled")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        setWhitelistEnabled(false);
        return;
      }
      setWhitelistEnabled(data?.withdrawal_whitelist_enabled || false);
    } catch {
      setWhitelistEnabled(false);
    } finally {
      setLoadingWhitelist(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetch2FAStatus();
      fetchWhitelistStatus();
    }
  }, [user]);

  const handleSendSMSCode = async () => {
    if (!phone) {
      toast({ title: "Phone Required", description: "Please add a phone number first", variant: "destructive" });
      return;
    }
    setSendingSMS(true);
    try {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      const code = (100000 + (arr[0] % 900000)).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase
        .from("user_profiles")
        .update({ sms_verification_code: code, sms_code_expires_at: expiresAt })
        .eq("id", user?.id);

      await supabase.functions.invoke("send-sms", { body: { phone, code } });
      setSmsSent(true);
      toast({ title: "Code Sent", description: `Verification code sent to ${phone}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send verification code", variant: "destructive" });
    } finally {
      setSendingSMS(false);
    }
  };

  const handleEnableSMS2FA = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from("user_profiles")
        .select("sms_verification_code, sms_code_expires_at")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      if (!profileData?.sms_verification_code) throw new Error("No verification code found");
      if (new Date(profileData.sms_code_expires_at) < new Date()) throw new Error("Verification code has expired");
      if (profileData.sms_verification_code !== smsVerificationCode) {
        toast({ title: "Invalid Code", description: "The verification code is incorrect", variant: "destructive" });
        return;
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ sms_two_factor_enabled: true, sms_verification_code: null, sms_code_expires_at: null })
        .eq("id", user?.id);
      if (updateError) throw updateError;

      setSmsAuth(true);
      setShowSMS2FADialog(false);
      setSmsVerificationCode("");
      setSmsSent(false);

      if (user?.id) {
        await createAccountChangeNotification(user.id, "2fa_enabled", { method: "SMS", timestamp: new Date().toISOString() });
      }
      toast({ title: "SMS 2FA Enabled", description: "SMS two-factor authentication has been enabled" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to enable SMS 2FA", variant: "destructive" });
    }
  };

  const handleDisableSMS2FA = async () => {
    try {
      await supabase.from("user_profiles").update({ sms_two_factor_enabled: false }).eq("id", user?.id);
      setSmsAuth(false);
      if (user?.id) {
        await createAccountChangeNotification(user.id, "2fa_disabled", { method: "SMS", timestamp: new Date().toISOString() });
      }
      toast({ title: "SMS 2FA Disabled", description: "SMS two-factor authentication has been disabled" });
    } catch {
      toast({ title: "Error", description: "Failed to disable SMS 2FA", variant: "destructive" });
    }
  };

  const handleSendEmailCode = async () => {
    if (!user?.email) {
      toast({ title: "Email Required", description: "No email address associated with your account", variant: "destructive" });
      return;
    }
    setSendingEmailCode(true);
    try {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      const code = (100000 + (arr[0] % 900000)).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase
        .from("user_profiles")
        .update({ email_verification_code: code, email_code_expires_at: expiresAt })
        .eq("id", user?.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No active session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email: user.email, type: "2fa_setup", code }),
        }
      );
      if (!response.ok) throw new Error("Failed to send email");

      setEmailCodeSent(true);
      toast({ title: "Code Sent", description: `Verification code sent to ${user.email}` });
    } catch {
      toast({ title: "Error", description: "Failed to send verification code", variant: "destructive" });
    } finally {
      setSendingEmailCode(false);
    }
  };

  const handleEnableEmail2FA = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from("user_profiles")
        .select("email_verification_code, email_code_expires_at")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      if (!profileData?.email_verification_code) throw new Error("No verification code found");
      if (new Date(profileData.email_code_expires_at) < new Date()) throw new Error("Verification code has expired");
      if (profileData.email_verification_code !== emailVerificationCode) {
        toast({ title: "Invalid Code", description: "The verification code is incorrect", variant: "destructive" });
        return;
      }

      await supabase
        .from("user_profiles")
        .update({ email_two_factor_enabled: true, email_verification_code: null, email_code_expires_at: null })
        .eq("id", user?.id);

      setEmailAuth(true);
      setShowEmail2FADialog(false);
      setEmailVerificationCode("");
      setEmailCodeSent(false);
      toast({ title: "Email 2FA Enabled", description: "Email two-factor authentication has been enabled" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to enable Email 2FA", variant: "destructive" });
    }
  };

  const handleDisableEmail2FA = async () => {
    try {
      await supabase.from("user_profiles").update({ email_two_factor_enabled: false }).eq("id", user?.id);
      setEmailAuth(false);
      toast({ title: "Email 2FA Disabled", description: "Email two-factor authentication has been disabled" });
    } catch {
      toast({ title: "Error", description: "Failed to disable Email 2FA", variant: "destructive" });
    }
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    try {
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.[0];
      if (listError || !totpFactor) throw new Error("No authenticator factor found");

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: disable2FACode,
      });
      if (verifyError) {
        toast({ title: "Invalid Code", description: "The authenticator code is incorrect. Please try again.", variant: "destructive" });
        setDisabling2FA(false);
        return;
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      if (unenrollError) throw unenrollError;

      setTwoFactorEnabled(false);
      setAppAuth(false);
      setShowDisable2FADialog(false);
      setDisable2FACode("");

      if (user?.id) {
        await createAccountChangeNotification(user.id, "2fa_disabled", { method: "App", timestamp: new Date().toISOString() });
      }
      await fetch2FAStatus();
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been successfully disabled." });
    } catch {
      toast({ title: "Error", description: "Failed to disable 2FA. Please try again.", variant: "destructive" });
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Success!", description: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: "Error", description: "Failed to update password", variant: "destructive" });
    }
  };

  const handleShowBackupPhrase = async () => {
    if (!backupPassword) {
      toast({ title: "Password Required", description: "Please enter your wallet password", variant: "destructive" });
      return;
    }
    setIsVerifyingBackupPassword(true);
    try {
      if (!user?.id) throw new Error("User not authenticated");
      const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
      if (wallets.length === 0) throw new Error("No non-custodial wallet found.");
      const mnemonicPhrase = await nonCustodialWalletManager.getWalletMnemonic(wallets[0].id, backupPassword, user.id);
      if (mnemonicPhrase) {
        setMnemonic(mnemonicPhrase);
        setShowBackupPhrase(true);
        setBackupPassword("");
      } else {
        throw new Error("Failed to decrypt recovery phrase");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to access recovery phrase", variant: "destructive" });
    } finally {
      setIsVerifyingBackupPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      toast({ title: "Confirmation Required", description: "Please type 'DELETE MY ACCOUNT' exactly to confirm", variant: "destructive" });
      return;
    }
    setDeletingAccount(true);
    try {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ account_deletion_requested: true, account_deletion_requested_at: new Date().toISOString() })
        .eq("id", user?.id);
      if (profileError) throw profileError;
      await supabase.auth.signOut();
      toast({ title: "Deletion Request Submitted", description: "Your request has been submitted. Our support team will process it." });
      setLocation("/");
    } catch {
      toast({ title: "Error", description: "Failed to submit deletion request. Please contact support@pexly.com", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Security</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your account security settings and preferences
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Two-Factor Authentication (2FA)</h4>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">SMS Authentication</p>
                  {smsAuth && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Receive verification codes via SMS to your registered phone number</p>
              </div>
              <Button
                variant={smsAuth ? "outline" : "default"}
                size="sm"
                onClick={smsAuth ? handleDisableSMS2FA : () => setShowSMS2FADialog(true)}
              >
                {smsAuth ? "Disable" : "Enable"}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">Email Authentication</p>
                  {emailAuth && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Receive verification codes via email to your registered email address</p>
              </div>
              <Button
                variant={emailAuth ? "outline" : "default"}
                size="sm"
                onClick={emailAuth ? handleDisableEmail2FA : () => setShowEmail2FADialog(true)}
              >
                {emailAuth ? "Disable" : "Enable"}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">Authenticator App</p>
                  {twoFactorEnabled && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Use Google Authenticator, Authy, or similar apps for enhanced security</p>
              </div>
              <Button
                variant={twoFactorEnabled ? "outline" : "default"}
                size="sm"
                onClick={twoFactorEnabled ? () => setShowDisable2FADialog(true) : () => setShow2FADialog(true)}
              >
                {twoFactorEnabled ? "Disable" : "Enable"}
              </Button>
            </div>

            {show2FADialog && user?.email && (
              <TwoFactorSetupDialog
                open={show2FADialog}
                onOpenChange={setShow2FADialog}
                userEmail={user.email}
                userId={user.id}
                onSuccess={() => {
                  setTwoFactorEnabled(true);
                  setAppAuth(true);
                  setTimeout(() => fetch2FAStatus(), 500);
                }}
              />
            )}

            {/* SMS 2FA Dialog */}
            <Dialog open={showSMS2FADialog} onOpenChange={setShowSMS2FADialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Enable SMS Two-Factor Authentication</DialogTitle>
                  <DialogDescription>We'll send a verification code to your phone number</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {!phone ? (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Phone Number Required</p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Please add and verify your phone number in the Profile section first</p>
                        </div>
                      </div>
                    </div>
                  ) : !smsSent ? (
                    <>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800 dark:text-blue-200">We'll send a 6-digit verification code to <strong>{phone}</strong></p>
                        </div>
                      </div>
                      <Button onClick={handleSendSMSCode} disabled={sendingSMS} className="w-full">
                        {sendingSMS ? "Sending..." : "Send Verification Code"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200">Code sent to <strong>{phone}</strong></p>
                      </div>
                      <div className="space-y-2">
                        <Label>Enter Verification Code</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="000000"
                          maxLength={6}
                          value={smsVerificationCode}
                          onChange={(e) => setSmsVerificationCode(e.target.value.replace(/\D/g, ""))}
                          className="text-center text-2xl tracking-widest font-mono"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Didn't receive the code?{" "}
                          <button type="button" onClick={() => { setSmsSent(false); setSmsVerificationCode(""); handleSendSMSCode(); }} className="text-primary hover:underline">
                            Resend
                          </button>
                        </p>
                      </div>
                      <Button onClick={handleEnableSMS2FA} disabled={smsVerificationCode.length !== 6} className="w-full">
                        Verify & Enable
                      </Button>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowSMS2FADialog(false); setSmsVerificationCode(""); setSmsSent(false); }}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Email 2FA Dialog */}
            <Dialog open={showEmail2FADialog} onOpenChange={setShowEmail2FADialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Enable Email Two-Factor Authentication</DialogTitle>
                  <DialogDescription>We'll send a verification code to your email address</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {!user?.email ? (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Email Address Required</p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Please add and verify your email address in the Profile section first</p>
                        </div>
                      </div>
                    </div>
                  ) : !emailCodeSent ? (
                    <>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800 dark:text-blue-200">We'll send a 6-digit verification code to <strong>{user.email}</strong></p>
                        </div>
                      </div>
                      <Button onClick={handleSendEmailCode} disabled={sendingEmailCode} className="w-full">
                        {sendingEmailCode ? "Sending..." : "Send Verification Code"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200">Code sent to <strong>{user.email}</strong></p>
                      </div>
                      <div className="space-y-2">
                        <Label>Enter Verification Code</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="000000"
                          maxLength={6}
                          value={emailVerificationCode}
                          onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, ""))}
                          className="text-center text-2xl tracking-widest font-mono"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Didn't receive the code?{" "}
                          <button type="button" onClick={() => { setEmailCodeSent(false); setEmailVerificationCode(""); handleSendEmailCode(); }} className="text-primary hover:underline">
                            Resend
                          </button>
                        </p>
                      </div>
                      <Button onClick={handleEnableEmail2FA} disabled={emailVerificationCode.length !== 6} className="w-full">
                        Verify & Enable
                      </Button>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowEmail2FADialog(false); setEmailVerificationCode(""); setEmailCodeSent(false); }}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Disable 2FA Dialog */}
            <Dialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                  <DialogDescription>Enter your authenticator code to confirm disabling 2FA</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Security Warning</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Disabling 2FA will make your account less secure.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Enter Authenticator Code</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      maxLength={6}
                      value={disable2FACode}
                      onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, ""))}
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                    <p className="text-xs text-muted-foreground">Open your authenticator app and enter the 6-digit code for Pexly</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowDisable2FADialog(false); setDisable2FACode(""); }} disabled={disabling2FA}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDisable2FA} disabled={disable2FACode.length !== 6 || disabling2FA}>
                    {disabling2FA ? "Disabling..." : "Disable 2FA"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {!smsAuth && !appAuth && !emailAuth && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Enable 2FA for Better Security</p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Two-factor authentication adds an extra layer of security to your account</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WithdrawalWhitelistDialog open={showWithdrawalWhitelistDialog} onOpenChange={setShowWithdrawalWhitelistDialog} />

      {/* IP Address Whitelist */}
      <div>
        <h4 className="text-lg font-semibold mb-4">IP Address Whitelist</h4>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Enable IP Whitelist</p>
                <p className="text-sm text-muted-foreground">Restrict account access to specific IP addresses for maximum security.</p>
              </div>
              <Switch checked={ipWhitelistEnabled} onCheckedChange={setIPWhitelistEnabled} />
            </div>
            {ipWhitelistEnabled && (
              <>
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Require IP verification for:</p>
                  <div className="flex items-center gap-2">
                    <Switch id="ip-withdrawals" checked={ipRequireWithdrawals} onCheckedChange={setIPRequireWithdrawals} />
                    <label htmlFor="ip-withdrawals" className="text-sm">Withdrawals</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="ip-trades" checked={ipRequireTrades} onCheckedChange={setIPRequireTrades} />
                    <label htmlFor="ip-trades" className="text-sm">Trades</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="ip-api" checked={ipRequireAPI} onCheckedChange={setIPRequireAPI} />
                    <label htmlFor="ip-api" className="text-sm">API access</label>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex gap-2 items-center">
                    <Info className="h-5 w-5 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">Make sure to add your current IP address before enabling restrictions.</p>
                  </div>
                </div>
              </>
            )}
            <Button variant="outline" className="w-full" onClick={() => setShowIPWhitelistDialog(true)}>
              Manage IP Whitelist
            </Button>
          </CardContent>
        </Card>
      </div>
      <IPWhitelistDialog open={showIPWhitelistDialog} onOpenChange={setShowIPWhitelistDialog} />


      {/* Non-Custodial Wallet Backup */}
      <Card className="border-destructive/20 shadow-sm overflow-hidden">
        <CardHeader className="bg-destructive/5 border-b border-destructive/10 py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Wallet Security</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your non-custodial wallet recovery phrase</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <h4 className="font-semibold mb-2">Backup Recovery Phrase</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Your recovery phrase is the only way to restore your wallet if you lose access to this device. Pexly does not store it.
              </p>
              {!showBackupPhrase ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Enter the <strong>wallet password</strong> you set when you created this non-custodial wallet.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backup-password">Wallet Password</Label>
                    <Input
                      id="backup-password"
                      type="password"
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                      placeholder="Enter your wallet password"
                      disabled={isVerifyingBackupPassword}
                    />
                  </div>
                  <Button onClick={handleShowBackupPhrase} disabled={isVerifyingBackupPassword || !backupPassword} variant="outline">
                    {isVerifyingBackupPassword ? "Verifying..." : "Show Recovery Phrase"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="p-4 bg-background border border-destructive/30 rounded-lg font-mono text-sm leading-relaxed text-destructive break-words">
                    {mnemonic}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowBackupPhrase(false)}>
                      Hide Phrase
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(mnemonic); toast({ title: "Copied to clipboard" }); }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Password */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Login Password</h4>
        <Card>
          <CardContent className="p-6">
            {!showPasswordChange ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">Last changed: Never</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowPasswordChange(true)}>
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter your current password" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters with uppercase, lowercase, and numbers</p>
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleUpdatePassword}>Update Password</Button>
                  <Button variant="outline" onClick={() => { setShowPasswordChange(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Security Alerts</h4>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Login Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
              </div>
              <Switch checked={loginNotifications} onCheckedChange={setLoginNotifications} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex-1">
                <p className="font-medium">Suspicious Activity Alerts</p>
                <p className="text-sm text-muted-foreground">Receive alerts about unusual account activity</p>
              </div>
              <Switch checked={suspiciousActivity} onCheckedChange={setSuspiciousActivity} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h4>
        <Card className="border-destructive/50">
          <CardContent className="p-6 space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-destructive">Delete Your Account</p>
                  <p className="text-sm text-muted-foreground">
                    Submit a request to permanently delete your Pexly account. Our support team will review and process your request within 30 days.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground"><strong>Before requesting account deletion, please note:</strong></p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>All your personal data, trading history, and wallet information will be permanently erased</li>
                <li>Any pending trades or transactions will be cancelled</li>
                <li>Your username will become available for other users</li>
                <li>You will lose access to any funds remaining in your wallets - please withdraw all funds first</li>
                <li>You can cancel this request by contacting support@pexly.com before processing</li>
                <li>Once processed, deletion is irreversible and cannot be undone</li>
              </ul>
            </div>
            <Button variant="destructive" className="w-full" onClick={() => setShowDeleteAccountDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Request Account Deletion
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Request Account Deletion
            </DialogTitle>
            <DialogDescription>Submit a deletion request for our support team to review and process.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">This action cannot be undone.</p>
              <p className="text-xs text-muted-foreground mt-1">Our support team will review your request and process it within 30 days.</p>
            </div>
            <div className="space-y-2">
              <Label>Type <strong>DELETE MY ACCOUNT</strong> to confirm</Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteAccountDialog(false); setDeleteConfirmText(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE MY ACCOUNT" || deletingAccount}
            >
              {deletingAccount ? "Submitting..." : "Submit Deletion Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

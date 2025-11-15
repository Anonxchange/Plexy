import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, CheckCircle, Clock, XCircle, Upload, 
  ArrowRight, QrCode, Users, DollarSign 
} from "lucide-react";
import { VERIFICATION_LEVELS, getVerificationLevel, getNextLevel } from "@shared/verification-levels";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import LivenessCheck from "@/components/liveness-check";
import { LivenessResult } from "@/lib/liveness-api";
import { uploadToR2, uploadBase64ToR2 } from "@/lib/r2-storage";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function VerificationPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user, profileData } = useAuth(); // Get auth user with ID and profile data
  const { toast } = useToast();

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [fullName, setFullName] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(null);
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [documentType, setDocumentType] = useState<string>("government_id"); // Default document type

  // Email linking dialog state
  const [emailLinkingOpen, setEmailLinkingOpen] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState("");
  const [linkingPassword, setLinkingPassword] = useState("");
  const [linkingConfirmPassword, setLinkingConfirmPassword] = useState("");

  // Fetch current user profile
  const { data: userProfile } = useQuery({
    queryKey: ["currentUser", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch verifications for the CURRENT USER ONLY - using auth user ID
  const { data: verifications } = useQuery({
    queryKey: ["verifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log("Fetching verifications for user:", user.id, userProfile?.username);

      const { data, error } = await supabase
        .from("verifications")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (error) {
        console.error("Error fetching user verifications:", error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} verifications for user ${userProfile?.username || user.id}`);
      return data;
    },
    enabled: !!user?.id,
  });

  const currentLevel = Number(userProfile?.verification_level) || 0;
  const currentLevelConfig = getVerificationLevel(currentLevel);
  const nextLevelConfig = getNextLevel(currentLevel);
  const progress = (currentLevel / 3) * 100;

  // Submit date of birth and full name for Level 1
  const submitDateOfBirth = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const nameToUse = fullName || userProfile?.full_name;
      if (!nameToUse || nameToUse.trim().length < 2) {
        throw new Error("Please enter your full name");
      }

      // Calculate age from date of birth
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new Error("You must be at least 18 years old to use this platform");
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({ 
          full_name: nameToUse,
          date_of_birth: dateOfBirth, 
          verification_level: "1"
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setFullName("");
    },
  });

  const submitVerification = useMutation({
    mutationFn: async (level: number) => {
      console.log("=== VERIFICATION SUBMISSION STARTED ===");
      console.log("Auth user:", user);
      console.log("Requested level:", level);

      if (!user?.id) {
        throw new Error("Not authenticated");
      }

      let documentUrl = "";
      let documentBackUrl = "";
      let addressProofUrl = "";
      let livenessImageUrl = "";

      // Upload document to R2
      if (documentFile) {
        console.log("Uploading front document...");
        const uploadResult = await uploadToR2(
          documentFile,
          "verification-documents",
          user.id
        );

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || "Failed to upload document");
        }

        documentUrl = uploadResult.url;
        console.log("Front document uploaded:", documentUrl);
      }

      // Upload document back if available
      if (documentBackFile) {
        console.log("Uploading back document...");
        const uploadResult = await uploadToR2(
          documentBackFile,
          "verification-documents",
          user.id
        );

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || "Failed to upload document back");
        }

        documentBackUrl = uploadResult.url;
        console.log("Back document uploaded:", documentBackUrl);
      }

      // Upload address proof if level 3
      if (level === 3) {
        if (!addressFile) {
          throw new Error("Address proof document is required for Level 3 verification");
        }

        console.log("Uploading address proof to R2...");
        const uploadResult = await uploadToR2(
          addressFile,
          "verification-documents",
          user.id
        );

        if (!uploadResult.success || !uploadResult.url) {
          console.error("Address proof upload failed:", uploadResult.error);
          throw new Error(uploadResult.error || "Failed to upload address proof");
        }

        addressProofUrl = uploadResult.url;
        console.log("Address proof uploaded successfully:", addressProofUrl);
      }

      // Upload liveness image if available
      if (livenessResult?.imageDataUrl) {
        console.log("Uploading liveness image...");
        const uploadResult = await uploadBase64ToR2(
          livenessResult.imageDataUrl,
          "liveness-captures",
          user.id,
          "jpg"
        );

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || "Failed to upload liveness image");
        }

        livenessImageUrl = uploadResult.url;
        console.log("Liveness image uploaded:", livenessImageUrl);
      }

      // Submit verification to database
      const verificationData = {
        user_id: user.id,
        requested_level: level.toString(),
        document_type: level === 3 ? "address_proof" : documentType,
        document_url: documentUrl || null,
        document_back_url: documentBackUrl || null,
        address_proof: addressProofUrl || null,
        liveness_image_url: livenessImageUrl || null,
        liveness_check_passed: livenessResult?.isLive ? "true" : "false",
        liveness_confidence: livenessResult?.confidence?.toString() || null,
        liveness_checked_at: livenessResult ? new Date().toISOString() : null,
        status: "pending",
      };

      // Validate all requirements based on level
      if (level === 2) {
        if (!documentUrl || !documentBackUrl) {
          throw new Error("Both front and back of ID are required for Level 2");
        }
      } else if (level === 3) {
        if (!addressProofUrl) {
          throw new Error("Address proof upload failed. Please try again.");
        }
      }

      console.log("Submitting verification data to Supabase:", verificationData);

      const { data: insertedData, error } = await supabase
        .from("verifications")
        .insert(verificationData)
        .select();

      if (error) {
        console.error("❌ Error submitting verification:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database error: ${error.message || 'Failed to save verification'}`);
      }

      console.log("✅ Verification submitted successfully:", insertedData);
      console.log("=== VERIFICATION SUBMISSION COMPLETED ===");

      return { success: true };
    },
    onSuccess: () => {
      console.log("Verification submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setDocumentFile(null);
      setDocumentBackFile(null);
      setAddressFile(null);
      setVideoFile(null);
      setLivenessResult(null);
      setShowLivenessCheck(false);
      alert("Verification submitted successfully! We'll review it within 1-2 business days.");
    },
    onError: (error) => {
      console.error("Verification submission error:", error);
      alert(`Failed to submit verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });


  const pendingVerification = verifications?.find(v => v.status === "pending");

  // Find the latest rejection for each level, but only if there's no approved verification for that level that came after it
  const getLatestRelevantRejection = () => {
    if (!verifications) return null;

    for (const rejection of verifications.filter(v => v.status === "rejected")) {
      const level = Number(rejection.requested_level);

      // Check if there's an approved verification for this level that came after this rejection
      const hasNewerApproval = verifications.some(v => 
        v.status === "approved" && 
        Number(v.requested_level) === level &&
        new Date(v.submitted_at) > new Date(rejection.submitted_at)
      );

      // If there's no newer approval, this rejection is still relevant
      if (!hasNewerApproval) {
        return rejection;
      }
    }

    return null;
  };

  const latestRejection = getLatestRelevantRejection();

  // Check if user needs to resubmit for their current level (was approved then rejected)
  const needsResubmitForCurrentLevel = latestRejection && 
    Number(latestRejection.requested_level) === currentLevel && 
    !pendingVerification;

  // Check if user needs to resubmit for a lower level that was rejected
  const needsResubmitForLevel2 = latestRejection && 
    Number(latestRejection.requested_level) === 2 && 
    currentLevel === 3 && 
    !pendingVerification;

  // Only show rejection if ALL these conditions are met:
  // 1. There's a rejection
  // 2. The rejection is for the immediate next level (currentLevel + 1)
  // 3. No pending verification
  // 4. User doesn't need to resubmit for current level
  // This prevents showing Level 2 rejections to Level 0 users
  const shouldShowRejection = latestRejection && 
    Number(latestRejection.requested_level) === (currentLevel + 1) && 
    !pendingVerification && 
    !needsResubmitForCurrentLevel;

  // Handler for linking email, including password for phone signups
  const handleEmailLink = async () => {
    if (!linkingEmail || !user?.id) return;

    // Validate password if user signed up with phone (no existing password)
    if (!profileData?.email) {
      if (!linkingPassword || linkingPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }

      if (linkingPassword !== linkingConfirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Update email and password (if new password provided)
      const updateData: any = { email: linkingEmail };
      if (linkingPassword && !profileData?.email) {
        updateData.password = linkingPassword;
      }

      const { error } = await supabase.auth.updateUser(updateData);

      if (error) {
        if (error.message.toLowerCase().includes('already') || 
            error.message.toLowerCase().includes('duplicate')) {
          toast({
            title: "Email Already in Use",
            description: "This email is already linked to another account.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your address. Once verified, you can login with email+password or phone.",
      });

      setEmailLinkingOpen(false);
      setLinkingEmail("");
      setLinkingPassword("");
      setLinkingConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Verification</h1>
        <p className="text-muted-foreground">
          Unlock trading limits and features by verifying your account
        </p>
        {user && userProfile && (
          <p className="text-sm text-muted-foreground mt-2">
            Viewing verification for: <span className="font-semibold">{userProfile.username}</span> (ID: {user.id.slice(0, 8)}...)
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verification Progress</CardTitle>
          <CardDescription>
            Current Level: {currentLevelConfig.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className={currentLevel >= 0 ? "text-primary font-semibold" : "text-muted-foreground"}>
                Level 0
              </span>
              <span className={currentLevel >= 1 ? "text-primary font-semibold" : "text-muted-foreground"}>
                Level 1
              </span>
              <span className={currentLevel >= 2 ? "text-primary font-semibold" : "text-muted-foreground"}>
                Level 2
              </span>
              <span className={currentLevel >= 3 ? "text-primary font-semibold" : "text-muted-foreground"}>
                Level 3
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Level Status */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{currentLevelConfig.name}</h3>
              <p className="text-sm text-muted-foreground">{currentLevelConfig.description}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Trading Limits</h4>
              <div className="space-y-1 text-sm">
                {currentLevel === 0 ? (
                  <p className="text-muted-foreground">Trading Disabled</p>
                ) : (
                  <>
                    {currentLevelConfig.dailyLimit !== null ? (
                      <p>Daily Limit: ${currentLevelConfig.dailyLimit.toLocaleString()}</p>
                    ) : (
                      <p>Daily Limit: Unlimited</p>
                    )}
                    {currentLevelConfig.perTradeLimit !== null && currentLevelConfig.perTradeLimit > 0 && (
                      <p>Per Trade: ${currentLevelConfig.perTradeLimit.toLocaleString()}</p>
                    )}
                    {currentLevelConfig.lifetimeTradeLimit !== null && currentLevelConfig.lifetimeTradeLimit > 0 && (
                      <p>Lifetime Trade: ${currentLevelConfig.lifetimeTradeLimit.toLocaleString()}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Permissions</h4>
              <ul className="space-y-1 text-sm">
                {currentLevelConfig.permissions.map((perm, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {nextLevelConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Next Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{nextLevelConfig.name}</h3>
                <p className="text-sm text-muted-foreground">{nextLevelConfig.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <ul className="space-y-1 text-sm">
                  {nextLevelConfig.requirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">New Benefits</h4>
                <ul className="space-y-1 text-sm">
                  {nextLevelConfig.permissions.slice(0, 3).map((perm, i) => (
                    <li key={i} className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verification Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Your Account</CardTitle>
          <CardDescription>
            Complete verification to unlock trading features and increase your limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pendingVerification && (
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                You have a pending verification request for Level {pendingVerification.requested_level}. 
                Our team is reviewing your documents. This usually takes 1-2 business days.
              </AlertDescription>
            </Alert>
          )}

          {needsResubmitForCurrentLevel && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">
                  Your Level {latestRejection.requested_level} verification was rejected
                </p>
                <p className="text-sm mb-2">
                  Reason: {latestRejection.rejection_reason || "Documents did not meet requirements"}
                </p>
                <p className="text-sm">
                  Your account has been downgraded. Please review the requirements below and resubmit your verification to restore your access.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {needsResubmitForLevel2 && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">
                  Your Level 2 verification was rejected
                </p>
                <p className="text-sm mb-2">
                  Reason: {latestRejection.rejection_reason || "Documents did not meet requirements"}
                </p>
                <p className="text-sm">
                  Please resubmit your Level 2 verification below to maintain compliance.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {shouldShowRejection && (
            <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10">
              <XCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <p className="font-semibold mb-1">
                  Your previous Level {latestRejection.requested_level} verification was rejected
                </p>
                <p className="text-sm mb-2">
                  Reason: {latestRejection.rejection_reason || "Documents did not meet requirements"}
                </p>
                <p className="text-sm">
                  Please review the requirements and try again when ready.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Level 0 -> Level 1 OR Resubmit Level 1 */}
          {(currentLevel === 0 || (currentLevel === 1 && needsResubmitForCurrentLevel)) && !pendingVerification && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-4">
                <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Level 0 - Limited Access</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  You can invite friends with your ID QR code and earn rewards, but you cannot trade yet. 
                  Complete Level 1 verification to start trading.
                </p>
              </div>

              <h3 className="font-semibold text-lg">
                {needsResubmitForCurrentLevel && currentLevel === 1 ? "Resubmit Level 1 Verification" : "Step 1: Verify Your Identity (Level 1)"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Provide your full name, confirm your age, and verify both email and phone number to unlock basic trading features.
              </p>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName || userProfile?.full_name || ""}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!!userProfile?.full_name}
                />
                {userProfile?.full_name && (
                  <p className="text-xs text-green-600">✓ Full name already set</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth (Must be 18 or older)</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
              </div>

              {/* Email/Phone Verification Status - Only need ONE */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm">Contact Verification (Complete at least one)</h4>

                {/* Email Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Email Address</span>
                    {userProfile?.email && user?.email && (
                      <Badge variant="outline" className="text-xs">
                        {user.email}
                      </Badge>
                    )}
                  </div>
                  {userProfile?.email && user?.email ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Not Set
                    </Badge>
                  )}
                </div>

                {/* Phone Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Phone Number</span>
                    {userProfile?.phone_number && (
                      <Badge variant="outline" className="text-xs">
                        {userProfile.phone_number}
                      </Badge>
                    )}
                  </div>
                  {userProfile?.phone_verified && userProfile?.phone_number ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Not Set
                    </Badge>
                  )}
                </div>

                {/* Instructions based on signup method */}
                {(!userProfile?.email || !user?.email) && (!userProfile?.phone_verified || !userProfile?.phone_number) && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      Please verify at least one contact method (email or phone) in{" "}
                      <a href="/account-settings" className="underline font-semibold">Account Settings</a> to continue.
                    </AlertDescription>
                  </Alert>
                )}

                {userProfile?.email && user?.email && (!userProfile?.phone_verified || !userProfile?.phone_number) && (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <AlertDescription className="text-xs text-green-800 dark:text-green-300">
                      ✓ Email verified! You can proceed with Level 1 verification.
                    </AlertDescription>
                  </Alert>
                )}

                {userProfile?.phone_verified && userProfile?.phone_number && (!userProfile?.email || !user?.email) && (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <AlertDescription className="text-xs text-green-800 dark:text-green-300">
                      ✓ Phone verified! You can proceed with Level 1 verification.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button 
                onClick={() => submitDateOfBirth.mutate()}
                disabled={
                  !dateOfBirth || 
                  (!fullName && !userProfile?.full_name) || 
                  ((!userProfile?.email || !user?.email) && (!userProfile?.phone_verified || !userProfile?.phone_number)) ||
                  submitDateOfBirth.isPending
                }
                className="w-full"
              >
                {submitDateOfBirth.isPending ? "Verifying..." : "Complete Level 1 Verification"}
              </Button>

              {submitDateOfBirth.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {submitDateOfBirth.error instanceof Error ? submitDateOfBirth.error.message : "Verification failed"}
                  </AlertDescription>
                </Alert>
              )}

              {((!userProfile?.email || !user?.email) && (!userProfile?.phone_verified || !userProfile?.phone_number)) && (
                <Alert className="bg-blue-500/10 border-blue-500/20">
                  <AlertDescription className="text-sm">
                    <strong>Note:</strong> You need at least one verified contact method (email OR phone) for Level 1. 
                    Please verify one in Account Settings before proceeding.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Level 1 -> Level 2 OR Resubmit Level 2 */}
          {((currentLevel === 1 && !needsResubmitForCurrentLevel) || (currentLevel === 2 && (needsResubmitForCurrentLevel || latestRejection)) || needsResubmitForLevel2) && !pendingVerification && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {(needsResubmitForCurrentLevel && currentLevel === 2) || needsResubmitForLevel2 ? "Resubmit Level 2 Verification" : "Step 2: Full Verification (Level 2)"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload a valid government-issued ID and complete liveness verification to unlock unlimited daily/lifetime trading.
              </p>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                  Level 2 Benefits:
                </p>
                <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                  <li>✓ Remove daily limits</li>
                  <li>✓ Remove lifetime limits</li>
                  <li>✓ Per Trade Limit: $100,000</li>
                  <li>✓ Access to more payment methods</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document-front">ID Document - Front Side</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload clear photo of the front of your ID
                  </p>
                  <Input
                    id="document-front"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  />
                  {documentFile && (
                    <p className="text-xs text-green-600">✓ Selected: {documentFile.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-back">ID Document - Back Side</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload clear photo of the back of your ID
                  </p>
                  <Input
                    id="document-back"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocumentBackFile(e.target.files?.[0] || null)}
                  />
                  {documentBackFile && (
                    <p className="text-xs text-green-600">✓ Selected: {documentBackFile.name}</p>
                  )}
                </div>
              </div>

              {showLivenessCheck ? (
                <LivenessCheck
                  onSuccess={(result) => setLivenessResult(result)}
                  onError={(error) => console.error("Liveness check error:", error)}
                />
              ) : (
                livenessResult?.isLive && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ✓ Liveness verified! Confidence: {(livenessResult.confidence * 100).toFixed(0)}%
                    </AlertDescription>
                  </Alert>
                )
              )}

              {!showLivenessCheck && !livenessResult && documentFile && (
                <Button 
                  onClick={() => setShowLivenessCheck(true)}
                  variant="outline"
                  className="w-full"
                >
                  Continue to Liveness Check
                </Button>
              )}

              {livenessResult?.isLive && (
                <Button 
                  onClick={() => submitVerification.mutate(2)}
                  disabled={!documentFile || !documentBackFile || submitVerification.isPending}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {submitVerification.isPending ? "Submitting..." : "Submit for Level 2 Verification"}
                </Button>
              )}
            </div>
          )}

          {/* Level 2 -> Level 3 OR Resubmit Level 3 */}
          {((currentLevel === 2 && !needsResubmitForCurrentLevel && !needsResubmitForLevel2) || (currentLevel === 3 && needsResubmitForCurrentLevel)) && !pendingVerification && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {needsResubmitForCurrentLevel && currentLevel === 3 ? "Resubmit Level 3 Verification" : "Step 3: Enhanced Due Diligence (Level 3)"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete address verification to unlock maximum trading power with $1,000,000 per-trade limit.
              </p>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                  Level 3 Benefits:
                </p>
                <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                  <li>✓ Maximum per-trade limit: $1,000,000</li>
                  <li>✓ Priority customer support</li>
                  <li>✓ Enhanced security features</li>
                  <li>✓ VIP status badge</li>
                </ul>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/20">
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Your address proof must be:
                  <ul className="mt-2 space-y-1 text-xs ml-4">
                    <li>• A recent utility bill, bank statement, or government letter</li>
                    <li>• Dated within the last 3 months</li>
                    <li>• Showing your full name exactly as registered</li>
                    <li>• Showing your complete residential address</li>
                    <li>• Clear and readable (not blurry or cut off)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address Proof (Utility Bill or Bank Statement)</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload a clear photo or PDF of your address proof document
                  </p>
                  <Input
                    id="address"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setAddressFile(e.target.files?.[0] || null)}
                  />
                  {addressFile && (
                    <p className="text-xs text-green-600">✓ Selected: {addressFile.name}</p>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => submitVerification.mutate(3)}
                disabled={!addressFile || submitVerification.isPending}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {submitVerification.isPending ? "Submitting..." : "Submit for Level 3 Verification"}
              </Button>
            </div>
          )}

          {currentLevel === 3 && !needsResubmitForCurrentLevel && !pendingVerification && !latestRejection && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Congratulations! You've reached the highest verification level.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Verification History */}
      {verifications && verifications.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Verification History</CardTitle>
            <CardDescription>
              Track all your verification submissions and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verifications.map((verification) => {
                const isRejectedCurrentLevel = verification.status === "rejected" && 
                  Number(verification.requested_level) === currentLevel;

                return (
                  <div 
                    key={verification.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      isRejectedCurrentLevel ? 'border-red-500/50 bg-red-500/5' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">Level {verification.requested_level}</p>
                        {isRejectedCurrentLevel && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Resubmit Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(verification.submitted_at).toLocaleDateString()}
                      </p>
                      {verification.status === "rejected" && verification.rejection_reason && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          Reason: {verification.rejection_reason}
                        </p>
                      )}
                      {isRejectedCurrentLevel && (
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">
                          ⚠️ Your access was revoked. Please resubmit verification above to restore access.
                        </p>
                      )}
                    </div>
                    <Badge variant={
                      verification.status === "approved" ? "default" :
                      verification.status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {verification.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for linking email */}
      <Dialog open={emailLinkingOpen} onOpenChange={setEmailLinkingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Email Address</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {profileData?.email 
                ? "Add and verify a new email address"
                : "Add email and password to enable email login"}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={linkingEmail}
                onChange={(e) => setLinkingEmail(e.target.value)}
              />
            </div>

            {!profileData?.email && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={linkingPassword}
                    onChange={(e) => setLinkingPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-enter your password"
                    value={linkingConfirmPassword}
                    onChange={(e) => setLinkingConfirmPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button onClick={handleEmailLink} className="w-full">
              Send Verification Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
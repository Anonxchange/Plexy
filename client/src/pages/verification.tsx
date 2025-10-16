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
import LivenessCheck from "@/components/liveness-check";
import { LivenessResult } from "@/lib/liveness-api";
import { uploadToR2 } from "@/lib/r2-storage";

export default function VerificationPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(null);
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch pending verifications
  const { data: verifications } = useQuery({
    queryKey: ["verifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("verifications")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const currentLevel = Number(user?.verification_level) || 0;
  const currentLevelConfig = getVerificationLevel(currentLevel);
  const nextLevelConfig = getNextLevel(currentLevel);
  const progress = (currentLevel / 3) * 100;

  // Submit date of birth for Level 1
  const submitDateOfBirth = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      if (!livenessResult || !livenessResult.isLive) {
        throw new Error("Please complete liveness verification first");
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
          date_of_birth: dateOfBirth, 
          verification_level: "1",
          last_liveness_check: new Date().toISOString(),
          liveness_verified: true
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setLivenessResult(null);
      setShowLivenessCheck(false);
    },
  });

  // Submit document verification
  const submitVerification = useMutation({
    mutationFn: async (requestedLevel: number) => {
      console.log("=== SUBMIT VERIFICATION STARTED ===");
      console.log("User ID:", user?.id);
      console.log("Requested Level:", requestedLevel);
      
      if (!user?.id) throw new Error("Not authenticated");
      if (requestedLevel === 2 && (!livenessResult || !livenessResult.isLive)) {
        throw new Error("Please complete liveness verification first");
      }

      // Upload files to R2 storage
      let documentUrl = null;
      let documentBackUrl = null;
      let addressUrl = null;
      let livenessImageUrl = null;

      if (documentFile) {
        console.log("Uploading document front file...");
        
        // Add a timeout wrapper to prevent hanging
        const uploadPromise = uploadToR2(documentFile, 'verification-documents', user.id);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout after 90 seconds')), 90000)
        );
        
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        console.log("Document front upload result:", result);
        
        if (result.success && result.url) {
          documentUrl = result.url;
        } else {
          throw new Error(`Document front upload failed: ${result.error || 'Unknown error'}`);
        }
      }

      if (documentBackFile) {
        console.log("Uploading document back file...");
        
        const uploadPromise = uploadToR2(documentBackFile, 'verification-documents', user.id);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout after 90 seconds')), 90000)
        );
        
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        console.log("Document back upload result:", result);
        
        if (result.success && result.url) {
          documentBackUrl = result.url;
        } else {
          throw new Error(`Document back upload failed: ${result.error || 'Unknown error'}`);
        }
      }

      if (addressFile) {
        console.log("Uploading address proof...");
        const result = await uploadToR2(addressFile, 'verification-documents', user.id);
        console.log("Address proof upload result:", result);
        if (result.success && result.url) {
          addressUrl = result.url;
        } else {
          throw new Error(`Address proof upload failed: ${result.error}`);
        }
      }

      if (livenessResult?.capturedImage) {
        console.log("Uploading liveness image...");
        
        const uploadPromise = uploadToR2(livenessResult.capturedImage, 'liveness-captures', user.id);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout after 90 seconds')), 90000)
        );
        
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        console.log("Liveness image upload result:", result);
        
        if (result.success && result.url) {
          livenessImageUrl = result.url;
        }
      }

      console.log("Inserting verification record...");
      const { data, error } = await supabase
        .from("verifications")
        .insert({
          user_id: user.id,
          requested_level: requestedLevel,
          document_type: "government_id",
          document_url: documentUrl,
          document_back_url: documentBackUrl,
          address_proof: addressUrl,
          liveness_image_url: livenessImageUrl,
          liveness_check_passed: livenessResult ? String(livenessResult.isLive) : null,
          liveness_confidence: livenessResult ? String(livenessResult.confidence) : null,
          liveness_checked_at: livenessResult ? new Date().toISOString() : null,
          status: "pending",
        })
        .select();

      console.log("Verification insert result:", { data, error });

      if (error) {
        console.error("Verification insert error:", error);
        throw new Error(`Failed to submit verification: ${error.message}`);
      }
      
      console.log("=== SUBMIT VERIFICATION COMPLETED ===");
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
  const rejectedVerifications = verifications?.filter(v => v.status === "rejected") || [];
  const latestRejection = rejectedVerifications.length > 0 ? rejectedVerifications[0] : null;
  
  // Check if user needs to resubmit for their current level (was approved then rejected)
  const needsResubmitForCurrentLevel = latestRejection && 
    Number(latestRejection.requested_level) === currentLevel && 
    !pendingVerification;
  
  // Check if user needs to resubmit for a lower level that was rejected
  const needsResubmitForLevel2 = latestRejection && 
    Number(latestRejection.requested_level) === 2 && 
    currentLevel === 3 && 
    !pendingVerification;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Verification</h1>
        <p className="text-muted-foreground">
          Unlock trading limits and features by verifying your account
        </p>
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
                {currentLevelConfig.dailyLimit ? (
                  <p>Daily Limit: ${currentLevelConfig.dailyLimit.toLocaleString()}</p>
                ) : (
                  <p>Daily Limit: Unlimited</p>
                )}
                {currentLevelConfig.perTradeLimit && (
                  <p>Per Trade: ${currentLevelConfig.perTradeLimit.toLocaleString()}</p>
                )}
                {currentLevelConfig.lifetimeTradeLimit && (
                  <p>Lifetime Trade: ${currentLevelConfig.lifetimeTradeLimit.toLocaleString()}</p>
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
          
          {latestRejection && !needsResubmitForCurrentLevel && !pendingVerification && (
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
                {needsResubmitForCurrentLevel && currentLevel === 1 ? "Resubmit Level 1 Verification" : "Step 1: Verify Your Age (Level 1)"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Confirm your age and complete liveness verification to unlock basic trading features with a $1,000 daily limit.
              </p>

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

              {!showLivenessCheck && !livenessResult && dateOfBirth && (
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
                  onClick={() => submitDateOfBirth.mutate()}
                  disabled={!dateOfBirth || submitDateOfBirth.isPending}
                  className="w-full"
                >
                  {submitDateOfBirth.isPending ? "Verifying..." : "Complete Level 1 Verification"}
                </Button>
              )}

              {submitDateOfBirth.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {submitDateOfBirth.error instanceof Error ? submitDateOfBirth.error.message : "Verification failed"}
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
          {((currentLevel === 2 && !needsResubmitForCurrentLevel) || (currentLevel === 3 && needsResubmitForCurrentLevel)) && !pendingVerification && (
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address Proof (Utility Bill or Bank Statement)</Label>
                  <p className="text-xs text-muted-foreground">
                    Document must show your full name and current address, dated within last 3 months
                  </p>
                  <Input
                    id="address"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setAddressFile(e.target.files?.[0] || null)}
                  />
                  {addressFile && (
                    <p className="text-xs text-green-600">Selected: {addressFile.name}</p>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => submitVerification.mutate(3)}
                disabled={!addressFile || submitVerification.isPending}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {submitVerification.isPending ? "Submitting..." : "Submit for Level 3"}
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
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, XCircle, Eye, User } from '@/lib/icons';
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (selectedVerification) {
      setFullName("");
      setCountry("");
      setRejectionReason("");
    }
  }, [selectedVerification]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (user?.id) {
        try {
          const supabase = await getSupabase();
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          if (profile?.is_admin) setIsAdmin(true);
        } catch {}
      }
      setCheckingSession(false);
    };

    checkAdminAccess();
  }, [user?.id]);

  // Fetch all pending verifications
  const { data: verifications, isLoading, error: queryError } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const supabase = await getSupabase();

      const { data: simpleData, error: simpleError } = await supabase
        .from("verifications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (simpleError) throw new Error(`Database error: ${simpleError.message}`);
      if (!simpleData || simpleData.length === 0) return [];

      const { data, error } = await supabase
        .from("verifications")
        .select(`
          *,
          user_profiles!verifications_user_id_fkey (
            id,
            username,
            email,
            verification_level,
            full_name,
            country
          )
        `)
        .order("submitted_at", { ascending: false });

      if (error) {
        return simpleData.map((v: any) => ({
          ...v,
          user_profiles: { id: v.user_id, username: "Unknown", email: "", verification_level: 0 }
        }));
      }

      return data;
    },
    enabled: isAdmin,
  });

  // Log any query errors
  if (queryError) {
    console.error("Query error:", queryError);
  }

  const approveVerification = useMutation({
    mutationFn: async (verificationId: string) => {
      const supabase = await getSupabase();
      const verification = verifications?.find((v: any) => v.id === verificationId);
      if (!verification) throw new Error("Verification not found");

      const { error: verifyError } = await supabase
        .from("verifications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null
        })
        .eq("id", verificationId);

      if (verifyError) throw verifyError;

      const updateData: any = { verification_level: verification.requested_level };
      if (fullName) updateData.full_name = fullName;
      if (country) updateData.country = country;

      const { error: userError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", verification.user_id);

      if (userError) throw userError;
      return { success: true };
    },
    onSuccess: () => {
      console.log("✅ Approve mutation successful - invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
      alert("Verification approved successfully!");
    },
    onError: (error) => {
      console.error("❌ Approve mutation error:", error);
      alert("Failed to approve verification: " + error.message);
    }
  });

  const rejectVerification = useMutation({
    mutationFn: async (verificationId: string) => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("verifications")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
          rejection_reason: rejectionReason || "No reason provided"
        })
        .eq("id", verificationId)
        .select();

      if (error) throw new Error(`Database error: ${error.message || 'Unknown error'}`);
      if (!data || data.length === 0) throw new Error("Failed to update verification status — check admin permissions");
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
      setRejectionReason("");
      alert("Verification rejected successfully!");
    },
    onError: (error: Error) => {
      alert("Failed to reject verification: " + error.message);
    }
  });

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Checking access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              {user ? "Your account does not have admin privileges." : "You must be signed in with an admin account."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const pendingVerifications = verifications?.filter(v => v.status === "pending") || [];
  const reviewedVerifications = verifications?.filter(v => v.status !== "pending") || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Verification Management</h1>
            <p className="text-muted-foreground">
              Review and approve user verification requests
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                const supabase = await getSupabase();
                const { count, error } = await supabase
                  .from("verifications")
                  .select("*", { count: 'exact', head: true });
                alert(`Database test:\nVerifications found: ${count || 0}\nError: ${error?.message || 'None'}`);
              } catch (e: any) {
                alert(`Database test failed: ${e?.message}`);
              }
            }}
          >
            Test Database
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingVerifications.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{verifications?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {reviewedVerifications.filter(v => {
                const reviewDate = new Date(v.reviewed_at);
                const today = new Date();
                return reviewDate.toDateString() === today.toDateString();
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>Review and approve user verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : pendingVerifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending verifications</p>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((verification) => (
                <div key={verification.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">
                        {verification.user_profiles.full_name || verification.user_profiles.username}
                        <span className="text-muted-foreground ml-2">(@{verification.user_profiles.username})</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{verification.user_profiles.email}</p>
                      {verification.user_profiles.country && (
                        <p className="text-sm text-muted-foreground">Country: {verification.user_profiles.country}</p>
                      )}
                      <p className="text-sm mt-1">
                        Current Level: <Badge variant="outline">{verification.user_profiles.verification_level}</Badge>
                        {" → "}
                        Requested Level: <Badge>{verification.requested_level}</Badge>
                      </p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <p><strong>Document Type:</strong> {verification.document_type || "N/A"}</p>
                    <p><strong>Submitted:</strong> {new Date(verification.submitted_at).toLocaleString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log("Review button clicked for verification:", verification.id);
                        setSelectedVerification(verification);
                      }}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log("🚀 Quick approve button clicked!");
                        console.log("Verification ID:", verification.id);
                        console.log("Verification data:", verification);
                        approveVerification.mutate(verification.id);
                      }}
                      disabled={approveVerification.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {approveVerification.isPending ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        console.log("Reject button clicked, opening dialog for:", verification.id);
                        setSelectedVerification(verification);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviewed Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reviewedVerifications.slice(0, 10).map((verification) => (
              <div key={verification.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">
                    {verification.user_profiles.full_name || verification.user_profiles.username}
                    <span className="text-muted-foreground ml-2 text-sm">(@{verification.user_profiles.username})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Level {verification.requested_level} · {new Date(verification.reviewed_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedVerification(verification)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove this verification for @${verification.user_profiles.username}?`)) {
                        console.log("Removing verification:", verification.id);
                        setRejectionReason("Removed by admin");
                        rejectVerification.mutate(verification.id);
                      }
                    }}
                    disabled={rejectVerification.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Badge variant={verification.status === "approved" ? "default" : "destructive"}>
                    {verification.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
            <DialogDescription>
              User: {selectedVerification?.user_profiles?.full_name || selectedVerification?.user_profiles?.username} (@{selectedVerification?.user_profiles?.username})
              {selectedVerification?.user_profiles?.country && ` · ${selectedVerification?.user_profiles?.country}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto pr-4" style={{ maxHeight: 'calc(95vh - 200px)' }}>
            <div className="space-y-6">
              {/* Verification Summary */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-3">Verification Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Level:</span>
                    <Badge variant="outline">{selectedVerification?.user_profiles?.verification_level}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested Level:</span>
                    <Badge>{selectedVerification?.requested_level}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Document Type:</span>
                    <span className="font-medium">{selectedVerification?.document_type || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={selectedVerification?.status === "approved" ? "default" : selectedVerification?.status === "rejected" ? "destructive" : "secondary"}>
                      {selectedVerification?.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="text-xs">{selectedVerification && new Date(selectedVerification.submitted_at).toLocaleString()}</span>
                  </div>
                  {selectedVerification?.liveness_check_passed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Liveness Check:</span>
                      <span className={selectedVerification.liveness_check_passed === "true" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {selectedVerification.liveness_check_passed === "true" ? "✓ Passed" : "✗ Failed"} 
                        ({selectedVerification.liveness_confidence ? `${(parseFloat(selectedVerification.liveness_confidence) * 100).toFixed(0)}%` : "N/A"})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submitted Documents */}
              <div>
                <h3 className="font-semibold mb-3">Submitted Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedVerification?.document_url && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">ID Document - Front</p>
                      <img 
                        src={selectedVerification.document_url} 
                        alt="Identity document front" 
                        className="w-full rounded-lg border hover:border-primary transition-colors cursor-pointer"
                        onClick={() => window.open(selectedVerification.document_url, '_blank')}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const errorMsg = document.createElement('p');
                          errorMsg.className = 'text-sm text-muted-foreground';
                          errorMsg.textContent = 'Image failed to load';
                          img.parentElement?.appendChild(errorMsg);
                        }}
                      />
                    </div>
                  )}

                  {selectedVerification?.document_back_url && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">ID Document - Back</p>
                      <img 
                        src={selectedVerification.document_back_url} 
                        alt="Identity document back" 
                        className="w-full rounded-lg border hover:border-primary transition-colors cursor-pointer"
                        onClick={() => window.open(selectedVerification.document_back_url, '_blank')}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const errorMsg = document.createElement('p');
                          errorMsg.className = 'text-sm text-muted-foreground';
                          errorMsg.textContent = 'Image failed to load';
                          img.parentElement?.appendChild(errorMsg);
                        }}
                      />
                    </div>
                  )}

                  {selectedVerification?.liveness_image_url && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Liveness Capture</p>
                      <img 
                        src={selectedVerification.liveness_image_url} 
                        alt="Liveness capture" 
                        className="w-full rounded-lg border hover:border-primary transition-colors cursor-pointer"
                        onClick={() => window.open(selectedVerification.liveness_image_url, '_blank')}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const errorMsg = document.createElement('p');
                          errorMsg.className = 'text-sm text-muted-foreground';
                          errorMsg.textContent = 'Image failed to load';
                          img.parentElement?.appendChild(errorMsg);
                        }}
                      />
                    </div>
                  )}

                  {selectedVerification?.address_proof && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Address Proof</p>
                      <img 
                        src={selectedVerification.address_proof} 
                        alt="Address proof" 
                        className="w-full rounded-lg border hover:border-primary transition-colors cursor-pointer"
                        onClick={() => window.open(selectedVerification.address_proof, '_blank')}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const errorMsg = document.createElement('p');
                          errorMsg.className = 'text-sm text-muted-foreground';
                          errorMsg.textContent = 'Image failed to load';
                          img.parentElement?.appendChild(errorMsg);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* User Information Update Form (only for pending verifications) */}
              {selectedVerification?.status === "pending" && (
                <div className="border rounded-lg p-4 bg-primary/5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Update User Information (Level {selectedVerification.requested_level})
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Update or verify the user's country and full name before approval
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter user's full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Enter user's country"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedVerification?.status === "pending" && (
                <div>
                  <Label htmlFor="rejection">Rejection Reason (optional)</Label>
                  <Textarea
                    id="rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason if rejecting..."
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          {selectedVerification?.status === "pending" && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  console.log("Approve button clicked for:", selectedVerification.id);
                  approveVerification.mutate(selectedVerification.id);
                }}
                disabled={approveVerification.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {approveVerification.isPending ? "Approving..." : "Approve"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!rejectionReason) {
                    alert("Please provide a rejection reason");
                    return;
                  }
                  console.log("Reject button clicked for:", selectedVerification.id);
                  rejectVerification.mutate(selectedVerification.id);
                }}
                disabled={rejectVerification.isPending}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {rejectVerification.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

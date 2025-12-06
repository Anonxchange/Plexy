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
import { Shield, CheckCircle, XCircle, Eye, User } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function AdminVerificationsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
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
      // First check if admin session exists in localStorage
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
          // Check if session is still valid (not expired)
          if (session.expiresAt > Date.now()) {
            setIsAdmin(true);
            setCheckingSession(false);
            return;
          } else {
            localStorage.removeItem('admin_session');
          }
        } catch (e) {
          localStorage.removeItem('admin_session');
        }
      }

      // Check if user has admin role in database
      if (user?.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
          setCheckingSession(false);
          return;
        }
      }

      setIsAdmin(false);
      setCheckingSession(false);
    };

    checkAdminAccess();
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();
      
      if (error || !data?.is_admin) {
        alert("Access denied. You don't have admin privileges.");
        return;
      }
      
      const session = {
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorage.setItem('admin_session', JSON.stringify(session));
      setIsAdmin(true);
    } catch (error) {
      alert("Authentication failed");
    }
  };

  // Fetch all pending verifications
  const { data: verifications, isLoading, error: queryError } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      console.log("=== FETCHING VERIFICATIONS ===");
      console.log("Current user ID:", user?.id);
      console.log("Is admin:", isAdmin);
      
      // First, let's try a simple query without joins to see if we can access the table
      const { data: simpleData, error: simpleError } = await supabase
        .from("verifications")
        .select("*")
        .order("submitted_at", { ascending: false });

      console.log("Simple query result:", { data: simpleData, error: simpleError });
      console.log("Number of verifications (simple):", simpleData?.length || 0);

      if (simpleError) {
        console.error("❌ Simple query failed:", simpleError);
        // If even simple query fails, return it with error details
        throw new Error(`Database error: ${simpleError.message}`);
      }

      // If simple query works but returns no data, that's the issue
      if (!simpleData || simpleData.length === 0) {
        console.warn("⚠️ No verifications found in database");
        return [];
      }

      // Now try the full query with join
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
        console.error("❌ Error fetching verifications with join:", error);
        // Fall back to simple data if join fails
        console.log("Falling back to simple query data");
        return simpleData.map(v => ({
          ...v,
          user_profiles: { id: v.user_id, username: "Unknown", email: "", verification_level: 0 }
        }));
      }
      
      console.log("✅ Full verifications data:", data);
      console.log("Number of verifications:", data?.length || 0);
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
      console.log("=== APPROVE MUTATION STARTED ===");
      console.log("Verification ID:", verificationId);
      console.log("Current user ID:", user?.id);
      
      // Check admin status
      const { data: adminCheck, error: adminError } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", user?.id)
        .single();

      console.log("Admin check result:", { adminCheck, adminError });
      
      const verification = verifications?.find(v => v.id === verificationId);
      
      if (!verification) {
        throw new Error("Verification not found");
      }

      // Update verification status
      const { data: verifyData, error: verifyError } = await supabase
        .from("verifications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null
        })
        .eq("id", verificationId)
        .select();

      console.log("Verification update result:", { data: verifyData, error: verifyError });

      if (verifyError) {
        console.error("Error updating verification:", verifyError);
        throw verifyError;
      }

      // Update user's verification level and additional info
      const updateData: any = { verification_level: verification.requested_level };
      
      if (fullName) {
        updateData.full_name = fullName;
      }
      if (country) {
        updateData.country = country;
      }

      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", verification.user_id)
        .select();

      console.log("User profile update result:", { data: userData, error: userError });

      if (userError) {
        console.error("Error updating user profile:", userError);
        throw userError;
      }

      console.log("=== APPROVE MUTATION COMPLETED ===");
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
      console.log("=== REJECT MUTATION STARTED ===");
      console.log("Verification ID:", verificationId);
      console.log("Current user ID:", user?.id);
      console.log("Rejection reason:", rejectionReason);

      // Check admin status
      const { data: adminCheck, error: adminError } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", user?.id)
        .single();

      console.log("Admin check result:", { adminCheck, adminError });

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

      console.log("Reject update result:", { data, error });

      if (error) {
        console.error("Error rejecting verification:", error);
        // Provide more detailed error message
        throw new Error(`Database error: ${error.message || 'Unknown error'}`);
      }

      if (!data || data.length === 0) {
        console.error("No rows updated - verification might not exist or no permissions");
        throw new Error("Failed to update verification status - check admin permissions");
      }

      console.log("=== REJECT MUTATION COMPLETED ===");
      return { success: true };
    },
    onSuccess: () => {
      console.log("Reject mutation successful");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
      setRejectionReason("");
      alert("Verification rejected successfully!");
    },
    onError: (error) => {
      console.error("Reject mutation error:", error);
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
              <Shield className="h-6 w-6" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              You need admin privileges to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Alert>
                <AlertDescription>
                  Only users with admin privileges can access verification management.
                  Click the button below to verify your access.
                </AlertDescription>
              </Alert>
              <Button type="submit" className="w-full">
                Check Admin Access
              </Button>
            </form>
          </CardContent>
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
              console.log("Testing database connection...");
              const { data, error, count } = await supabase
                .from("verifications")
                .select("*", { count: 'exact' });
              
              console.log("Test query result:", { data, error, count });
              alert(`Database test:\nVerifications found: ${count || 0}\nError: ${error?.message || 'None'}`);
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
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML += '<p class="text-sm text-muted-foreground">Image failed to load</p>';
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
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML += '<p class="text-sm text-muted-foreground">Image failed to load</p>';
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
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML += '<p class="text-sm text-muted-foreground">Image failed to load</p>';
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
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML += '<p class="text-sm text-muted-foreground">Image failed to load</p>';
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
import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, XCircle, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function AdminVerificationsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch all pending verifications
  const { data: verifications, isLoading } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verifications")
        .select(`
          *,
          user_profiles (
            id,
            username,
            email,
            verification_level
          )
        `)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  const approveVerification = useMutation({
    mutationFn: async (verificationId: string) => {
      const verification = verifications?.find(v => v.id === verificationId);
      if (!verification) throw new Error("Verification not found");

      // Update verification status
      const { error: verifyError } = await supabase
        .from("verifications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: "admin"
        })
        .eq("id", verificationId);

      if (verifyError) throw verifyError;

      // Update user's verification level
      const { error: userError } = await supabase
        .from("user_profiles")
        .update({ verification_level: String(verification.requested_level) })
        .eq("id", verification.user_id);

      if (userError) throw userError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
    },
  });

  const rejectVerification = useMutation({
    mutationFn: async (verificationId: string) => {
      const { error } = await supabase
        .from("verifications")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: "admin",
          rejection_reason: rejectionReason
        })
        .eq("id", verificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedVerification(null);
      setRejectionReason("");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "PexlyAdmin2024!") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Enter the admin password to access verification management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              <Button type="submit" className="w-full">
                Login
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
        <h1 className="text-3xl font-bold mb-2">Verification Management</h1>
        <p className="text-muted-foreground">
          Review and approve user verification requests
        </p>
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
                      <p className="font-semibold">@{verification.user_profiles.username}</p>
                      <p className="text-sm text-muted-foreground">{verification.user_profiles.email}</p>
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
                      onClick={() => setSelectedVerification(verification)}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveVerification.mutate(verification.id)}
                      disabled={approveVerification.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedVerification(verification);
                        // Will show rejection dialog
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
                <div>
                  <p className="font-semibold">@{verification.user_profiles.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Level {verification.requested_level} · {new Date(verification.reviewed_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={verification.status === "approved" ? "default" : "destructive"}>
                  {verification.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
            <DialogDescription>
              User: @{selectedVerification?.user_profiles?.username}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Current Level</p>
                <p>{selectedVerification?.user_profiles?.verification_level}</p>
              </div>
              <div>
                <p className="font-semibold">Requested Level</p>
                <p>{selectedVerification?.requested_level}</p>
              </div>
              <div>
                <p className="font-semibold">Document Type</p>
                <p>{selectedVerification?.document_type || "N/A"}</p>
              </div>
              <div>
                <p className="font-semibold">Submitted</p>
                <p>{selectedVerification && new Date(selectedVerification.submitted_at).toLocaleString()}</p>
              </div>
            </div>

            {selectedVerification?.document_url && (
              <div>
                <p className="font-semibold mb-2">Document</p>
                <p className="text-sm text-muted-foreground">Document URL: {selectedVerification.document_url}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rejection">Rejection Reason (optional)</Label>
              <Textarea
                id="rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason if rejecting..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => approveVerification.mutate(selectedVerification.id)}
                disabled={approveVerification.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectVerification.mutate(selectedVerification.id)}
                disabled={rejectVerification.isPending || !rejectionReason}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, XCircle, Award, DollarSign, User, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminMerchantsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [merchantType, setMerchantType] = useState<"verified_merchant" | "block_merchant">("verified_merchant");

  useEffect(() => {
    const checkAdminAccess = async () => {
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
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

      if (user?.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
        }
      }
      setCheckingSession(false);
    };

    checkAdminAccess();
  }, [user?.id]);

  const { data: pendingApplications = [] } = useQuery({
    queryKey: ["pendingMerchantApplications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          *,
          pexly_balances(*)
        `)
        .eq("merchant_status", "pending")
        .order("merchant_applied_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: activeMerchants = [] } = useQuery({
    queryKey: ["activeMerchants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .in("merchant_status", ["verified_merchant", "block_merchant"])
        .order("merchant_approved_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const approveMerchant = useMutation({
    mutationFn: async ({ userId, merchantType }: { userId: string; merchantType: "verified_merchant" | "block_merchant" }) => {
      if (!userId) throw new Error("User ID is required");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          merchant_status: merchantType,
          merchant_approved_at: new Date().toISOString(),
          merchant_rejected_at: null,
          merchant_rejection_reason: null,
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingMerchantApplications"] });
      queryClient.invalidateQueries({ queryKey: ["activeMerchants"] });
      setSelectedApplication(null);
      setMerchantType("verified_merchant");
      toast({
        title: "Merchant Approved",
        description: "The merchant application has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMerchant = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      if (!userId) throw new Error("User ID is required");
      if (!reason) throw new Error("Rejection reason is required");

      const profile = pendingApplications.find((p: any) => p.id === userId);
      if (!profile) throw new Error("Profile not found");

      const depositAmount = Number(profile.merchant_deposit_amount || 0);
      const currentLockedBalance = Number(profile.pexly_balances?.[0]?.locked_balance || 0);

      const { error: balanceError } = await supabase
        .from("pexly_balances")
        .update({
          locked_balance: Math.max(0, currentLockedBalance - depositAmount),
        })
        .eq("user_id", userId);

      if (balanceError) throw balanceError;

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          merchant_status: "none",
          merchant_deposit_amount: 0,
          merchant_rejected_at: new Date().toISOString(),
          merchant_rejection_reason: reason,
          merchant_deposit_locked_at: null,
        })
        .eq("id", userId);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingMerchantApplications"] });
      queryClient.invalidateQueries({ queryKey: ["activeMerchants"] });
      setSelectedApplication(null);
      setRejectionReason("");
      toast({
        title: "Application Rejected",
        description: "The merchant application has been rejected and deposit refunded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAdminLogin = () => {
    if (password === "admin123") {
      const session = {
        expiresAt: Date.now() + (24 * 60 * 60 * 1000),
      };
      localStorage.setItem('admin_session', JSON.stringify(session));
      setIsAdmin(true);
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin password",
        variant: "destructive",
      });
    }
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-md mx-auto p-6 min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Enter the admin password to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="Enter admin password"
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              Access Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Merchant Management</h1>
        <p className="text-muted-foreground">Review and approve merchant applications</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Applications ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Merchants ({activeMerchants.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending merchant applications
              </CardContent>
            </Card>
          ) : (
            pendingApplications.map((application: any) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-6 w-6" />
                      <div>
                        <CardTitle>{application.username}</CardTitle>
                        <CardDescription>
                          Applied {new Date(application.merchant_applied_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Verification Level</p>
                      <p className="font-semibold">Level {application.verification_level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="font-semibold">{application.total_trades || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deposit Amount</p>
                      <p className="font-semibold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {Number(application.merchant_deposit_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requested Tier</p>
                      <p className="font-semibold">
                        {Number(application.merchant_deposit_amount) >= 500 ? "Block" : "Verified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setSelectedApplication(application)}
                      variant="outline"
                      className="flex-1"
                    >
                      Review Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMerchants.map((merchant: any) => (
              <Card key={merchant.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {merchant.merchant_status === "block_merchant" ? (
                        <Award className="h-5 w-5 text-purple-500" />
                      ) : (
                        <Shield className="h-5 w-5 text-blue-500" />
                      )}
                      <CardTitle className="text-lg">{merchant.username}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant={merchant.merchant_status === "block_merchant" ? "default" : "secondary"}>
                      {merchant.merchant_status === "block_merchant" ? "Block" : "Verified"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit:</span>
                    <span className="font-semibold">${Number(merchant.merchant_deposit_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Since:</span>
                    <span>{new Date(merchant.merchant_approved_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Trades:</span>
                    <span>{merchant.total_trades || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Review Merchant Application</DialogTitle>
            <DialogDescription>
              Review the applicant's details and approve or reject the application
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Applicant Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Username</p>
                      <p className="font-medium">{selectedApplication.username}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedApplication.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-medium">{selectedApplication.country || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Verification Level</p>
                      <p className="font-medium">Level {selectedApplication.verification_level}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Trades</p>
                      <p className="font-medium">{selectedApplication.total_trades || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Positive Feedback</p>
                      <p className="font-medium">{selectedApplication.positive_feedback || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Application Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Applied Date</p>
                      <p className="font-medium">
                        {new Date(selectedApplication.merchant_applied_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deposit Amount</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {Number(selectedApplication.merchant_deposit_amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="merchantType">Approve as Merchant Type</Label>
                  <select
                    id="merchantType"
                    value={merchantType}
                    onChange={(e) => setMerchantType(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="verified_merchant">Verified Merchant ($200 deposit)</option>
                    <option value="block_merchant">Block Merchant ($500 deposit)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="rejection">Rejection Reason (if rejecting)</Label>
                  <Textarea
                    id="rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                  />
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {rejectionReason 
                      ? "The deposit will be unlocked and refunded if you reject this application."
                      : "Approving will grant the user merchant status and their deposit will remain locked."}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => approveMerchant.mutate({ 
                      userId: selectedApplication.id,
                      merchantType 
                    })}
                    disabled={approveMerchant.isPending || rejectMerchant.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {approveMerchant.isPending ? "Approving..." : `Approve as ${merchantType === "block_merchant" ? "Block" : "Verified"} Merchant`}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => rejectMerchant.mutate({ 
                      userId: selectedApplication.id, 
                      reason: rejectionReason 
                    })}
                    disabled={!rejectionReason || approveMerchant.isPending || rejectMerchant.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {rejectMerchant.isPending ? "Rejecting..." : "Reject"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function KYCCallback() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      const resultStatus = urlParams.get("status");

      if (!user?.id) {
        setStatus("error");
        setMessage("Please sign in to complete verification");
        return;
      }

      if (resultStatus === "success" || resultStatus === "completed") {
        setStatus("success");
        setMessage("Your identity has been verified successfully! Your account will be upgraded shortly.");
      } else if (resultStatus === "pending" || resultStatus === "processing") {
        setStatus("pending");
        setMessage("Your verification is being processed. This usually takes a few minutes.");
      } else if (resultStatus === "failed" || resultStatus === "rejected") {
        setStatus("error");
        setMessage("Verification was not successful. Please try again or contact support.");
      } else {
        setStatus("pending");
        setMessage("Your verification has been submitted and is being reviewed.");
      }
    };

    processCallback();
  }, [user]);

  const getIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />;
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "pending":
        return <Clock className="h-12 w-12 text-orange-500" />;
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case "loading":
        return "Processing...";
      case "success":
        return "Verification Complete!";
      case "pending":
        return "Verification Pending";
      case "error":
        return "Verification Issue";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className={
            status === "success" ? "bg-green-500/10 border-green-500/20" :
            status === "pending" ? "bg-orange-500/10 border-orange-500/20" :
            status === "error" ? "bg-red-500/10 border-red-500/20" :
            ""
          }>
            <AlertDescription className="text-center">
              {message}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => setLocation("/verification")}
              className="w-full"
            >
              Back to Verification
            </Button>
            <Button 
              onClick={() => setLocation("/dashboard")}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Link2, HelpCircle, Info } from "lucide-react";

export function ConnectedAppsSection() {
  const { user } = useAuth();
  const supabase = createClient();
  const [connectedApps, setConnectedApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnectedApps = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("connected_apps")
          .select("*")
          .eq("user_id", user.id)
          .order("last_used", { ascending: false });

        if (error) {
          console.error("Error fetching connected apps:", error);
        } else {
          setConnectedApps(data || []);
        }
      } catch (error) {
        console.error("Error fetching connected apps:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedApps();
  }, [user]);

  const handleDisconnect = async (appId: string) => {
    try {
      const { error } = await supabase
        .from("connected_apps")
        .delete()
        .eq("id", appId);

      if (error) {
        console.error("Error disconnecting app:", error);
      } else {
        setConnectedApps(connectedApps.filter((app) => app.id !== appId));
      }
    } catch (error) {
      console.error("Error disconnecting app:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-4">Connected Apps & Websites</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Below you can find the complete list of apps and websites you've used Pexly to sign in with.
          These apps and websites will automatically have access to parts of your information. In case you
          remove any of these, they will still have access to the information you shared with them previously,
          yet they can't collect anything new.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      ) : connectedApps.length > 0 ? (
        <div className="space-y-3">
          {connectedApps.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {app.app_icon_url ? (
                      <img src={app.app_icon_url} alt={app.app_name} className="h-10 w-10 rounded" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        <Link2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{app.app_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(app.connected_at).toLocaleDateString()}
                      </p>
                      {app.scope && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Access: {app.scope}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(app.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <Link2 className="h-16 w-16 text-primary opacity-20" />
                <HelpCircle className="h-8 w-8 text-primary absolute -bottom-1 -right-1" />
              </div>
              <p className="text-muted-foreground">
                You haven't connected to any app or website
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm">
                When you connect to apps or websites using your Pexly account, they will appear here.
                You can manage their access and revoke permissions at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

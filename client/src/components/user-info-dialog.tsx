import { Dialog, DialogContent, DialogHeader } from “@/components/ui/dialog”;
import { Avatar, AvatarFallback, AvatarImage } from “@/components/ui/avatar”;
import { Badge } from “@/components/ui/badge”;
import { Button } from “@/components/ui/button”;
import { ThumbsUp, ThumbsDown, X, ChevronDown, ChevronUp, Check } from “lucide-react”;
import { useState, useEffect } from “react”;
import { createClient } from “@/lib/supabase”;

interface UserInfoDialogProps {
isOpen: boolean;
onClose: () => void;
userId: string;
username?: string;
avatarUrl?: string | null;
positiveRatings?: number;
negativeRatings?: number;
}

export function UserInfoDialog({
isOpen,
onClose,
userId,
username,
avatarUrl,
positiveRatings = 0,
negativeRatings = 0,
}: UserInfoDialogProps) {
const [aboutExpanded, setAboutExpanded] = useState(true);
const [tradingInfoExpanded, setTradingInfoExpanded] = useState(true);
const [sharedFilesExpanded, setSharedFilesExpanded] = useState(false);
const [userDetails, setUserDetails] = useState<any>(null);
const [loading, setLoading] = useState(true);

const supabase = createClient();

useEffect(() => {
if (isOpen && userId) {
fetchUserDetails();
}
}, [isOpen, userId]);

const fetchUserDetails = async () => {
try {
setLoading(true);

```
  // Fetch user profile details
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Fetch verification status
  const { data: verification } = await supabase
    .from("verifications")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Count trades
  const { count: tradesCount } = await supabase
    .from("p2p_trades")
    .select("*", { count: "exact", head: true })
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .eq("status", "completed");

  // Count unique trade partners
  const { data: buyerTrades } = await supabase
    .from("p2p_trades")
    .select("seller_id")
    .eq("buyer_id", userId)
    .eq("status", "completed");

  const { data: sellerTrades } = await supabase
    .from("p2p_trades")
    .select("buyer_id")
    .eq("seller_id", userId)
    .eq("status", "completed");

  const uniquePartners = new Set([
    ...(buyerTrades?.map(t => t.seller_id) || []),
    ...(sellerTrades?.map(t => t.buyer_id) || [])
  ]);

  // Calculate time since joined
  const joinedDate = new Date(profile?.created_at);
  const now = new Date();
  const yearsDiff = now.getFullYear() - joinedDate.getFullYear();

  setUserDetails({
    ...profile,
    verification,
    tradesCount: tradesCount || 0,
    partnersCount: uniquePartners.size,
    yearsJoined: yearsDiff || 0,
  });
} catch (error) {
  console.error("Error fetching user details:", error);
} finally {
  setLoading(false);
}
```

};

return (
<Dialog open={isOpen} onOpenChange={onClose}>
<DialogContent className="max-w-md p-0 gap-0 max-h-[90vh] overflow-y-auto bg-[#0d1f1a] border-gray-800">
{/* Header */}
<DialogHeader className="p-4 pb-3 border-b border-gray-800">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<Avatar className="w-12 h-12">
<AvatarImage src={avatarUrl || undefined} alt={username} />
<AvatarFallback className="bg-teal-700 text-white">{username?.charAt(0).toUpperCase()}</AvatarFallback>
</Avatar>
<div>
<div className="font-semibold text-gray-200">{username}</div>
<div className="flex items-center gap-2 text-sm">
<Badge variant="outline" className="flex items-center gap-1 bg-transparent text-teal-400 border-teal-600">
<ThumbsUp className="w-3 h-3 fill-teal-400" />
{positiveRatings}
</Badge>
<Badge variant="outline" className="flex items-center gap-1 bg-transparent text-red-400 border-red-600">
<ThumbsDown className="w-3 h-3 fill-red-400" />
{negativeRatings}
</Badge>
</div>
</div>
</div>
<Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-800 text-gray-300">
<X className="w-5 h-5" />
</Button>
</div>
</DialogHeader>

```
    {/* Content */}
    <div className="p-4 space-y-4 bg-[#0d1f1a]">
      {/* About Section */}
      <div className="border border-gray-800 rounded-lg bg-[#0a1612]">
        <button
          onClick={() => setAboutExpanded(!aboutExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#0d1f1a] transition-colors text-gray-200"
        >
          <span className="font-semibold">About</span>
          {aboutExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        
        {aboutExpanded && (
          <div className="px-4 pb-4 space-y-3 text-sm">
            {userDetails?.verification?.phone_verified && (
              <div className="flex items-center gap-2 text-teal-400">
                <Check className="w-4 h-4" />
                <span>Phone verified</span>
              </div>
            )}
            
            {userDetails?.verification?.id_verified && (
              <div className="flex items-center gap-2 text-teal-400">
                <Check className="w-4 h-4" />
                <span>ID verified</span>
              </div>
            )}

            <div>
              <div className="text-gray-400 mb-1">Speed</div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className="font-medium">5 min</span>
              </div>
            </div>

            <div>
              <div className="text-gray-400 mb-1">Last seen</div>
              <div className="flex items-center gap-2 text-gray-200">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Active now</span>
              </div>
            </div>

            <div>
              <div className="text-gray-400 mb-1">Name</div>
              <div className="text-gray-200">{userDetails?.full_name || "-"}</div>
            </div>

            <div>
              <div className="text-gray-400 mb-1">Detected location</div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className="text-lg">🇳🇬</span>
                <span>Nigeria</span>
              </div>
            </div>

            <div>
              <div className="text-gray-400 mb-1">IP location</div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className="text-lg">🇳🇬</span>
                <span>Nigeria</span>
              </div>
            </div>

            <div>
              <div className="text-gray-400 mb-1">Carrier info</div>
              <div className="text-xs text-gray-200">-</div>
            </div>
          </div>
        )}
      </div>

      {/* Trading Info Section */}
      <div className="border border-gray-800 rounded-lg bg-[#0a1612]">
        <button
          onClick={() => setTradingInfoExpanded(!tradingInfoExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#0d1f1a] transition-colors text-gray-200"
        >
          <span className="font-semibold">Trading Info</span>
          {tradingInfoExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        
        {tradingInfoExpanded && (
          <div className="px-4 pb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Joined</span>
              <span className="text-gray-200">{userDetails?.yearsJoined || 0} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Partners</span>
              <span className="text-gray-200">{userDetails?.partnersCount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Trades</span>
              <span className="text-gray-200">{userDetails?.tradesCount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">BTC traded</span>
              <span className="text-gray-200">1+ BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Trusted by</span>
              <span className="text-gray-200">{positiveRatings} people</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Blocked by</span>
              <span className="text-gray-200">0 people</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Has blocked</span>
              <span className="text-gray-200">0 people</span>
            </div>
          </div>
        )}
      </div>

      {/* Shared Files Section */}
      <div className="border border-gray-800 rounded-lg bg-[#0a1612]">
        <button
          onClick={() => setSharedFilesExpanded(!sharedFilesExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#0d1f1a] transition-colors text-gray-200"
        >
          <span className="font-semibold">Shared files</span>
          {sharedFilesExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        
        {sharedFilesExpanded && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-400">No shared files</p>
          </div>
        )}
      </div>
    </div>
  </DialogContent>
</Dialog>
```

);
}
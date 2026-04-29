import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ArrowLeft, User, Info, Clock, Circle } from "lucide-react";
import { useLocation } from "wouter";
import { UserInfoDialog } from "@/components/user-info-dialog";
import { useState } from "react";
import { formatLastSeen } from "@/lib/presence";

interface TradeHeaderProps {
  counterparty?: {
    username: string;
    avatar_url: string | null;
    positive_ratings: number;
    negative_ratings: number;
  };
  isUserBuyer: boolean;
  trade: {
    seller_id: string;
    buyer_id: string;
  };
  timer: number;
  isPaid: boolean;
  formatTime: (seconds: number) => string;
  formatTradeTime: () => string;
  onCounterpartyClick: () => void;
  counterpartyPresence?: { isOnline: boolean; lastSeen: string | null };
}

export function TradeHeader({
  counterparty,
  isUserBuyer,
  trade,
  timer,
  isPaid,
  formatTime,
  formatTradeTime,
  onCounterpartyClick,
  counterpartyPresence = { isOnline: false, lastSeen: null },
}: TradeHeaderProps) {
  const [, setLocation] = useLocation();
  const [showUserInfo, setShowUserInfo] = useState(false);

  return (
    <div className="bg-primary/10 border-b p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Avatar 
            className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onCounterpartyClick}
          >
            <AvatarImage src={counterparty?.avatar_url || undefined} alt={counterparty?.username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {counterparty?.username?.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-wrap">
            <span 
              className="font-semibold text-sm sm:text-base truncate cursor-pointer hover:underline"
              onClick={onCounterpartyClick}
            >
              {counterparty?.username}
            </span>
            <div className="flex items-center gap-1">
                <span className="text-lg">🇳🇬</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-muted"
                  onClick={() => setShowUserInfo(true)}
                >
                  <Info className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </div>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <button className="bg-green-500/20 text-green-600 border border-green-500/30 px-2 sm:px-4 py-1 rounded flex items-center gap-1 sm:gap-2 hover:bg-green-500/30 transition-colors text-xs sm:text-sm">
            <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">{counterparty?.positive_ratings || 0}</span>
          </button>
          <button className="bg-red-500/20 text-red-600 border border-red-500/30 px-2 sm:px-4 py-1 rounded flex items-center gap-1 sm:gap-2 hover:bg-red-500/30 transition-colors text-xs sm:text-sm">
            <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">{counterparty?.negative_ratings || 0}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                {counterpartyPresence.isOnline ? (
                  <>
                    <Circle className="h-2 w-2 fill-green-500" />
                    <span className="text-green-500">Active</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-2 w-2 fill-gray-500" />
                    <span className="text-gray-500">{formatLastSeen(counterpartyPresence.lastSeen)}</span>
                  </>
                )}
              </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{isPaid ? formatTradeTime() : formatTime(timer)}</span>
        </div>
      </div>
      <UserInfoDialog
        isOpen={showUserInfo}
        onClose={() => setShowUserInfo(false)}
        counterparty={counterparty}
      />
    </div>
  );
}
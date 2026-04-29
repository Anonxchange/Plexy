import { MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabNavigationProps {
  activeTab: "chat" | "actions";
  onTabChange: (tab: "chat" | "actions") => void;
  unreadCount?: number;
}

export function TabNavigation({ activeTab, onTabChange, unreadCount = 0 }: TabNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1.5 sm:p-2">
          <Button
            onClick={() => onTabChange('actions')}
            variant={activeTab === 'actions' ? 'default' : 'outline'}
            className="flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-12 text-xs sm:text-sm"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            Actions
          </Button>
          <Button
            onClick={() => onTabChange('chat')}
            variant={activeTab === 'chat' ? 'default' : 'outline'}
            className="flex items-center justify-center gap-1.5 sm:gap-2 h-10 sm:h-12 relative text-xs sm:text-sm"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Chat
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

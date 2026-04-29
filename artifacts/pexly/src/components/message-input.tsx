import { useState, useRef } from "react";
import { Send, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  newMessage: string;
  isSendingMessage: boolean;
  showQuickMessages: boolean;
  quickMessages: string[];
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFileSelect: (file: File) => void;
  onToggleQuickMessages: () => void;
  onQuickMessageSelect: (message: string) => void;
}

export function MessageInput({
  newMessage,
  isSendingMessage,
  showQuickMessages,
  quickMessages,
  onMessageChange,
  onSend,
  onKeyPress,
  onFileSelect,
  onToggleQuickMessages,
  onQuickMessageSelect,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      {showQuickMessages && (
        <div className="bg-secondary/50 rounded-lg p-2 space-y-1">
          {quickMessages.map((msg, idx) => (
            <button
              key={idx}
              onClick={() => onQuickMessageSelect(msg)}
              className="w-full text-left text-xs sm:text-sm p-2 rounded hover:bg-background transition-colors"
            >
              {msg}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          onClick={onToggleQuickMessages}
        >
          {showQuickMessages ? (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>
        <input
          type="text"
          placeholder="Write a message..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={onKeyPress}
          disabled={isSendingMessage}
          className="flex-1 bg-secondary rounded-lg px-3 sm:px-4 py-2 sm:py-3 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base min-w-0"
        />
        <Button 
          size="icon" 
          className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          onClick={onSend}
          disabled={isSendingMessage || !newMessage.trim()}
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
}

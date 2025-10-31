import { File, Download } from "lucide-react";

interface TradeMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_filename?: string | null;
  created_at: string;
}

interface ChatMessagesProps {
  messages: TradeMessage[];
  currentUserProfileId: string | null;
}

export function ChatMessages({ messages, currentUserProfileId }: ChatMessagesProps) {
  return (
    <div className="space-y-2 mb-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === currentUserProfileId;
        const hasAttachment = message.attachment_url && message.attachment_url.trim() !== '';

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                isOwnMessage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {hasAttachment && (
                <div className="mb-2">
                  {message.attachment_type === 'image' ? (
                    <div className="relative">
                      <img 
                        src={message.attachment_url || ''} 
                        alt={message.attachment_filename || 'Uploaded image'} 
                        className="rounded max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.attachment_url!, '_blank')}
                        onError={(e) => {
                          console.error('Image failed to load:', message.attachment_url);
                          e.currentTarget.style.display = 'none';
                        }}
                        loading="lazy"
                      />
                    </div>
                  ) : message.attachment_type === 'video' ? (
                    <video 
                      src={message.attachment_url || ''} 
                      controls 
                      className="rounded max-w-full h-auto"
                      onError={(e) => {
                        console.error('Video failed to load:', message.attachment_url);
                      }}
                    />
                  ) : (
                    <a 
                      href={message.attachment_url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-2 rounded border ${
                        isOwnMessage ? 'border-primary-foreground/30' : 'border-border'
                      } hover:opacity-80 transition-opacity`}
                    >
                      <File className="w-4 h-4" />
                      <span className="text-sm truncate">{message.attachment_filename || 'Download file'}</span>
                      <Download className="w-4 h-4 ml-auto" />
                    </a>
                  )}
                </div>
              )}
              {message.content && message.content.trim() !== '' && (
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              )}
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

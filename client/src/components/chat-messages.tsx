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
    <div className="space-y-3 mb-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === currentUserProfileId;
        const hasAttachment = message.attachment_url && message.attachment_url.trim() !== '';

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[80%]">
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
                      className={`flex items-center gap-2 p-3 rounded-lg hover:opacity-90 transition-all shadow-xs inline-flex ${
                        isOwnMessage 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-secondary border border-secondary-border'
                      }`}
                    >
                      <File className="w-5 h-5" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{message.attachment_filename || 'Download file'}</span>
                      <Download className="w-5 h-5 ml-2" />
                    </a>
                  )}
                </div>
              )}
              {message.content && message.content.trim() !== '' && (
                <div className={`
                  rounded-md px-4 py-2 text-sm whitespace-pre-wrap break-words
                  shadow-xs hover-elevate active-elevate-2 transition-all
                  ${isOwnMessage 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                  }
                `}>
                  {message.content}
                </div>
              )}
              <p className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                {isOwnMessage && (
                  <span className="text-xs">
                    {message.read_at ? '✓✓' : '✓'}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
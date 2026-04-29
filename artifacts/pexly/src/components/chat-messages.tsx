import { File, Download, XCircle } from "lucide-react";

interface TradeMessage {
  id: string;
  trade_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_filename?: string | null;
  created_at: string;
  read_at?: string | null;
}

interface ChatMessagesProps {
  messages: TradeMessage[];
  currentUserProfileId: string | null;
  trade?: any;
}

export function ChatMessages({ messages, currentUserProfileId, trade }: ChatMessagesProps) {
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
                  <span className={`text-sm font-bold ${message.read_at ? 'text-blue-500' : 'text-muted-foreground/60'}`}>
                    {message.read_at ? '✓✓' : '✓'}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}

      {trade && trade.status === "cancelled" && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3 mt-4">
          <div className="flex items-center justify-center mb-2">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-sm text-muted-foreground text-center font-semibold">
            TRADE CANCELLED
          </div>
          <p className="text-sm text-destructive leading-relaxed text-center">
            This trade was cancelled and {trade.crypto_symbol} funds have been released back to the seller's wallet.
          </p>
        </div>
      )}

      {trade && (trade.status === "completed" || trade.status === "released") && (
        <div className="bg-black/80 border border-green-500 rounded-lg p-4 space-y-3 mt-4">
          <div className="text-sm text-muted-foreground text-center">
            TRADE COMPLETED - {new Date(trade.completed_at || trade.created_at).toLocaleString().toUpperCase()}
          </div>
          <p className="text-sm text-green-500 leading-relaxed text-center">
            This trade has been successfully completed. The {trade.crypto_symbol} has been transferred to the buyer.
          </p>
        </div>
      )}
    </div>
  );
}
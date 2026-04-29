import { X, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelTradeModalProps {
  isOpen: boolean;
  cancelReason: string;
  confirmNotPaid: boolean;
  onClose: () => void;
  onReasonSelect: (reason: string) => void;
  onConfirmNotPaidToggle: () => void;
  onConfirmCancel: () => void;
}

export function CancelTradeModal({
  isOpen,
  cancelReason,
  confirmNotPaid,
  onClose,
  onReasonSelect,
  onConfirmNotPaidToggle,
  onConfirmCancel,
}: CancelTradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-card border rounded-lg p-4 sm:p-6 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-end">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="border-2 border-primary rounded-lg p-3 sm:p-4 text-xs sm:text-sm bg-primary/5 mb-4">
            Keep trades within {import.meta.env.VITE_APP_NAME || "NoOnes"}. Some users may ask you to trade outside the {import.meta.env.VITE_APP_NAME || "NoOnes"} platform. This is against our Terms of Service and likely a scam attempt. You must insist on keeping all trade conversations within {import.meta.env.VITE_APP_NAME || "NoOnes"}. If you choose to proceed outside {import.meta.env.VITE_APP_NAME || "NoOnes"}, note that we cannot help or support you if you are scammed during such trades.
          </div>

          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
            <button
              onClick={() => onReasonSelect("unresponsive")}
              className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
            >
              {cancelReason === "unresponsive" ? (
                <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-sm sm:text-base">Unresponsive user</div>
                <div className="text-xs sm:text-sm text-muted-foreground">The user did not respond to my message</div>
              </div>
            </button>

            <button
              onClick={() => onReasonSelect("asked_to_cancel")}
              className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
            >
              {cancelReason === "asked_to_cancel" ? (
                <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-sm sm:text-base">User asked me to cancel</div>
                <div className="text-xs sm:text-sm text-muted-foreground">The user requested cancellation without providing a specific reason</div>
              </div>
            </button>

            <button
              onClick={() => onReasonSelect("payment_not_accepted")}
              className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
            >
              {cancelReason === "payment_not_accepted" ? (
                <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-sm sm:text-base">Payment method not accepted</div>
                <div className="text-xs sm:text-sm text-muted-foreground">The user doesn't accept my payment method</div>
              </div>
            </button>

            <button
              onClick={() => onReasonSelect("other")}
              className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors"
            >
              {cancelReason === "other" ? (
                <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-sm sm:text-base">Other</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Different reason not listed above</div>
              </div>
            </button>
          </div>

          <button
            onClick={onConfirmNotPaidToggle}
            className="w-full text-left flex items-start gap-3 hover:bg-background/50 p-2 rounded transition-colors border"
          >
            {confirmNotPaid ? (
              <CheckSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-sm sm:text-base">I confirm I have not paid</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Required confirmation before cancelling
              </div>
            </div>
          </button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button
              onClick={onConfirmCancel}
              disabled={!cancelReason || !confirmNotPaid}
              variant="destructive"
              className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
            >
              Confirm Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

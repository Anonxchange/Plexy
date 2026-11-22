import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsivePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
}

export function ResponsivePickerModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidthClassName = "sm:max-w-[440px]",
}: ResponsivePickerModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          overlayClassName="z-[10000] bg-black/50 backdrop-blur-[2px]"
          className="z-[10000] flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-t-[20px] border-x-0 border-b-0 border-t border-[#e3ebe9] bg-white p-0 text-[#091e1c] shadow-[0_-18px_50px_rgba(9,30,28,0.18)]"
        >
          <div
            className="mx-auto mt-2.5 mb-1 h-1 w-10 shrink-0 rounded-full bg-[#dce3db]"
            aria-hidden="true"
          />
          <SheetHeader className="shrink-0 border-b border-[#eef2f1] px-5 pt-2 pb-3.5 pr-12 text-left">
            <SheetTitle className="text-[17px] font-bold leading-snug text-[#091e1c]">
              {title}
            </SheetTitle>
            <SheetDescription
              className={description ? "mt-0.5 text-[13px] text-[#52625f]" : "sr-only"}
            >
              {description || title}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-[#eef2f1] bg-white px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[10000] bg-black/45 backdrop-blur-[2px]"
        className={cn(
          "z-[10000] flex max-h-[85dvh] w-[calc(100%-32px)] flex-col gap-0 overflow-hidden rounded-2xl border border-[#e3ebe9] bg-white p-0 text-[#091e1c] shadow-[0_20px_60px_rgba(9,30,28,0.2)] sm:rounded-2xl",
          maxWidthClassName,
        )}
      >
        <DialogHeader className="shrink-0 border-b border-[#eef2f1] px-6 py-4 pr-12 text-left">
          <DialogTitle className="text-[17px] font-bold leading-snug text-[#091e1c]">
            {title}
          </DialogTitle>
          <DialogDescription
            className={description ? "mt-0.5 text-[13px] text-[#52625f]" : "sr-only"}
          >
            {description || title}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-[#eef2f1] bg-white px-6 py-4">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { safeStorage } from "@/lib/safe-storage";

type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const STORAGE_KEY = "pexly-cookie-consent-v2";
const OPEN_EVENT = "pexly:open-cookie-settings";

function readPreferences(): CookiePreferences | null {
  const raw = safeStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CookiePreferences>;
    if (
      value.necessary !== true ||
      typeof value.analytics !== "boolean" ||
      typeof value.marketing !== "boolean"
    ) return null;
    return {
      necessary: true,
      analytics: value.analytics,
      marketing: value.marketing,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const saved = readPreferences();
    setIsVisible(!saved);

    const openSettings = () => {
      const current = readPreferences();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setIsSettingsOpen(true);
    };
    window.addEventListener(OPEN_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_EVENT, openSettings);
  }, []);

  const save = (next: Pick<CookiePreferences, "analytics" | "marketing">) => {
    const value: CookiePreferences = {
      necessary: true,
      analytics: next.analytics,
      marketing: next.marketing,
      updatedAt: new Date().toISOString(),
    };
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setIsVisible(false);
    setIsSettingsOpen(false);
  };

  const acceptAll = () => save({ analytics: true, marketing: true });
  const rejectOptional = () => save({ analytics: false, marketing: false });

  if (typeof document === "undefined" || (!isVisible && !isSettingsOpen)) return null;

  return createPortal(
    <>
      {isVisible && (
        <section
          aria-label="Cookie preferences notice"
          className="fixed inset-x-0 bottom-0 z-[10000] border-t border-border bg-background/95 shadow-[0_-12px_40px_rgba(0,0,0,0.16)] backdrop-blur"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Your privacy matters</p>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Pexly uses essential browser storage for sign-in, wallet security and shopping features.
                Optional analytics and marketing storage stays off unless you choose to enable it.
                For privacy questions, visit <a href="/support" className="font-medium text-foreground underline underline-offset-4">Pexly Support</a>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={rejectOptional}>Reject optional</Button>
              <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>Customize</Button>
              <Button onClick={acceptAll}>Accept all</Button>
            </div>
          </div>
        </section>
      )}

      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsSettingsOpen(false);
          }}
        >
          <section
            aria-labelledby="cookie-settings-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-6"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="cookie-settings-title" className="text-lg font-semibold text-foreground">Cookie preferences</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose which optional storage categories you allow. You can change these choices at any time.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close cookie preferences"
                className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted"
                onClick={() => setIsSettingsOpen(false)}
              >✕</button>
            </div>

            <div className="mt-5 divide-y divide-border">
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Essential</p>
                  <p className="text-xs text-muted-foreground">Required for core security, sign-in and shopping functionality.</p>
                </div>
                <input aria-label="Essential storage always enabled" type="checkbox" checked disabled className="h-4 w-4 accent-primary" />
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
                <span>
                  <span className="block text-sm font-medium text-foreground">Analytics</span>
                  <span className="block text-xs text-muted-foreground">Helps us understand how the site is used.</span>
                </span>
                <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-4 w-4 accent-primary" />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
                <span>
                  <span className="block text-sm font-medium text-foreground">Marketing</span>
                  <span className="block text-xs text-muted-foreground">Allows marketing measurement and personalization.</span>
                </span>
                <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} className="h-4 w-4 accent-primary" />
              </label>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              Optional categories are preference settings only; any future analytics or advertising integrations must check these choices before running.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={rejectOptional}>Reject optional</Button>
              <Button onClick={() => save({ analytics, marketing })}>Save my choices</Button>
            </div>
          </section>
        </div>
      )}
    </>,
    document.body,
  );
}

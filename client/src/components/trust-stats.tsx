import securityLock from "@/assets/svg-image-1 2.svg";
import cloudBackup from "@/assets/svg-image-1 20.svg";
import privacyShield from "@/assets/safety (1).svg";
import alertHorn from "@/assets/svg-image-1 4.svg";
import trueOwnership from "@/assets/svg-image-1 2.svg";
import { Star } from "lucide-react";

export const TrustStats = () => {
  return (
    <section
      id="features"
      className="py-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Zero personal tracking
          </h2>
          <p className="text-primary-foreground/90 text-xl md:text-2xl max-w-3xl mx-auto">
            Pexly lets you trade directly with other users while keeping full control of your funds we never hold your money. Trades happen wallet-to-wallet, so your assets stay private.    </p>
        </div>

        {/* HERO CARD */}
        <div className="bg-white rounded-[40px] p-8 md:p-12 max-w-6xl mx-auto shadow-sm mb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT CONTENT */}
            <div className="flex flex-col text-center lg:text-left">
              {/* Heading */}
              <h3 className="text-3xl md:text-4xl font-bold text-black mb-6 order-1">
                True ownership of your crypto assets
              </h3>

              {/* IMAGE (mobile comes here, desktop hidden) */}
              <div className="order-2 lg:order-none mb-8 lg:mb-0 lg:hidden">
                <img
                  src={trueOwnership}
                  alt="True ownership of crypto assets"
                  className="w-full max-w-sm lg:max-w-none mx-auto lg:mx-0 object-contain"
                />
              </div>

              {/* Text */}
              <p className="text-black/70 text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 order-3">
                We secure your wallet, but don't control or have access to your private keys or secret phrase only you do.
              </p>

              {/* Button */}
              <button className="px-10 py-4 bg-primary text-white rounded-full font-bold text-lg order-4">
                Get Started
              </button>
            </div>

            {/* DESKTOP IMAGE COLUMN (UNCHANGED) */}
            <div className="hidden lg:flex justify-center lg:justify-end">
              <img
                src={trueOwnership}
                alt="True ownership"
                className="w-full max-w-2xl object-contain"
              />
            </div>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm text-center">
            <h3 className="text-2xl font-bold text-black mb-6">
              Added security with encryption
            </h3>
            <img src={cloudBackup} className="w-40 h-40 mx-auto mb-6 object-contain" />
            <p className="text-black/70 text-lg">
              Use our Encrypted Cloud Backup for increased wallet security.
            </p>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-sm text-center">
            <h3 className="text-2xl font-bold text-black mb-6">
              Zero personal tracking
            </h3>
            <img src={privacyShield} className="w-48 h-48 mx-auto mb-2 object-contain scale-110" />
            <p className="text-black/70 text-lg">
              We don't track any personal information, including IP or balances.
            </p>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-sm text-center">
            <h3 className="text-2xl font-bold text-black mb-6">
              Proactive alerts
            </h3>
            <img src={alertHorn} className="w-40 h-40 mx-auto mb-6 object-contain" />
            <p className="text-black/70 text-lg">
              Stay safe with alerts for risky address and dApp connections.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

import securityLock from "@/assets/IMG_3386.png";
import cloudBackup from "@/assets/IMG_3373.jpeg";
import privacyShield from "@/assets/IMG_3374.jpeg";
import alertHorn from "@/assets/IMG_3375.jpeg";
import trueOwnership from "@/assets/IMG_3386.png";
import avatar1 from "@/assets/IMG_3383.jpeg";
import avatar2 from "@/assets/IMG_3384.jpeg";
import avatar3 from "@/assets/IMG_3382.jpeg";
import avatar4 from "@/assets/IMG_3385.png";
import awardLogo from "@/assets/IMG_3385.png";
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
            We secure your wallet, but don't control or have access to your private keys or secret phrase — only you do.
          </p>
        </div>

        {/* HERO CARD */}
        <div className="bg-white rounded-[40px] p-8 md:p-12 max-w-6xl mx-auto shadow-sm mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h3 className="text-3xl md:text-4xl font-bold text-black mb-6">
                True ownership of your crypto assets
              </h3>
              <p className="text-black/70 text-lg md:text-xl mb-8 max-w-xl">
                We secure your wallet, but don't control or have access to your private keys or secret phrase — only you do.
              </p>
              <button className="px-10 py-4 bg-primary text-white rounded-full font-bold text-lg">
                Get Started
              </button>
            </div>

            <div className="flex justify-center lg:justify-end">
              <img
                src={trueOwnership}
                alt="True ownership"
                className="w-full max-w-2xl object-contain"
              />
            </div>
          </div>
        </div>

        {/* FEATURE CARDS – HORIZONTAL ON DESKTOP */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
          {/* Card 1 */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm text-center">
            <h3 className="text-2xl font-bold text-black mb-6">
              Added security with encryption
            </h3>
            <img
              src={cloudBackup}
              alt=""
              className="w-40 h-40 mx-auto mb-6 object-contain"
            />
            <p className="text-black/70 text-lg">
              Use our Encrypted Cloud Backup for increased wallet security.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm text-center">
            <h3 className="text-2xl font-bold text-black mb-6">
              Zero personal tracking
            </h3>
            <img
              src={privacyShield}
              alt=""
              className="w-40 h-40 mx-auto mb-6 object-contain"
            />
            <p className="text-black/70 text-lg">
              We don't track any personal information, including IP or balances.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm text-center">
            <h3 className="text-2xl font-bold text-black mb-6">
              Proactive alerts
            </h3>
            <img
              src={alertHorn}
              alt=""
              className="w-40 h-40 mx-auto mb-6 object-contain"
            />
            <p className="text-black/70 text-lg">
              Stay safe with alerts for risky address and dApp connections.
            </p>
          </div>
        </div>

        {/* TRUSTED SECTION */}
        <div className="text-center space-y-8 pt-12 border-t border-primary-foreground/10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Trusted by over 35k traders
          </h2>

          <div className="flex justify-center -space-x-4">
            {[avatar1, avatar2, avatar3, avatar4].map((a, i) => (
              <div key={i} className="w-16 h-16 rounded-full border-4 border-primary overflow-hidden">
                <img src={a} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-2 text-2xl font-bold">
            <span>4.9</span>
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
            </div>
          </div>

          <img src={awardLogo} className="w-48 h-48 mx-auto object-contain" />
        </div>
      </div>
    </section>
  );
};
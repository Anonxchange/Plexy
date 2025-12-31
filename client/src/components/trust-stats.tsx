import securityLock from "@/assets/IMG_3386.png";
import cloudBackup from "@/assets/IMG_3373.png";
import privacyShield from "@/assets/IMG_3374.png";
import alertHorn from "@/assets/IMG_3374.png";
import trueOwnership from "@/assets/IMG_3382.png";
import avatar1 from "@/assets/IMG_3383.jpg";
import avatar2 from "@/assets/IMG_3384.jpg";
import avatar3 from "@/assets/IMG_3385.jpg";
import avatar4 from "@/assets/IMG_3385.jpg";
import awardLogo from "@/assets/IMG_3385.jpg";
import { Star } from "lucide-react";

export const TrustStats = () => {
  return (
    <section id="features" className="py-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-primary-foreground">
            Zero personal tracking
          </h2>
          <p className="text-primary-foreground/90 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            We secure your wallet, but don't control or have access to your private keys or secret phrase - only you do.
          </p>
        </div>

        <div className="space-y-8">
          {/* Card 1 */}
          <div className="bg-white rounded-[40px] p-8 md:p-12 max-w-4xl mx-auto shadow-sm">
            <h3 className="text-3xl md:text-4xl font-bold text-black mb-6">
              True ownership of your crypto assets
            </h3>
            <div className="flex justify-center mb-10">
              <img
                src={trueOwnership}
                alt="True ownership of crypto assets"
                className="w-full h-auto max-w-2xl object-contain rounded-2xl"
              />
            </div>
            <p className="text-black/70 text-lg md:text-xl mb-8 max-w-2xl">
              We secure your wallet, but don't control or have access to your private keys or secret phrase - only you do.
            </p>
            <button className="px-10 py-4 bg-primary text-white rounded-full font-bold text-lg hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[40px] p-8 md:p-12 max-w-4xl mx-auto shadow-sm">
            <h3 className="text-3xl md:text-4xl font-bold text-black mb-8">
              Added security with encryption
            </h3>
            <div className="flex justify-center mb-10">
              <img
                src={cloudBackup}
                alt="Encrypted cloud backup for wallet security"
                className="w-64 h-64 md:w-80 md:h-80 object-contain"
              />
            </div>
            <p className="text-black/70 text-lg md:text-xl">
              Use our Encrypted Cloud Backup for increased wallet security.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[40px] p-8 md:p-12 max-w-4xl mx-auto shadow-sm">
            <h3 className="text-3xl md:text-4xl font-bold text-black mb-8">
              Zero personal tracking
            </h3>
            <div className="flex justify-center mb-10">
              <img
                src={privacyShield}
                alt="Privacy shield protecting your personal information"
                className="w-64 h-64 md:w-80 md:h-80 object-contain"
              />
            </div>
            <p className="text-black/70 text-lg md:text-xl">
              We don't track any personal information, including your IP address or balances.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-[40px] p-8 md:p-12 max-w-4xl mx-auto shadow-sm">
            <h3 className="text-3xl md:text-4xl font-bold text-black mb-8">
              Proactive alerts for risky transactions
            </h3>
            <div className="flex justify-center mb-10">
              <img
                src={alertHorn}
                alt="Alert system for risky transactions and connections"
                className="w-64 h-64 md:w-80 md:h-80 object-contain"
              />
            </div>
            <p className="text-black/70 text-lg md:text-xl">
              Stay safe with alerts for risky address and dApp connections.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center mb-20">
          <button className="px-6 py-2.5 border border-black text-black rounded-full font-medium text-sm hover:bg-black hover:text-white transition-all duration-300">
            Learn more about privacy & security
          </button>
        </div>

        {/* New Trusted Section from Image */}
        <div className="text-center space-y-8 pt-12 border-t border-primary-foreground/10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">Trusted by over 35k traders</h2>
          
          <div className="flex justify-center -space-x-4">
            {[avatar1, avatar2, avatar3, avatar4].map((avatar, i) => (
              <div key={i} className="w-16 h-16 rounded-full border-4 border-primary overflow-hidden">
                <img src={avatar} alt={`Trader ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-2xl font-bold">
            <span>4.9</span>
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center py-8">
            <img src={awardLogo} alt="Densa Awards for Excellence" className="w-48 h-48 object-contain" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4">
            {/* Testimonial 1 */}
            <div className="bg-[#FFD700] text-black p-6 rounded-[32px] text-left relative overflow-hidden shadow-md min-h-[200px] flex flex-col">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <img src={avatar1} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold text-lg leading-none">Charles O.</div>
                    <div className="text-xs opacity-40 font-medium mt-1">Twitter</div>
                  </div>
                </div>
                <p className="text-[15px] leading-snug font-medium text-black/80">
                  Before Pexly, selling gift cards was stressful — bad rates and slow vendors. 
                  Now I get payouts in minutes. No delays, no chasing anyone. It just works.
                </p>
              </div>
              {/* Large organic blob */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-[#F5F5F5] text-black p-6 rounded-[32px] text-left relative overflow-hidden shadow-md min-h-[200px] flex flex-col">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <img src={avatar2} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold text-lg leading-none">Tunde A.</div>
                    <div className="text-xs opacity-40 font-medium mt-1">App Store</div>
                  </div>
                </div>
                <p className="text-[15px] leading-snug font-medium text-black/80">
                  I trade crypto often, so speed matters. Pexly pays fast every time—no stress, no drama. 
                  Fair live rates and no fake vendors to worry about.
                </p>
              </div>
              {/* Large organic blob */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/40 rounded-full -mr-12 -mt-12 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gray-200/50 rounded-full -ml-20 -mb-20"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

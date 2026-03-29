import cloudBackup from "@/assets/svg-image-1 20.svg";
import privacyShield from "@/assets/safety (1).svg";
import alertHorn from "@/assets/svg-image-1 4.svg";
import trueOwnership from "@/assets/svg-image-1 2.svg";
import { Check } from "lucide-react";

const features = [
  {
    title: "Added security with encryption",
    description: "Use our Encrypted Cloud Backup for increased wallet security.",
    icon: cloudBackup,
    alt: "Encrypted cloud backup icon",
    imgClass: "w-40 h-40 mx-auto mb-6 object-contain",
  },
  {
    title: "Zero personal tracking",
    description: "We don't track any personal information, including IP or balances.",
    icon: privacyShield,
    alt: "Privacy shield icon",
    imgClass: "w-52 h-52 mx-auto mb-2 object-contain scale-110",
  },
  {
    title: "Proactive alerts",
    description: "Stay safe with alerts for risky address and dApp connections.",
    icon: alertHorn,
    alt: "Proactive alerts icon",
    imgClass: "w-40 h-40 mx-auto mb-6 object-contain",
  },
];

export const TrustStats = () => {
  return (
    <section
      id="features"
      className="py-20 bg-primary text-primary-foreground relative overflow-hidden rounded-3xl -mt-10 z-10"
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Centre glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Zero personal tracking
          </h2>
          <p className="text-primary-foreground/90 text-xl md:text-2xl max-w-3xl mx-auto">
            Pexly gives you full control of your crypto. Non-custodial by design we never hold your funds. Every transaction is executed on-chain, keeping your assets secure and private.
          </p>
        </div>

        {/* HERO CARD */}
        <div
          className="bg-[#fcfcfc] dark:bg-card rounded-[24px] p-8 md:p-12 max-w-6xl mx-auto mb-14"
          style={{
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "2px solid rgba(255,255,255,0.80)",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(255,255,255,0.4), 0 16px 48px rgba(0,0,0,0.18)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col text-center lg:text-left">
              <h3 className="text-3xl md:text-4xl font-bold text-black dark:text-card-foreground mb-6 order-1">
                True ownership of your crypto assets
              </h3>
              <div className="order-2 lg:order-none mb-8 lg:mb-0 lg:hidden">
                <img
                  src={trueOwnership}
                  alt="True ownership of crypto assets"
                  width={384}
                  height={384}
                  loading="lazy"
                  decoding="async"
                  className="w-full max-w-sm lg:max-w-none mx-auto lg:mx-0 object-contain"
                />
              </div>
              <p className="text-black/70 dark:text-muted-foreground text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 order-3">
                We secure your wallet, but don't control or have access to your private keys or secret phrase only you do.
              </p>
              <button className="px-10 py-4 bg-primary text-black rounded-full font-bold text-lg order-4">
                Get Started
              </button>
            </div>
            <div className="hidden lg:flex justify-center lg:justify-end">
              <img
                src={trueOwnership}
                alt="True ownership"
                width={672}
                height={400}
                loading="lazy"
                decoding="async"
                className="w-full max-w-2xl object-contain"
              />
            </div>
          </div>
        </div>

        {/* FEATURE CARDS — white bg, text in glass pill */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {features.map((item, i) => (
            <div
              key={i}
              className="bg-[#fcfcfc] dark:bg-card rounded-[20px] p-8 text-center"
              style={{
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "2px solid rgba(255,255,255,0.80)",
                boxShadow: "inset 0 2px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(255,255,255,0.4), 0 16px 48px rgba(0,0,0,0.18)",
              }}
            >
              <h3 className="text-2xl font-bold text-black dark:text-card-foreground mb-6">
                {item.title}
              </h3>

              <img
                src={item.icon}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className={item.imgClass}
              />

              {/* Glass pill — description only */}
              <div
                className="flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
                style={{
                  background: "rgba(0,0,0,0.08)",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                  border: "1.5px solid rgba(0,0,0,0.10)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width: 36,
                    height: 36,
                    background: "#B4F22E",
                    boxShadow: "0 2px 10px rgba(180,242,46,0.5)",
                  }}
                >
                  <Check strokeWidth={3.5} className="text-black" style={{ width: 18, height: 18 }} />
                </div>
                <p className="text-black/70 dark:text-muted-foreground text-base">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

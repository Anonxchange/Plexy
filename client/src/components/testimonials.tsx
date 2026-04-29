import { useTranslation } from "react-i18next";

const testimonialMeta = [
  { handle: "@torres_k",  name: "Karim Torres",  bg: "#C8F135", textColor: "#000000", rotate: "-6deg", avatarBg: "#000000", avatarText: "#C8F135", contentKey: "testimonials.t1_content" },
  { handle: "@amara.fx",  name: "Amara Diallo",  bg: "#7B5CF0", textColor: "#ffffff", rotate: "2deg",  avatarBg: "#ffffff", avatarText: "#7B5CF0", contentKey: "testimonials.t2_content" },
  { handle: "@lucaswei",  name: "Lucas Wei",     bg: "#E8E8E8", textColor: "#111111", rotate: "-2deg", avatarBg: "#cccccc", avatarText: "#111111", contentKey: "testimonials.t3_content" },
  { handle: "@sofia.mkv", name: "Sofia Markov",  bg: "#F5A623", textColor: "#000000", rotate: "5deg",  avatarBg: "#000000", avatarText: "#F5A623", contentKey: "testimonials.t4_content" },
];

function TestimonialCard({
  handle,
  name,
  content,
  bg,
  textColor,
  rotate,
  avatarBg,
  avatarText,
  index,
}: {
  handle: string;
  name: string;
  content: string;
  bg: string;
  textColor: string;
  rotate: string;
  avatarBg: string;
  avatarText: string;
  index: number;
}) {
  return (
    <div
      className={`relative flex-shrink-0 w-72 md:w-80 rounded-3xl p-8 flex flex-col justify-between gap-8 shadow-xl cursor-pointer
        transition-all duration-300 ease-out
        hover:scale-105 hover:z-50 hover:shadow-2xl
        ${index !== 0 ? "md:-ml-14" : ""}`}
      style={{
        backgroundColor: bg,
        color: textColor,
        transform: `rotate(${rotate})`,
        minHeight: "280px",
        zIndex: index,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "rotate(0deg) scale(1.05)";
        (e.currentTarget as HTMLDivElement).style.zIndex = "50";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rotate}) scale(1)`;
        (e.currentTarget as HTMLDivElement).style.zIndex = String(index);
      }}
    >
      <p className="text-lg font-medium leading-snug">{content}</p>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ backgroundColor: avatarBg, color: avatarText }}
        >
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight">{name}</p>
          <p className="text-xs leading-tight opacity-70">{handle}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const { t } = useTranslation();
  return (
    <section className="py-12 bg-background overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 text-center mb-10">
        <div className="inline-flex items-center border border-foreground/20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase mb-6 text-foreground">
          {t('testimonials.section_label')}
        </div>
        <h2 className="text-5xl md:text-7xl font-normal font-serif text-foreground leading-tight">
          {t('testimonials.title_l1')}<br className="hidden md:block" /> {t('testimonials.title_l2')}
        </h2>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center px-8 md:px-16 gap-6 md:gap-0">
        {testimonialMeta.map((m, i) => (
          <TestimonialCard
            key={i}
            handle={m.handle}
            name={m.name}
            content={t(m.contentKey)}
            bg={m.bg}
            textColor={m.textColor}
            rotate={m.rotate}
            avatarBg={m.avatarBg}
            avatarText={m.avatarText}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

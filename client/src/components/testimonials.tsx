import { useTranslation } from "react-i18next";

// NOTE: Tailwind only generates classes it can find as complete strings,
// so every class below is written out in full (no string building).
const testimonialMeta = [
  { handle: "@torres_k",  name: "Karim Torres", cardClass: "bg-[#C8F135] text-black rotate-[-6deg] z-0",   avatarClass: "bg-black text-[#C8F135]",   contentKey: "testimonials.t1_content" },
  { handle: "@amara.fx",  name: "Amara Diallo", cardClass: "bg-[#7B5CF0] text-white rotate-[2deg] z-10",   avatarClass: "bg-white text-[#7B5CF0]",   contentKey: "testimonials.t2_content" },
  { handle: "@lucaswei",  name: "Lucas Wei",    cardClass: "bg-[#E8E8E8] text-[#111111] rotate-[-2deg] z-20", avatarClass: "bg-[#cccccc] text-[#111111]", contentKey: "testimonials.t3_content" },
  { handle: "@sofia.mkv", name: "Sofia Markov", cardClass: "bg-[#F5A623] text-black rotate-[5deg] z-30",   avatarClass: "bg-black text-[#F5A623]",   contentKey: "testimonials.t4_content" },
];

function TestimonialCard({
  handle,
  name,
  content,
  cardClass,
  avatarClass,
  index,
}: {
  handle: string;
  name: string;
  content: string;
  cardClass: string;
  avatarClass: string;
  index: number;
}) {
  return (
    <div
      className={`relative flex-shrink-0 w-72 md:w-80 min-h-[280px] rounded-3xl p-8 flex flex-col justify-between gap-8 shadow-xl cursor-pointer
        transition-all duration-300 ease-out
        hover:rotate-0 hover:scale-105 hover:z-50 hover:shadow-2xl
        ${cardClass}
        ${index !== 0 ? "md:-ml-14" : ""}`}
    >
      <p className="text-lg font-medium leading-snug">{content}</p>
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${avatarClass}`}
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
            cardClass={m.cardClass}
            avatarClass={m.avatarClass}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

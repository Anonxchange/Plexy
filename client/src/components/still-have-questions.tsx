import { useTranslation } from "react-i18next";

export function StillHaveQuestions() {
  const { t } = useTranslation();
  const questions = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
  ];

  return (
    <section className="py-12 pb-20 bg-background border-t border-border">
      <div className="max-w-[88rem] mx-auto px-4 lg:px-6">
        <h2 className="text-5xl md:text-7xl font-normal text-foreground text-center mb-8">
          {t('faq.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {questions.map((q, i) => (
            <div key={i} className="flex flex-col gap-3 text-center md:text-left items-center md:items-start">
              <p className="text-lg font-bold text-foreground leading-snug">{q.question}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{q.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

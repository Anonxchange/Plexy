const questions = [
  {
    question: "\"Is my crypto actually safe?\"",
    answer:
      "Always. Pexly is fully non-custodial — your private keys never leave your device. We can't access, freeze, or move your funds. Ever.",
  },
  {
    question: "\"Do I really own my keys?\"",
    answer:
      "Yes, 100%. Your seed phrase is generated and stored locally on your device only. No server holds a copy. Self-custody is the default, not an add-on.",
  },
  {
    question: "\"What are the real fees?\"",
    answer:
      "No hidden charges. No monthly fees. You only pay standard network fees for on-chain transactions. What you see is exactly what you pay — nothing more.",
  },
];

export function StillHaveQuestions() {
  return (
    <section className="py-12 pb-20 bg-background border-t border-border">
      <div className="max-w-[88rem] mx-auto px-4 lg:px-6">
        <h2 className="text-5xl md:text-7xl font-normal text-foreground text-center mb-8">
          Still have questions?
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

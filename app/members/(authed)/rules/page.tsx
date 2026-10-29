import { RULES, type RuleArticle } from '@/lib/content/rules'

/** 회칙 전문. 정적 콘텐츠라 DB를 읽지 않고, 접근 제한은 포털 레이아웃이 맡는다. */
export default function RulesPage() {
  return (
    <div className="max-w-[68ch]">
      <p
        translate="no"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-fg-primary"
      >
        MEMBERS · RULES
      </p>
      <h1 className="mt-2 font-display text-3xl text-fg-primary">{RULES.title}</h1>
      <p className="mt-3 font-display text-sm leading-relaxed text-fg-muted">
        {RULES.effective}
        <br />
        {RULES.author}
      </p>

      {RULES.chapters.map((ch) => (
        <section key={ch.title} className="mt-10">
          <h2 className="border-b border-border pb-2 font-display text-lg text-accent-text">
            {ch.title}
          </h2>
          <div className="mt-4 space-y-4">
            {ch.articles.map((a) => (
              <Article key={a.no} article={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Article({ article: a }: { article: RuleArticle }) {
  return (
    <div className="font-display text-sm leading-relaxed text-fg-subtle">
      <p>
        <span className="mr-1.5 text-fg-primary">
          제{a.no}조 ({a.title})
        </span>
        {a.body}
      </p>
      {a.items && (
        <ol className="mt-1.5 list-decimal space-y-1 pl-6 marker:text-accent-text">
          {a.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
    </div>
  )
}

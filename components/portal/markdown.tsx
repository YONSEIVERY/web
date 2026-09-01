import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * 포털 본문 렌더러. 노션에서 이식한 아카이브(표·리스트 다수)까지 감당해야
 * 해서 GFM(표·체크박스)을 켠다. 링크는 새 탭.
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="portal-markdown font-display text-sm leading-[1.9] text-fg-subtle md:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h2
              className="mt-10 mb-4 font-display text-xl font-bold tracking-tight text-fg-primary md:text-2xl"
              {...props}
            />
          ),
          h2: (props) => (
            <h3
              className="mt-8 mb-3 font-display text-lg font-bold tracking-tight text-fg-primary md:text-xl"
              {...props}
            />
          ),
          h3: (props) => (
            <h4
              className="mt-6 mb-2 font-display text-base font-bold text-fg-primary md:text-lg"
              {...props}
            />
          ),
          p: (props) => <p className="my-3" {...props} />,
          ul: (props) => (
            <ul className="my-3 list-disc space-y-1 pl-5" {...props} />
          ),
          ol: (props) => (
            <ol className="my-3 list-decimal space-y-1 pl-5" {...props} />
          ),
          blockquote: (props) => (
            <blockquote
              className="my-4 border-l-2 border-fg-muted pl-4 text-fg-muted"
              {...props}
            />
          ),
          hr: () => <hr className="my-8 border-border" />,
          a: (props) => (
            <a
              className="underline decoration-fg-muted underline-offset-4 hover:text-fg-primary"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          strong: (props) => (
            <strong className="font-bold text-fg-primary" {...props} />
          ),
          code: (props) => (
            <code
              className="border border-border bg-bg-base px-1.5 py-0.5 font-mono text-[0.85em]"
              {...props}
            />
          ),
          // 펜스 코드 블록도 위 code 오버라이드를 타므로, 블록 안에서는 인라인
          // 칩 스타일(테두리·패딩)을 되돌리고 가로 스크롤은 pre가 받는다.
          pre: (props) => (
            <pre
              className="my-4 overflow-x-auto border border-border p-4 font-mono text-xs [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[1em]"
              {...props}
            />
          ),
          table: (props) => (
            <div className="my-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: (props) => (
            <th
              className="border border-border bg-bg-base px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted"
              {...props}
            />
          ),
          td: (props) => (
            <td
              className="border border-border px-3 py-2 align-top"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

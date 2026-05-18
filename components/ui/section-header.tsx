import { cn } from '@/lib/utils/cn'

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <header
      className={cn(
        'mb-12 flex flex-col gap-4 md:mb-16',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-2)]">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">{title}</h2>
      {subtitle ? <p className="max-w-2xl text-[var(--color-fg-subtle)]">{subtitle}</p> : null}
    </header>
  )
}

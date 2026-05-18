import { cn } from '@/lib/utils/cn'

export function Divider({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      className={cn('flex items-center gap-3', className)}
    >
      <div className="h-px flex-1 bg-[var(--color-border)]" />
      {label ? (
        <span className="font-mono text-xs tracking-widest text-[var(--color-fg-muted)] uppercase">
          {label}
        </span>
      ) : null}
      {label ? <div className="h-px flex-1 bg-[var(--color-border)]" /> : null}
    </div>
  )
}

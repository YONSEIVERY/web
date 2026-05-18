import { cn } from '@/lib/utils/cn'

export function GlowBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 -z-10',
        'bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_transparent_55%)]',
        'opacity-50',
        className,
      )}
    />
  )
}

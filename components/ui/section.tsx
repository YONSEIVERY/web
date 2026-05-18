import { cn } from '@/lib/utils/cn'

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('relative px-6 py-24 sm:px-8 md:py-32', className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  )
}

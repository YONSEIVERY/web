import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'ghost' | 'link'

type Common = { variant?: Variant; className?: string; children: React.ReactNode }
type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
type AnchorProps = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href: string }

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-2)] transition-colors',
  ghost:
    'border border-[var(--color-border-strong)] text-white hover:bg-white/5 transition-colors',
  link: 'text-white underline underline-offset-4 decoration-[var(--color-accent)] hover:decoration-[var(--color-accent-2)]',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-tight'

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | AnchorProps>(
  function Button(props, ref) {
    const { variant = 'primary', className, children, as, ...rest } = props
    if (as === 'a') {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cn(base, styles[variant], className)}
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      )
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(base, styles[variant], className)}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    )
  },
)

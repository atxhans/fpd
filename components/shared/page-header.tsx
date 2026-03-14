import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  variant?: 'default' | 'yellow'
}

export function PageHeader({ title, subtitle, actions, className, variant = 'yellow' }: PageHeaderProps) {
  if (variant === 'yellow') {
    return (
      <div className={cn(
        'bg-gradient-to-r from-primary via-primary to-accent p-6 rounded-lg shadow-md border-2 border-black',
        className
      )}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black">{title}</h1>
            {subtitle && <p className="text-black/80 font-medium mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

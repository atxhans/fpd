import { cn } from '@/lib/utils'

interface FieldpieceLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  variant?: 'default' | 'light'
  className?: string
}

const sizes = {
  sm: { container: 'h-8',  text: 'text-sm',  tagline: 'text-[10px]' },
  md: { container: 'h-10', text: 'text-base', tagline: 'text-xs' },
  lg: { container: 'h-14', text: 'text-xl',   tagline: 'text-sm' },
}

export function FieldpieceLogo({
  size = 'md',
  showTagline = true,
  variant = 'default',
  className,
}: FieldpieceLogoProps) {
  const s = sizes[size]
  const textColor = variant === 'light' ? 'text-white' : 'text-black'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Icon — Yellow & Black industrial mark */}
      <div className={cn(s.container, 'aspect-square flex items-center justify-center bg-black rounded-md relative overflow-hidden')}>
        <div className="absolute inset-0 bg-[#FFD100] transform -rotate-45 translate-x-1/4" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3/5 h-3/5" fill="none">
            <path d="M8 6h8v3h-5v3h4v3h-4v5H8V6z" fill="#FFD100" stroke="#000000" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col justify-center leading-tight">
        <span className={cn('font-bold tracking-tight', s.text, textColor)}>
          FIELDPIECE
        </span>
        {showTagline && (
          <span className={cn(s.tagline, 'text-[#FFD100] font-semibold tracking-widest uppercase')}>
            Digital
          </span>
        )}
      </div>
    </div>
  )
}

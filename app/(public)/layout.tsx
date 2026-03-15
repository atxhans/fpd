import { FieldpieceLogo } from '@/components/layout/fieldpiece-logo'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-black px-6 py-4">
        <FieldpieceLogo size="md" showTagline />
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        Fieldpiece Digital — HVAC Intelligence Platform
      </footer>
    </div>
  )
}

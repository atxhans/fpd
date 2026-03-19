export function HealthBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>
  const { label, cls } =
    score >= 85 ? { label: 'Excellent', cls: 'bg-green-100 text-green-800' } :
    score >= 70 ? { label: 'Good',      cls: 'bg-lime-100 text-lime-800' } :
    score >= 50 ? { label: 'Fair',      cls: 'bg-yellow-100 text-yellow-800' } :
    score >= 30 ? { label: 'Poor',      cls: 'bg-orange-100 text-orange-800' } :
                  { label: 'Critical',  cls: 'bg-red-100 text-red-800' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <span className="tabular-nums">{score}</span>
      <span className="font-normal opacity-75">{label}</span>
    </span>
  )
}

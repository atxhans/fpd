export type ReadingGridItem = {
  id?: string
  label: string
  unit: string
  value: number | null
  bool_value?: boolean | null
  is_flagged: boolean
  normal_min: number | null
  normal_max: number | null
  captured_at?: string
}

export function ReadingsGrid({ readings }: { readings: ReadingGridItem[] }) {
  if (readings.length === 0) {
    return <p className="text-sm text-muted-foreground">No readings recorded.</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {readings.map((r, i) => {
        const isLow  = r.value != null && r.normal_min != null && r.value < r.normal_min
        const isHigh = r.value != null && r.normal_max != null && r.value > r.normal_max
        const borderClass = r.is_flagged || isHigh
          ? 'border-red-300 bg-red-50/40'
          : isLow
          ? 'border-blue-300 bg-blue-50/40'
          : 'border-border'

        return (
          <div key={r.id ?? i} className={`p-3 border rounded-lg ${borderClass}`}>
            <p className="text-xs text-muted-foreground">{r.label}</p>
            {r.unit === 'bool' ? (
              <p className="text-xl font-bold">{r.bool_value ? 'Yes' : 'No'}</p>
            ) : (
              <p className="text-xl font-bold">
                {r.value != null ? r.value : '—'}
                {r.unit && r.unit !== 'bool' && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">{r.unit}</span>
                )}
              </p>
            )}
            {r.normal_min != null && r.normal_max != null && (
              <p className="text-xs text-muted-foreground">
                Normal: {r.normal_min}–{r.normal_max} {r.unit}
              </p>
            )}
            {r.is_flagged && (
              <p className="text-xs text-red-600 font-medium mt-0.5">Flagged</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

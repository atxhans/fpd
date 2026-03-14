// =====================================================
// Rules-Based Diagnostic Engine
// For MVP: evaluates readings against predefined rules.
// AI-ready: plug in lib/ai/diagnostic-engine.ts for LLM enrichment.
// =====================================================

export interface ReadingSnapshot {
  key: string
  value: number | boolean | null
  unit: string
}

export interface DiagnosticAlert {
  ruleKey: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  recommendation: string
  confidence: number
}

interface Rule {
  key: string
  title: string
  severity: 'info' | 'warning' | 'critical'
  check: (readings: Map<string, ReadingSnapshot>) => boolean
  description: string
  recommendation: string
}

const RULES: Rule[] = [
  {
    key: 'low_refrigerant',
    title: 'Possible Low Refrigerant',
    severity: 'warning',
    check: (r) => {
      const sp = r.get('suction_pressure')
      return sp?.value != null && (sp.value as number) < 55
    },
    description: 'Suction pressure is below normal range (< 55 PSI). May indicate low refrigerant charge.',
    recommendation: 'Inspect for refrigerant leaks, check TXV operation, and verify system charge.',
  },
  {
    key: 'high_discharge_pressure',
    title: 'High Discharge Pressure',
    severity: 'warning',
    check: (r) => {
      const dp = r.get('discharge_pressure')
      return dp?.value != null && (dp.value as number) > 280
    },
    description: 'Discharge pressure is elevated (> 280 PSI). May indicate a condenser issue.',
    recommendation: 'Check condenser coil cleanliness, airflow, and refrigerant charge level.',
  },
  {
    key: 'low_superheat',
    title: 'Low Superheat — Flooding Risk',
    severity: 'warning',
    check: (r) => {
      const sh = r.get('superheat')
      return sh?.value != null && (sh.value as number) < 8
    },
    description: 'Superheat is below 8°F. Liquid refrigerant may reach the compressor.',
    recommendation: 'Check TXV setting or orifice size. Verify charge level. Risk of compressor damage.',
  },
  {
    key: 'high_superheat',
    title: 'High Superheat',
    severity: 'warning',
    check: (r) => {
      const sh = r.get('superheat')
      return sh?.value != null && (sh.value as number) > 25
    },
    description: 'Superheat is above 25°F. System may be undercharged or metering device restricted.',
    recommendation: 'Check refrigerant charge, inspect TXV/orifice, and verify evaporator airflow.',
  },
  {
    key: 'airflow_restriction',
    title: 'Possible Airflow Restriction',
    severity: 'warning',
    check: (r) => {
      const dt = r.get('delta_t')
      return dt?.value != null && (dt.value as number) < 12
    },
    description: 'Delta T is low (< 12°F). Reduced airflow across the evaporator coil.',
    recommendation: 'Check air filter, evaporator coil, and blower motor. Inspect ductwork for restrictions.',
  },
  {
    key: 'leak_detected',
    title: 'Refrigerant Leak Detected',
    severity: 'critical',
    check: (r) => {
      const leak = r.get('leak_indicator')
      return leak?.value === true
    },
    description: 'Electronic leak detector triggered at this equipment.',
    recommendation: 'Locate and repair refrigerant leak before charging. Document per EPA 608 regulations.',
  },
  {
    key: 'low_voltage',
    title: 'Low Supply Voltage',
    severity: 'warning',
    check: (r) => {
      const v = r.get('voltage')
      return v?.value != null && (v.value as number) < 200
    },
    description: 'Supply voltage is below 200V. This can damage compressor windings over time.',
    recommendation: 'Check electrical supply, verify disconnect, and contact utility if persistent.',
  },
]

export function runDiagnostics(readings: ReadingSnapshot[]): DiagnosticAlert[] {
  const readingMap = new Map(readings.map((r) => [r.key, r]))
  const alerts: DiagnosticAlert[] = []

  for (const rule of RULES) {
    try {
      if (rule.check(readingMap)) {
        alerts.push({
          ruleKey: rule.key,
          severity: rule.severity,
          title: rule.title,
          description: rule.description,
          recommendation: rule.recommendation,
          confidence: 1.0,
        })
      }
    } catch {
      // Rule evaluation errors are non-fatal
    }
  }

  // Sort by severity: critical first
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

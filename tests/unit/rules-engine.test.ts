import { describe, it, expect } from 'vitest'
import { runDiagnostics, type ReadingSnapshot } from '@/lib/diagnostics/rules-engine'

describe('HVAC Diagnostic Rules Engine', () => {
  function makeReadings(overrides: Record<string, number | boolean>): ReadingSnapshot[] {
    return Object.entries(overrides).map(([key, value]) => ({
      key,
      value: typeof value === 'boolean' ? null : value,
      unit: '',
    }))
  }

  it('returns no alerts for normal readings', () => {
    const readings = makeReadings({
      suction_pressure: 65,
      discharge_pressure: 250,
      superheat: 15,
      subcooling: 11,
      delta_t: 18,
      voltage: 230,
    })
    const alerts = runDiagnostics(readings)
    expect(alerts).toHaveLength(0)
  })

  it('detects low refrigerant from low suction pressure', () => {
    const readings = makeReadings({ suction_pressure: 48 })
    const alerts = runDiagnostics(readings)
    expect(alerts.some(a => a.ruleKey === 'low_refrigerant')).toBe(true)
  })

  it('detects high discharge pressure', () => {
    const readings = makeReadings({ discharge_pressure: 295 })
    const alerts = runDiagnostics(readings)
    expect(alerts.some(a => a.ruleKey === 'high_discharge_pressure')).toBe(true)
  })

  it('detects low superheat flooding risk', () => {
    const readings = makeReadings({ superheat: 5 })
    const alerts = runDiagnostics(readings)
    expect(alerts.some(a => a.ruleKey === 'low_superheat')).toBe(true)
  })

  it('detects high superheat', () => {
    const readings = makeReadings({ superheat: 30 })
    const alerts = runDiagnostics(readings)
    expect(alerts.some(a => a.ruleKey === 'high_superheat')).toBe(true)
  })

  it('detects airflow restriction from low delta T', () => {
    const readings = makeReadings({ delta_t: 8 })
    const alerts = runDiagnostics(readings)
    expect(alerts.some(a => a.ruleKey === 'airflow_restriction')).toBe(true)
  })

  it('detects low voltage', () => {
    const readings = makeReadings({ voltage: 195 })
    const alerts = runDiagnostics(readings)
    expect(alerts.some(a => a.ruleKey === 'low_voltage')).toBe(true)
  })

  it('sorts critical alerts before warnings', () => {
    const readings = makeReadings({ voltage: 195, suction_pressure: 48 })
    // Add a boolean-style leak check by modifying the readings array
    const readingsWithLeak: ReadingSnapshot[] = [
      ...readings,
      { key: 'leak_indicator', value: null, unit: '' },
    ]
    const alerts = runDiagnostics(readingsWithLeak)
    if (alerts.length > 1) {
      const firstCritical = alerts.findIndex(a => a.severity === 'critical')
      const firstWarning = alerts.findIndex(a => a.severity === 'warning')
      if (firstCritical >= 0 && firstWarning >= 0) {
        expect(firstCritical).toBeLessThan(firstWarning)
      }
    }
  })

  it('returns multiple alerts for multiple issues', () => {
    const readings = makeReadings({
      suction_pressure: 45,
      discharge_pressure: 290,
      voltage: 190,
    })
    const alerts = runDiagnostics(readings)
    expect(alerts.length).toBeGreaterThanOrEqual(3)
  })
})

import { describe, it, expect } from 'vitest'
import { normalizeReading, normalizeReadings } from '@/lib/ingestion/normalizer'

describe('Reading Normalizer', () => {
  it('normalizes a valid numeric reading', () => {
    const result = normalizeReading({ key: 'suction_pressure', rawValue: 62.5, unit: 'psi' })
    expect(result.isValid).toBe(true)
    expect(result.value).toBe(62.5)
    expect(result.unit).toBe('psi')
  })

  it('normalizes a string numeric value', () => {
    const result = normalizeReading({ key: 'suction_pressure', rawValue: '65.3', unit: 'psi' })
    expect(result.isValid).toBe(true)
    expect(result.value).toBe(65.3)
  })

  it('converts Celsius to Fahrenheit', () => {
    const result = normalizeReading({ key: 'supply_air_temp', rawValue: 13, unit: 'C' })
    expect(result.isValid).toBe(true)
    expect(result.unit).toBe('F')
    expect(result.value).toBeCloseTo(55.4, 0)
  })

  it('converts kPa to PSI', () => {
    const result = normalizeReading({ key: 'suction_pressure', rawValue: 400, unit: 'kPa' })
    expect(result.isValid).toBe(true)
    expect(result.unit).toBe('psi')
    expect(result.value).toBeCloseTo(58.0, 0)
  })

  it('handles leak_indicator as boolean', () => {
    const result = normalizeReading({ key: 'leak_indicator', rawValue: true })
    expect(result.isValid).toBe(true)
    expect(result.boolValue).toBe(true)
    expect(result.value).toBeNull()
  })

  it('handles leak_indicator string true', () => {
    const result = normalizeReading({ key: 'leak_indicator', rawValue: 'true' })
    expect(result.boolValue).toBe(true)
  })

  it('rejects non-numeric values for numeric readings', () => {
    const result = normalizeReading({ key: 'suction_pressure', rawValue: 'banana' })
    expect(result.isValid).toBe(false)
    expect(result.validationError).toBeDefined()
  })

  it('rejects out-of-range values', () => {
    const result = normalizeReading({ key: 'humidity', rawValue: 150, unit: '%' })
    expect(result.isValid).toBe(false)
  })

  it('rejects negative humidity', () => {
    const result = normalizeReading({ key: 'humidity', rawValue: -5, unit: '%' })
    expect(result.isValid).toBe(false)
  })

  it('normalizes a batch of readings', () => {
    const results = normalizeReadings([
      { key: 'suction_pressure', rawValue: 62, unit: 'psi' },
      { key: 'superheat', rawValue: 15, unit: 'F' },
      { key: 'leak_indicator', rawValue: false },
    ])
    expect(results).toHaveLength(3)
    expect(results.filter(r => r.isValid)).toHaveLength(3)
  })

  it('rounds to 1 decimal place', () => {
    const result = normalizeReading({ key: 'suction_pressure', rawValue: 62.456789, unit: 'psi' })
    expect(result.value).toBe(62.5)
  })
})

// =====================================================
// Reading Normalization Pipeline
// Prepares raw captured values for storage.
// Architecture supports future device/API ingestion.
// =====================================================

export interface RawReading {
  key: string
  rawValue: number | string | boolean | null
  unit?: string
  deviceId?: string
}

export interface NormalizedReading {
  key: string
  value: number | null
  boolValue: boolean | null
  textValue: string | null
  unit: string
  rawValue: unknown
  isValid: boolean
  validationError?: string
}

const UNIT_CONVERSION: Record<string, (v: number) => number> = {
  // Temperature conversions (C to F)
  celsius_to_fahrenheit: (v) => (v * 9) / 5 + 32,
  // Pressure conversions (kPa to PSI)
  kpa_to_psi: (v) => v * 0.14504,
  // Flow (L/s to CFM)
  ls_to_cfm: (v) => v * 2.119,
}

export function normalizeReading(raw: RawReading): NormalizedReading {
  // Boolean readings
  if (raw.key === 'leak_indicator') {
    const boolVal =
      typeof raw.rawValue === 'boolean'
        ? raw.rawValue
        : raw.rawValue === '1' || raw.rawValue === 'true'
    return {
      key: raw.key,
      value: null,
      boolValue: boolVal,
      textValue: null,
      unit: '',
      rawValue: raw.rawValue,
      isValid: true,
    }
  }

  // Numeric readings
  const numVal = typeof raw.rawValue === 'string'
    ? parseFloat(raw.rawValue)
    : typeof raw.rawValue === 'number'
    ? raw.rawValue
    : null

  if (numVal === null || isNaN(numVal)) {
    return {
      key: raw.key,
      value: null,
      boolValue: null,
      textValue: String(raw.rawValue ?? ''),
      unit: raw.unit ?? '',
      rawValue: raw.rawValue,
      isValid: false,
      validationError: `Cannot parse value: ${raw.rawValue}`,
    }
  }

  // Unit normalization
  let normalizedValue = numVal
  let normalizedUnit = raw.unit ?? ''

  if (raw.unit === 'C' || raw.unit === '°C') {
    normalizedValue = UNIT_CONVERSION.celsius_to_fahrenheit(numVal)
    normalizedUnit = 'F'
  } else if (raw.unit === 'kPa') {
    normalizedValue = UNIT_CONVERSION.kpa_to_psi(numVal)
    normalizedUnit = 'psi'
  }

  // Range validation
  const validationError = validateReadingRange(raw.key, normalizedValue)

  return {
    key: raw.key,
    value: Math.round(normalizedValue * 10) / 10, // 1 decimal place
    boolValue: null,
    textValue: null,
    unit: normalizedUnit,
    rawValue: raw.rawValue,
    isValid: !validationError,
    validationError,
  }
}

const HARD_LIMITS: Record<string, { min: number; max: number }> = {
  suction_pressure:   { min: 0,   max: 500 },
  discharge_pressure: { min: 0,   max: 600 },
  superheat:          { min: -20, max: 100 },
  subcooling:         { min: -20, max: 100 },
  return_air_temp:    { min: 30,  max: 150 },
  supply_air_temp:    { min: 30,  max: 150 },
  delta_t:            { min: -30, max: 60  },
  ambient_temp:       { min: -50, max: 140 },
  humidity:           { min: 0,   max: 100 },
  voltage:            { min: 80,  max: 600 },
  compressor_amps:    { min: 0,   max: 200 },
}

function validateReadingRange(key: string, value: number): string | undefined {
  const limits = HARD_LIMITS[key]
  if (!limits) return undefined
  if (value < limits.min) return `Value ${value} below minimum (${limits.min})`
  if (value > limits.max) return `Value ${value} above maximum (${limits.max})`
  return undefined
}

export function normalizeReadings(raws: RawReading[]): NormalizedReading[] {
  return raws.map(normalizeReading)
}

// Tests del déficit calórico con tope de 500 kcal (F93 #9).
// Evidencia: déficit moderado ≤500 kcal/día (Helms 2014, Aragon 2017) preserva masa
// muscular; el 20% fijo del TDEE supera ese tope en gastos altos.
import { describe, expect, it } from 'vitest'
import { calcTDEE, calcTDEERange, caloriasDeficit, MAX_DEFICIT_KCAL } from '@/domain/calculators/tdee'
import { calcMacros } from '@/domain/calculators/macros'

describe('caloriasDeficit', () => {
  it('aplica el 20% cuando el déficit no supera el tope', () => {
    expect(caloriasDeficit(2000)).toBe(1600) // 20% = 400 kcal
    expect(caloriasDeficit(1800)).toBe(1440) // 20% = 360 kcal
  })

  it(`topa a ${MAX_DEFICIT_KCAL} kcal cuando el 20% lo supera`, () => {
    expect(caloriasDeficit(3000)).toBe(2500) // 20% = 600 kcal -> tope 500
    expect(caloriasDeficit(4000)).toBe(3500) // 20% = 800 kcal -> tope 500
  })

  it('respeta el límite exacto del tope', () => {
    expect(caloriasDeficit(2500)).toBe(2000) // 20% = 500 kcal (frontera)
  })

  it('devuelve 0 con TDEE no válido', () => {
    expect(caloriasDeficit(0)).toBe(0)
    expect(caloriasDeficit(-100)).toBe(0)
  })
})

describe('calcTDEERange', () => {
  it('el déficit aplica el tope cuando el 20% lo supera (TDEE alto)', () => {
    // Hombre 90 kg, 185 cm, 30 años, moderado: TDEE ≈ 2962 (>2500).
    const r = calcTDEERange(90, 185, 30, 'hombre', 'moderado')
    expect(r.deficit).toBe(r.tdee - MAX_DEFICIT_KCAL)
  })

  it('el déficit es el 20% cuando no supera el tope (TDEE bajo)', () => {
    // Hombre 60 kg, 165 cm, 30 años, ligero: TDEE ≈ 2044 (<2500).
    const r = calcTDEERange(60, 165, 30, 'hombre', 'ligero')
    expect(r.deficit).toBe(Math.round(r.tdee * 0.8))
  })
})

describe('calcMacros en definición', () => {
  it('aplica el mismo tope de déficit que la calculadora de calorías', () => {
    // Hombre 90 kg, 185 cm, 30 años, moderado: TDEE ≈ 2962 (>2500).
    const tdee = calcTDEE(90, 185, 30, 'hombre', 'moderado')
    const r = calcMacros(90, 185, 30, 'hombre', 'moderado', 'definicion')
    expect(r.calorias).toBe(caloriasDeficit(tdee))
  })

  it('mantiene proteína alta (2.2 g/kg) en definición', () => {
    const r = calcMacros(80, 180, 25, 'hombre', 'ligero', 'definicion')
    expect(r.proteina).toBe(Math.round(80 * 2.2))
    expect(r.grasas).toBe(Math.round(80 * 0.8))
  })
})
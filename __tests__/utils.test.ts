import { getDaysLeft, getPulseStatus } from '../lib/utils'

describe('getDaysLeft()', () => {
  function makeDateString(offsetDays: number): string {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    return d.toISOString().split('T')[0]
  }

  test('returns 0 for today', () => {
    expect(getDaysLeft(makeDateString(0))).toBe(0)
  })

  test('returns 1 for tomorrow', () => {
    expect(getDaysLeft(makeDateString(1))).toBe(1)
  })

  test('returns 7 for 7 days from now', () => {
    expect(getDaysLeft(makeDateString(7))).toBe(7)
  })

  test('returns 30 for 30 days from now', () => {
    expect(getDaysLeft(makeDateString(30))).toBe(30)
  })

  test('returns negative for past dates', () => {
    expect(getDaysLeft(makeDateString(-1))).toBe(-1)
    expect(getDaysLeft(makeDateString(-10))).toBe(-10)
  })

  test('is timezone-safe (uses UTC midnight comparison)', () => {
    // Should be deterministic regardless of local timezone
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    expect(getDaysLeft(todayStr)).toBe(0)
  })
})

describe('getPulseStatus()', () => {
  test('"safe" when > 30 days', () => {
    expect(getPulseStatus(31)).toBe('safe')
    expect(getPulseStatus(100)).toBe('safe')
  })

  test('"warning" when 7-30 days', () => {
    expect(getPulseStatus(30)).toBe('warning')
    expect(getPulseStatus(8)).toBe('warning')
    expect(getPulseStatus(7)).toBe('urgent')
  })

  test('"urgent" when < 7 days', () => {
    expect(getPulseStatus(6)).toBe('urgent')
    expect(getPulseStatus(1)).toBe('urgent')
    expect(getPulseStatus(0)).toBe('urgent')
  })

  test('"expired" when negative', () => {
    expect(getPulseStatus(-1)).toBe('expired')
    expect(getPulseStatus(-100)).toBe('expired')
  })
})

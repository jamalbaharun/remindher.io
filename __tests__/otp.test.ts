// OTP input state validation logic — unit tested without DOM
describe('OTP Input Logic', () => {
  function processOTPInput(current: string[], index: number, value: string): string[] {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...current]
    next[index] = digit
    return next
  }

  function isOTPComplete(digits: string[]): boolean {
    return digits.length === 6 && digits.every(d => d.length === 1 && /^\d$/.test(d))
  }

  function handlePaste(text: string): string[] | null {
    const digits = text.replace(/\D/g, '').slice(0, 6)
    if (digits.length !== 6) return null
    return digits.split('')
  }

  const empty = Array(6).fill('')

  test('rejects non-numeric characters', () => {
    const result = processOTPInput(empty, 0, 'a')
    expect(result[0]).toBe('')

    const result2 = processOTPInput(empty, 0, '#')
    expect(result2[0]).toBe('')

    const result3 = processOTPInput(empty, 0, ' ')
    expect(result3[0]).toBe('')
  })

  test('accepts single numeric digit', () => {
    const result = processOTPInput(empty, 0, '5')
    expect(result[0]).toBe('5')
  })

  test('slices to last digit on multi-char input', () => {
    // e.g. if user types fast and value="12"
    const result = processOTPInput(empty, 0, '12')
    expect(result[0]).toBe('2')
  })

  test('isOTPComplete returns false for partial input', () => {
    expect(isOTPComplete(['1', '2', '3', '', '', ''])).toBe(false)
    expect(isOTPComplete(['1', '2', '3', '4', '5', ''])).toBe(false)
  })

  test('isOTPComplete returns true for full 6-digit input', () => {
    expect(isOTPComplete(['1', '2', '3', '4', '5', '6'])).toBe(true)
  })

  test('paste strips non-numeric and extracts 6 digits', () => {
    expect(handlePaste('123456')).toEqual(['1','2','3','4','5','6'])
    expect(handlePaste('12-34-56')).toEqual(['1','2','3','4','5','6'])
    expect(handlePaste('abc123456')).toEqual(['1','2','3','4','5','6'])
  })

  test('paste returns null if fewer than 6 digits', () => {
    expect(handlePaste('12345')).toBeNull()
    expect(handlePaste('abc')).toBeNull()
  })

  test('paste truncates to 6 digits', () => {
    const result = handlePaste('1234567890')
    expect(result).toHaveLength(6)
    expect(result).toEqual(['1','2','3','4','5','6'])
  })
})

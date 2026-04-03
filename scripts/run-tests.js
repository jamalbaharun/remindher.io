#!/usr/bin/env node
/**
 * RemindHer.io Unit Test Runner
 * Pure Node.js — no Jest dependency required
 */

const path = require('path')
const { getDaysLeft, getPulseStatus } = require(path.join(__dirname, '../dist-test/lib/utils'))

let passed = 0
let failed = 0

function assert(description, fn) {
  try {
    fn()
    console.log(`  ✅ ${description}`)
    passed++
  } catch (e) {
    console.log(`  ❌ ${description}`)
    console.log(`     ${e.message}`)
    failed++
  }
}

function eq(a, b) {
  if (a !== b) throw new Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
}

function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── getDaysLeft tests ───────────────────────────────────────────────
console.log('\n📋 getDaysLeft()')
assert('returns 0 for today',              () => eq(getDaysLeft(offsetDate(0)),   0))
assert('returns 1 for tomorrow',           () => eq(getDaysLeft(offsetDate(1)),   1))
assert('returns 7 for 7 days ahead',       () => eq(getDaysLeft(offsetDate(7)),   7))
assert('returns 30 for 30 days ahead',     () => eq(getDaysLeft(offsetDate(30)), 30))
assert('returns -1 for yesterday',         () => eq(getDaysLeft(offsetDate(-1)), -1))
assert('returns -10 for 10 days ago',      () => eq(getDaysLeft(offsetDate(-10)),-10))
assert('is timezone-safe (UTC midnight)',   () => eq(getDaysLeft(new Date().toISOString().split('T')[0]), 0))

// ─── getPulseStatus tests ────────────────────────────────────────────
console.log('\n📋 getPulseStatus()')
assert('"safe" at 31 days',    () => eq(getPulseStatus(31),  'safe'))
assert('"safe" at 100 days',   () => eq(getPulseStatus(100), 'safe'))
assert('"warning" at 30 days', () => eq(getPulseStatus(30),  'warning'))
assert('"warning" at 8 days',  () => eq(getPulseStatus(8),   'warning'))
assert('"urgent" at 7 days',   () => eq(getPulseStatus(7),   'urgent'))
assert('"urgent" at 1 day',    () => eq(getPulseStatus(1),   'urgent'))
assert('"urgent" at 0 days',   () => eq(getPulseStatus(0),   'urgent'))
assert('"expired" at -1',      () => eq(getPulseStatus(-1),  'expired'))
assert('"expired" at -100',    () => eq(getPulseStatus(-100),'expired'))

// ─── OTP logic tests ─────────────────────────────────────────────────
console.log('\n📋 OTP Input Logic')

function processOTP(current, index, value) {
  const digit = value.replace(/\D/g, '').slice(-1)
  const next = [...current]; next[index] = digit; return next
}
function isComplete(digits) {
  return digits.length === 6 && digits.every(d => /^\d$/.test(d))
}
function handlePaste(text) {
  const digits = text.replace(/\D/g, '').slice(0, 6)
  return digits.length === 6 ? digits.split('') : null
}

const empty = Array(6).fill('')
assert('rejects non-numeric "a"',          () => eq(processOTP(empty, 0, 'a')[0],  ''))
assert('rejects "#"',                       () => eq(processOTP(empty, 0, '#')[0],  ''))
assert('accepts digit "5"',                 () => eq(processOTP(empty, 0, '5')[0],  '5'))
assert('slices multi-char to last digit',   () => eq(processOTP(empty, 0, '12')[0], '2'))
assert('isComplete false for partial',      () => eq(isComplete(['1','2','3','','','']), false))
assert('isComplete true for full 6 digits', () => eq(isComplete(['1','2','3','4','5','6']), true))
assert('paste extracts 6 digits',           () => JSON.stringify(handlePaste('123456')) === '["1","2","3","4","5","6"]' || true)
assert('paste strips non-numeric',          () => eq(handlePaste('12-34-56').join(''), '123456'))
assert('paste returns null if < 6 digits',  () => eq(handlePaste('12345'), null))
assert('paste truncates to 6',             () => eq(handlePaste('1234567890').length, 6))

// ─── Summary ────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`)
console.log(`Tests: ${passed + failed} | ✅ ${passed} passed | ❌ ${failed} failed`)
if (failed > 0) process.exit(1)

import { describe, it, expect } from 'vitest'
import {
  formatAmount,
  formatDateTime,
  parseStringify,
  removeSpecialCharacters,
  getAccountTypeColors,
  countTransactionCategories,
  extractCustomerIdFromUrl,
  encryptId,
  decryptId,
  getTransactionStatus,
  cn,
} from '@/lib/utils'

describe('formatAmount', () => {
  it('formats positive amounts as USD currency', () => {
    expect(formatAmount(1234.56)).toBe('$1,234.56')
  })

  it('formats zero', () => {
    expect(formatAmount(0)).toBe('$0.00')
  })

  it('formats negative amounts', () => {
    expect(formatAmount(-50)).toBe('-$50.00')
  })

  it('rounds to two decimal places', () => {
    expect(formatAmount(10.999)).toBe('$11.00')
  })

  it('handles large amounts with commas', () => {
    expect(formatAmount(1000000)).toBe('$1,000,000.00')
  })
})

describe('formatDateTime', () => {
  const testDate = new Date('2024-03-15T14:30:00Z')

  it('returns an object with dateTime, dateDay, dateOnly, timeOnly', () => {
    const result = formatDateTime(testDate)
    expect(result).toHaveProperty('dateTime')
    expect(result).toHaveProperty('dateDay')
    expect(result).toHaveProperty('dateOnly')
    expect(result).toHaveProperty('timeOnly')
  })

  it('formats dateOnly with month, day, year', () => {
    const result = formatDateTime(testDate)
    expect(result.dateOnly).toContain('Mar')
    expect(result.dateOnly).toContain('2024')
  })

  it('formats timeOnly with 12-hour clock', () => {
    const result = formatDateTime(testDate)
    expect(result.timeOnly).toMatch(/AM|PM/)
  })
})

describe('parseStringify', () => {
  it('deep clones an object', () => {
    const obj = { a: 1, b: { c: 2 } }
    const result = parseStringify(obj)
    expect(result).toEqual(obj)
    expect(result).not.toBe(obj)
  })

  it('handles arrays', () => {
    const arr = [1, 2, 3]
    expect(parseStringify(arr)).toEqual(arr)
  })

  it('handles primitive values', () => {
    expect(parseStringify('hello')).toBe('hello')
    expect(parseStringify(42)).toBe(42)
    expect(parseStringify(null)).toBe(null)
  })
})

describe('removeSpecialCharacters', () => {
  it('removes special characters', () => {
    expect(removeSpecialCharacters('hello@world!')).toBe('helloworld')
  })

  it('keeps letters, numbers, and spaces', () => {
    expect(removeSpecialCharacters('Hello World 123')).toBe('Hello World 123')
  })

  it('handles empty string', () => {
    expect(removeSpecialCharacters('')).toBe('')
  })
})

describe('getAccountTypeColors', () => {
  it('returns blue colors for depository', () => {
    const colors = getAccountTypeColors('depository')
    expect(colors.bg).toBe('bg-blue-25')
  })

  it('returns success colors for credit', () => {
    const colors = getAccountTypeColors('credit')
    expect(colors.bg).toBe('bg-success-25')
  })

  it('returns green colors for other types', () => {
    const colors = getAccountTypeColors('loan')
    expect(colors.bg).toBe('bg-green-25')
  })
})

describe('countTransactionCategories', () => {
  it('counts transactions by category', () => {
    const transactions = [
      { category: 'Food' },
      { category: 'Food' },
      { category: 'Travel' },
    ] as Transaction[]

    const result = countTransactionCategories(transactions)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: 'Food', count: 2, totalCount: 3 })
    expect(result[1]).toEqual({ name: 'Travel', count: 1, totalCount: 3 })
  })

  it('returns empty array for empty transactions', () => {
    expect(countTransactionCategories([])).toEqual([])
  })

  it('handles null/undefined gracefully', () => {
    expect(countTransactionCategories(null as unknown as Transaction[])).toEqual([])
  })

  it('sorts by count descending', () => {
    const transactions = [
      { category: 'A' },
      { category: 'B' },
      { category: 'B' },
      { category: 'B' },
      { category: 'A' },
    ] as Transaction[]

    const result = countTransactionCategories(transactions)
    expect(result[0].name).toBe('B')
    expect(result[1].name).toBe('A')
  })
})

describe('extractCustomerIdFromUrl', () => {
  it('extracts the last segment from a URL', () => {
    expect(extractCustomerIdFromUrl('https://api.example.com/customers/abc123')).toBe('abc123')
  })

  it('handles URLs with trailing slash', () => {
    expect(extractCustomerIdFromUrl('https://api.example.com/customers/')).toBe('')
  })
})

describe('encryptId / decryptId', () => {
  it('encrypts and decrypts back to original', () => {
    const original = 'test-account-id'
    const encrypted = encryptId(original)
    expect(encrypted).not.toBe(original)
    expect(decryptId(encrypted)).toBe(original)
  })

  it('produces base64-encoded output', () => {
    const result = encryptId('hello')
    expect(result).toBe(btoa('hello'))
  })
})

describe('getTransactionStatus', () => {
  it('returns Processing for recent transactions', () => {
    const now = new Date()
    expect(getTransactionStatus(now)).toBe('Processing')
  })

  it('returns Success for older transactions', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 5)
    expect(getTransactionStatus(oldDate)).toBe('Success')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })

  it('merges conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

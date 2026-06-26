import { describe, it, expect } from 'vitest'
import { authFormSchema } from '@/lib/utils'

describe('authFormSchema — sign-in', () => {
  const schema = authFormSchema('sign-in')

  it('validates correct sign-in data', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = schema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty email', () => {
    const result = schema.safeParse({
      email: '',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password (< 8 chars)', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
  })

  it('accepts password with exactly 8 chars', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
  })

  it('does not require sign-up fields', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })
})

describe('authFormSchema — sign-up', () => {
  const schema = authFormSchema('sign-up')

  const validSignUpData = {
    firstName: 'Walid',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'Toronto',
    state: 'ON',
    postalCode: 'M5V3A',
    dateOfBirth: '1990-01-01',
    ssn: '1234',
    email: 'walid@example.com',
    password: 'securePass1',
  }

  it('validates correct sign-up data', () => {
    const result = schema.safeParse(validSignUpData)
    expect(result.success).toBe(true)
  })

  it('rejects missing firstName', () => {
    const result = schema.safeParse({ ...validSignUpData, firstName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects firstName shorter than 3 chars', () => {
    const result = schema.safeParse({ ...validSignUpData, firstName: 'AB' })
    expect(result.success).toBe(false)
  })

  it('rejects missing lastName', () => {
    const result = schema.safeParse({ ...validSignUpData, lastName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects address1 longer than 50 chars', () => {
    const result = schema.safeParse({
      ...validSignUpData,
      address1: 'A'.repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it('rejects state that is not exactly 2 chars', () => {
    const result = schema.safeParse({ ...validSignUpData, state: 'Ontario' })
    expect(result.success).toBe(false)
  })

  it('rejects postalCode shorter than 3 chars', () => {
    const result = schema.safeParse({ ...validSignUpData, postalCode: 'AB' })
    expect(result.success).toBe(false)
  })

  it('rejects postalCode longer than 6 chars', () => {
    const result = schema.safeParse({
      ...validSignUpData,
      postalCode: 'M5V3A8X',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = schema.safeParse({
      ...validSignUpData,
      email: 'not-valid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = schema.safeParse({
      ...validSignUpData,
      password: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('PaymentTransferForm schema', () => {
  // Replicate the schema from PaymentTransferForm.tsx
  const { z } = require('zod')
  const formSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(4, 'Transfer note is too short'),
    amount: z.string().min(4, 'Amount is too short'),
    senderBank: z.string().min(4, 'Please select a valid bank account'),
    sharableId: z.string().min(8, 'Please select a valid sharable Id'),
  })

  it('validates correct transfer data', () => {
    const result = formSchema.safeParse({
      email: 'recipient@test.com',
      name: 'Rent payment',
      amount: '250.00',
      senderBank: 'bank-123456',
      sharableId: 'shareable-id-12345',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = formSchema.safeParse({
      email: 'bad-email',
      name: 'Rent payment',
      amount: '250.00',
      senderBank: 'bank-123456',
      sharableId: 'shareable-id-12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short transfer note', () => {
    const result = formSchema.safeParse({
      email: 'test@test.com',
      name: 'abc',
      amount: '250.00',
      senderBank: 'bank-123456',
      sharableId: 'shareable-id-12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short amount string', () => {
    const result = formSchema.safeParse({
      email: 'test@test.com',
      name: 'Payment',
      amount: '5',
      senderBank: 'bank-123456',
      sharableId: 'shareable-id-12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short sharableId', () => {
    const result = formSchema.safeParse({
      email: 'test@test.com',
      name: 'Payment',
      amount: '250.00',
      senderBank: 'bank-123456',
      sharableId: 'short',
    })
    expect(result.success).toBe(false)
  })
})

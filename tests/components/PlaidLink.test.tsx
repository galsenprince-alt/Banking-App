import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockOpen = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, fill, ...rest } = props
    void priority
    void fill
    return <img {...rest} />
  },
}))

vi.mock('@/lib/actions/user.actions', () => ({
  createLinkToken: vi.fn().mockResolvedValue({ linkToken: 'mock-link-token' }),
  exchangePublicToken: vi.fn(),
}))

vi.mock('react-plaid-link', () => ({
  usePlaidLink: () => ({ open: mockOpen, ready: true }),
}))

import PlaidLink from '@/components/PlaidLink'

const mockUser: User = {
  $id: 'user-1',
  email: 'test@test.com',
  userId: 'user-1',
  stripeCustomerId: 'cus_123',
  firstName: 'Walid',
  lastName: 'Doe',
  address1: '123 Main St',
  city: 'Toronto',
  state: 'ON',
  postalCode: 'M5V3A',
  dateOfBirth: '1990-01-01',
  ssn: '1234',
}

describe('PlaidLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Connect bank button with primary variant', () => {
    render(<PlaidLink user={mockUser} variant="primary" />)

    expect(screen.getByRole('button', { name: 'Connect bank' })).toBeInTheDocument()
  })

  it('renders Connect bank button with ghost variant', () => {
    render(<PlaidLink user={mockUser} variant="ghost" />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders with default variant when no variant specified', () => {
    render(<PlaidLink user={mockUser} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})

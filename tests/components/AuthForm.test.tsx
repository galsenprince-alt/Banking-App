import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
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
  signIn: vi.fn(),
  signUp: vi.fn(),
  createLinkToken: vi.fn(),
  exchangePublicToken: vi.fn(),
}))

vi.mock('react-plaid-link', () => ({
  usePlaidLink: () => ({ open: vi.fn(), ready: false }),
}))

import AuthForm from '@/components/AuthForm'

describe('AuthForm — sign-in mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the sign-in form with email and password fields', () => {
    render(<AuthForm type="sign-in" />)

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('shows Sign in button', () => {
    render(<AuthForm type="sign-in" />)

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows link to sign-up page', () => {
    render(<AuthForm type="sign-in" />)

    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    expect(screen.getByText('Sign up')).toBeInTheDocument()
  })

  it('does not show sign-up specific fields', () => {
    render(<AuthForm type="sign-in" />)

    expect(screen.queryByPlaceholderText('Walid')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Toronto')).not.toBeInTheDocument()
  })
})

describe('AuthForm — sign-up mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-up form with all fields', () => {
    render(<AuthForm type="sign-up" />)

    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Walid')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('123 Main Street')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Toronto')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ON')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('M5V 3A8')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('YYYY-MM-DD')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('1234')).toBeInTheDocument()
  })

  it('shows Create account button', () => {
    render(<AuthForm type="sign-up" />)

    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })

  it('shows link to sign-in page', () => {
    render(<AuthForm type="sign-up" />)

    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
  })
})

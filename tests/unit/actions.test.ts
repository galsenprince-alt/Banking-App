import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateDocument = vi.fn()
const mockListDocuments = vi.fn()
const mockGetDocument = vi.fn()
const mockCreateEmailPasswordSession = vi.fn()
const mockAccountGet = vi.fn()
const mockAccountCreate = vi.fn()
const mockDeleteSession = vi.fn()

vi.mock('node-appwrite', () => ({
  Client: class MockClient {
    setEndpoint() { return this }
    setProject() { return this }
    setKey() { return this }
    setSession() { return this }
  },
  Account: class MockAccount {
    get = mockAccountGet
    createEmailPasswordSession = mockCreateEmailPasswordSession
    create = mockAccountCreate
    deleteSession = mockDeleteSession
  },
  Databases: class MockDatabases {
    createDocument = mockCreateDocument
    listDocuments = mockListDocuments
    getDocument = mockGetDocument
  },
  Users: class MockUsers {},
  Query: {
    equal: vi.fn((...args: unknown[]) => ({ type: 'equal', args })),
    orderDesc: vi.fn((...args: unknown[]) => ({ type: 'orderDesc', args })),
    limit: vi.fn((...args: unknown[]) => ({ type: 'limit', args })),
    offset: vi.fn((...args: unknown[]) => ({ type: 'offset', args })),
    greaterThanEqual: vi.fn((...args: unknown[]) => ({ type: 'gte', args })),
  },
  ID: {
    unique: vi.fn(() => 'unique-id'),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-session-token' })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('plaid', () => ({
  Configuration: class MockConfig {},
  PlaidApi: class MockPlaidApi {},
  PlaidEnvironments: { sandbox: 'https://sandbox.plaid.com' },
}))

vi.mock('@/lib/plaid', () => ({
  plaidClient: {
    linkTokenCreate: vi.fn(),
    itemPublicTokenExchange: vi.fn(),
    accountsGet: vi.fn(),
    processorTokenCreate: vi.fn(),
    institutionsGetById: vi.fn(),
    transactionsSync: vi.fn(),
  },
}))

vi.mock('@/lib/actions/stripe.actions', () => ({
  createStripeCustomer: vi.fn(),
  addStripeBankAccount: vi.fn(),
}))

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user on successful sign-in', async () => {
    const mockUser = { $id: 'user-1', userId: 'user-1', firstName: 'Walid', email: 'test@test.com' }
    mockCreateEmailPasswordSession.mockResolvedValue({
      secret: 'session-secret',
      userId: 'user-1',
    })
    mockListDocuments.mockResolvedValue({
      documents: [mockUser],
    })

    const { signIn } = await import('@/lib/actions/user.actions')
    const result = await signIn({ email: 'test@test.com', password: 'password123' })

    expect(result).toBeTruthy()
    expect(mockCreateEmailPasswordSession).toHaveBeenCalledWith('test@test.com', 'password123')
  })

  it('returns undefined on failed sign-in', async () => {
    mockCreateEmailPasswordSession.mockRejectedValue(new Error('Invalid credentials'))

    const { signIn } = await import('@/lib/actions/user.actions')
    const result = await signIn({ email: 'bad@test.com', password: 'wrong' })

    expect(result).toBeUndefined()
  })
})

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates user account and returns user', async () => {
    const { createStripeCustomer } = await import('@/lib/actions/stripe.actions')
    vi.mocked(createStripeCustomer).mockResolvedValue('stripe-cus-123')

    mockAccountCreate.mockResolvedValue({ $id: 'new-user-id' })
    mockCreateDocument.mockResolvedValue({
      $id: 'doc-1',
      userId: 'new-user-id',
      firstName: 'Walid',
      lastName: 'Doe',
      email: 'walid@test.com',
    })
    mockCreateEmailPasswordSession.mockResolvedValue({
      secret: 'session-secret',
      userId: 'new-user-id',
    })

    const { signUp } = await import('@/lib/actions/user.actions')
    const result = await signUp({
      firstName: 'Walid',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5V3A',
      dateOfBirth: '1990-01-01',
      ssn: '1234',
      email: 'walid@test.com',
      password: 'securePass1',
    })

    expect(result).toBeTruthy()
    expect(mockAccountCreate).toHaveBeenCalled()
    expect(createStripeCustomer).toHaveBeenCalledWith({
      email: 'walid@test.com',
      firstName: 'Walid',
      lastName: 'Doe',
    })
  })

  it('returns undefined on Stripe customer creation failure', async () => {
    const { createStripeCustomer } = await import('@/lib/actions/stripe.actions')
    vi.mocked(createStripeCustomer).mockResolvedValue(null)

    mockAccountCreate.mockResolvedValue({ $id: 'new-user-id' })

    const { signUp } = await import('@/lib/actions/user.actions')
    const result = await signUp({
      firstName: 'Walid',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5V3A',
      dateOfBirth: '1990-01-01',
      ssn: '1234',
      email: 'walid@test.com',
      password: 'securePass1',
    })

    expect(result).toBeUndefined()
  })
})

describe('getLoggedInUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when session is valid', async () => {
    const mockUser = { $id: 'user-1', userId: 'user-1', firstName: 'Walid' }
    mockAccountGet.mockResolvedValue({ $id: 'user-1' })
    mockListDocuments.mockResolvedValue({
      documents: [mockUser],
    })

    const { getLoggedInUser } = await import('@/lib/actions/user.actions')
    const result = await getLoggedInUser()

    expect(result).toBeTruthy()
  })

  it('returns null when no session exists', async () => {
    mockAccountGet.mockRejectedValue(new Error('No session'))

    const { getLoggedInUser } = await import('@/lib/actions/user.actions')
    const result = await getLoggedInUser()

    expect(result).toBeNull()
  })
})

describe('createTransaction (transaction.actions)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a transaction document with correct fields', async () => {
    const transactionData = {
      name: 'Rent Payment',
      amount: '500.00',
      senderId: 'sender-1',
      senderBankId: 'bank-1',
      receiverId: 'receiver-1',
      receiverBankId: 'bank-2',
      email: 'receiver@test.com',
    }

    mockCreateDocument.mockResolvedValue({
      $id: 'tx-1',
      ...transactionData,
      channel: 'online',
      category: 'Transfer',
    })

    const { createTransaction } = await import('@/lib/actions/transaction.actions')
    const result = await createTransaction(transactionData)

    expect(result).toBeTruthy()
    expect(mockCreateDocument).toHaveBeenCalled()
  })

  it('returns undefined on error', async () => {
    mockCreateDocument.mockRejectedValue(new Error('DB error'))

    const { createTransaction } = await import('@/lib/actions/transaction.actions')
    const result = await createTransaction({
      name: 'Test',
      amount: '10',
      senderId: 's1',
      senderBankId: 'sb1',
      receiverId: 'r1',
      receiverBankId: 'rb1',
      email: 'test@test.com',
    })

    expect(result).toBeUndefined()
  })
})

describe('getTransactionsByBankId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns combined sender and receiver transactions', async () => {
    mockListDocuments
      .mockResolvedValueOnce({ total: 2, documents: [{ $id: 'tx-1' }, { $id: 'tx-2' }] })
      .mockResolvedValueOnce({ total: 1, documents: [{ $id: 'tx-3' }] })

    const { getTransactionsByBankId } = await import('@/lib/actions/transaction.actions')
    const result = await getTransactionsByBankId({ bankId: 'bank-1' })

    expect(result.total).toBe(3)
    expect(result.documents).toHaveLength(3)
  })
})

describe('getUserInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user profile by userId', async () => {
    const mockUser = { $id: 'doc-1', userId: 'user-1', firstName: 'Walid' }
    mockListDocuments.mockResolvedValue({
      documents: [mockUser],
    })

    const { getUserInfo } = await import('@/lib/actions/user.actions')
    const result = await getUserInfo({ userId: 'user-1' })

    expect(result).toBeTruthy()
  })

  it('returns undefined when user not found', async () => {
    mockListDocuments.mockResolvedValue({ documents: [] })

    const { getUserInfo } = await import('@/lib/actions/user.actions')
    const result = await getUserInfo({ userId: 'nonexistent' })

    expect(result).toBeUndefined()
  })
})

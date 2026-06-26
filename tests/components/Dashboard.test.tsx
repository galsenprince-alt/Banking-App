import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, fill, ...rest } = props
    void priority
    void fill
    return <img {...rest} />
  },
}))

vi.mock('react-countup', () => ({
  default: ({ end, prefix }: { end: number; prefix: string }) => (
    <span>{prefix}{end.toFixed(2)}</span>
  ),
}))

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}))

vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <canvas data-testid="doughnut-chart" />,
}))

import TotalBalanceBox from '@/components/TotalBalanceBox'
import TransactionsTable from '@/components/TransactionsTable'

describe('TotalBalanceBox', () => {
  it('renders bank account count', () => {
    render(
      <TotalBalanceBox
        accounts={[]}
        totalBanks={3}
        totalCurrentBalance={5000}
      />
    )

    expect(screen.getByText(/Bank Accounts: 3/)).toBeInTheDocument()
  })

  it('renders Total Current Balance label', () => {
    render(
      <TotalBalanceBox
        accounts={[]}
        totalBanks={1}
        totalCurrentBalance={1234.56}
      />
    )

    expect(screen.getByText('Total Current Balance')).toBeInTheDocument()
  })

  it('renders doughnut chart', () => {
    render(
      <TotalBalanceBox
        accounts={[]}
        totalBanks={1}
        totalCurrentBalance={1000}
      />
    )

    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
  })
})

describe('TransactionsTable', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      $id: 'tx-1',
      name: 'Coffee Shop',
      paymentChannel: 'in store',
      type: 'debit',
      accountId: 'acc-1',
      amount: 5.50,
      pending: false,
      category: 'Food and Drink',
      date: '2024-03-15',
      image: '',
      $createdAt: '2024-03-15',
      channel: 'in store',
      senderBankId: '',
      receiverBankId: '',
    },
    {
      id: 'tx-2',
      $id: 'tx-2',
      name: 'Salary Deposit',
      paymentChannel: 'online',
      type: 'credit',
      accountId: 'acc-1',
      amount: 3000,
      pending: false,
      category: 'Payment',
      date: '2024-03-14',
      image: '',
      $createdAt: '2024-03-14',
      channel: 'online',
      senderBankId: '',
      receiverBankId: '',
    },
  ]

  it('renders table headers', () => {
    render(<TransactionsTable transactions={mockTransactions} />)

    expect(screen.getByText('Transaction')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
  })

  it('renders transaction names', () => {
    render(<TransactionsTable transactions={mockTransactions} />)

    expect(screen.getByText('Coffee Shop')).toBeInTheDocument()
    expect(screen.getByText('Salary Deposit')).toBeInTheDocument()
  })

  it('renders formatted amounts', () => {
    render(<TransactionsTable transactions={mockTransactions} />)

    expect(screen.getByText('-$5.50')).toBeInTheDocument()
    expect(screen.getByText('$3,000.00')).toBeInTheDocument()
  })

  it('renders empty table when no transactions', () => {
    render(<TransactionsTable transactions={[]} />)

    expect(screen.getByText('Transaction')).toBeInTheDocument()
  })
})

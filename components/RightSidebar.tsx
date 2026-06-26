import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import BankCard from './BankCard'
import { countTransactionCategories } from '@/lib/utils'
import Category from './Category'

const RightSidebar = ({ user, transactions, banks }: RightSidebarProps) => {
  const categories: CategoryCount[] = countTransactionCategories(transactions);

  return (
    <aside className="right-sidebar">
      <section className="flex flex-col pb-4">
        <div
          className="h-20 w-full shrink-0"
          style={{ background: "var(--hero-gradient)" }}
        />
        <div className="relative flex px-5">
          <div className="profile-img">
            <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
              {user.firstName?.[0] ?? "?"}
            </span>
          </div>

          <div className="flex flex-col pt-14">
            <h1 className='profile-name' style={{ color: "var(--text-strong)" }}>
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-12 font-normal truncate" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <section className="banks">
        <div className="flex w-full justify-between items-center">
          <h2 className="text-16 font-semibold" style={{ color: "var(--text-strong)" }}>
            My Banks
          </h2>
          <Link href="/" className="flex gap-1.5 items-center">
            <Image
               src="/icons/plus.svg"
              width={16}
              height={16}
              alt="plus"
            />
            <span className="text-12 font-medium" style={{ color: "var(--accent)" }}>
              Add Bank
            </span>
          </Link>
        </div>

        {banks?.length > 0 && (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
            <div className='relative z-10'>
              <BankCard
                key={banks[0].$id}
                account={banks[0]}
                userName={`${user.firstName} ${user.lastName}`}
                showBalance={false}
              />
            </div>
            {banks[1] && (
              <div className="absolute right-0 top-8 z-0 w-[90%]">
                <BankCard
                  key={banks[1].$id}
                  account={banks[1]}
                  userName={`${user.firstName} ${user.lastName}`}
                  showBalance={false}
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-1 flex-col gap-4">
          <h2 className="text-16 font-semibold" style={{ color: "var(--text-strong)" }}>
            Top categories
          </h2>

          <div className='space-y-4'>
            {categories.map((category) => (
              <Category key={category.name} category={category} />
            ))}
          </div>
        </div>
      </section>
    </aside>
  )
}

export default RightSidebar

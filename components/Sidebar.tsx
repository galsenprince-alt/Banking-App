'use client'

import { sidebarLinks } from '@/constants'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Footer from './Footer'
import PlaidLink from './PlaidLink'

const Sidebar = ({ user }: SiderbarProps) => {
  const pathname = usePathname();

  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-1.5">
        <Link href="/" className="mb-8 cursor-pointer flex items-center gap-2">
          <Image
            src="/icons/logo.svg"
            width={38}
            height={38}
            alt="M$F Banking logo"
            className="size-[38px]"
          />
          <h1 className="sidebar-logo">
            M<span style={{ color: "var(--accent)" }}>$</span>F Banking
          </h1>
        </Link>

        {sidebarLinks.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`)

          return (
            <Link href={item.route} key={item.label}
              className={cn('sidebar-link', {
                'bg-bank-gradient': isActive,
              })}
              style={isActive ? undefined : undefined}
            >
              <div className="relative size-5">
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  fill
                  className={cn({
                    'brightness-[3] invert-0': isActive
                  })}
                />
              </div>
              <p className={cn("sidebar-label", { "!text-white": isActive })}>
                {item.label}
              </p>
            </Link>
          )
        })}

        <PlaidLink user={user} />
      </nav>

      <Footer user={user} />
    </section>
  )
}

export default Sidebar

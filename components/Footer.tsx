'use client'

import { logoutAccount } from '@/lib/actions/user.actions'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'

const Footer = ({ user, type = 'desktop' }: FooterProps) => {
  const router = useRouter();

  const handleLogOut = async () => {
    const loggedOut = await logoutAccount();

    if(loggedOut) router.push('/sign-in')
  }

  return (
    <footer className="footer">
      <div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
        <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
          {user?.firstName?.[0] ?? "?"}
        </p>
      </div>

      <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
          <h1 className="text-14 truncate font-semibold" style={{ color: "var(--text-strong)" }}>
            {user?.firstName}
          </h1>
          <p className="text-12 truncate font-normal" style={{ color: "var(--text-muted)" }}>
            {user?.email}
          </p>
      </div>

      <div className="footer_image cursor-pointer" onClick={handleLogOut}>
        <Image src="/icons/logout.svg" fill alt="logout" />
      </div>
    </footer>
  )
}

export default Footer

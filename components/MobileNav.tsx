'use client'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { sidebarLinks } from "@/constants"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Footer from "./Footer"

const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();

  return (
    <section className="w-full max-w-[264px]">
      <Sheet>
        <SheetTrigger>
          <Image
            src="/icons/hamburger.svg"
            width={28}
            height={28}
            alt="menu"
            className="cursor-pointer"
          />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="border-none p-0"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="px-5 pt-6 pb-4">
            <Link href="/" className="cursor-pointer flex items-center gap-2">
              <Image
                src="/icons/logo.svg"
                width={36}
                height={36}
                alt="M$F Banking logo"
              />
              <h1
                className="text-[18px] font-space-grotesk font-bold tracking-tight"
                style={{ color: "var(--text-strong)" }}
              >
                M<span style={{ color: "var(--accent)" }}>$</span>F Banking
              </h1>
            </Link>
          </div>
          <div className="flex h-[calc(100vh-80px)] flex-col justify-between overflow-y-auto px-3">
            <SheetClose asChild>
              <nav className="flex flex-col gap-1 pt-4">
                {sidebarLinks.map((item) => {
                  const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`)

                  return (
                    <SheetClose asChild key={item.route}>
                      <Link href={item.route} key={item.label}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl w-full transition-colors',
                          { 'bg-bank-gradient': isActive }
                        )}
                      >
                        <Image
                          src={item.imgURL}
                          alt={item.label}
                          width={20}
                          height={20}
                          className={cn({
                            'brightness-[3] invert-0': isActive
                          })}
                        />
                        <p
                          className={cn("text-14 font-medium", {
                            "text-white": isActive,
                          })}
                          style={isActive ? undefined : { color: "var(--text-soft)" }}
                        >
                          {item.label}
                        </p>
                      </Link>
                    </SheetClose>
                  )
                })}
              </nav>
            </SheetClose>

            <div className="px-1 pb-4">
              <Footer user={user} type="mobile" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}

export default MobileNav

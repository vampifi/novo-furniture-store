"use client"

import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  const navItems = [
    {
      href: "/account",
      label: "Overview",
      testId: "overview-link",
    },
    {
      href: "/account/profile",
      label: "Profile",
      testId: "profile-link",
    },
    {
      href: "/account/addresses",
      label: "Addresses",
      testId: "addresses-link",
    },
    {
      href: "/account/orders",
      label: "Orders",
      testId: "orders-link",
    },
  ] as const

  return (
    <div className="flex flex-col gap-5 text-sm text-[#3f3a36]">
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== `/${countryCode}/account` ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-2 text-[#3f3a36]"
            data-testid="account-main-link"
          >
            <ChevronDown
              aria-hidden
              size={20}
              className="rotate-90 text-[#3f3a36]"
            />
            <span>Back to account</span>
          </LocalizedClientLink>
        ) : (
          <div className="rounded-xl border border-primary/15 bg-white shadow-sm">
            <div className="space-y-2 px-4 py-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-[#90857f]">
                Account
              </p>
              <div className="text-base font-semibold text-[#3f3a36]">
                Hello {customer?.first_name}
              </div>
              <p className="text-xs text-[#6f6660]">
                Pick a section below to review your details.
              </p>
            </div>
            <ul className="border-t border-primary/10">
              {navItems.map((item) => {
                const active = route.split(countryCode)[1] === item.href
                return (
                  <li key={item.href}>
                    <LocalizedClientLink
                      href={item.href}
                      className={clx(
                        "flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition hover:bg-primary/5",
                        {
                          "bg-primary/10 text-primary": active,
                        }
                      )}
                      data-testid={item.testId}
                      aria-current={active ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        aria-hidden
                        size={18}
                        className="-rotate-90 text-inherit"
                      />
                    </LocalizedClientLink>
                  </li>
                )
              })}
              <li>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-4 py-3 text-primary transition hover:bg-primary/5"
                  onClick={handleLogout}
                  data-testid="logout-button"
                >
                  <span>Log out</span>
                  <ArrowRightOnRectangle className="h-4 w-4" />
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
      <div
        className="hidden small:flex small:flex-col small:gap-6"
        data-testid="account-nav"
      >
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#90857f]">
            Account
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#3f3a36]">
            Hello {customer?.first_name}
          </h3>
          <p className="mt-1 text-xs text-[#7b6f68]">
            Quick links to keep your information current.
          </p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-white p-4 shadow-sm">
          <ul className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <li key={item.href}>
                <AccountNavLink
                  href={item.href}
                  route={route!}
                  data-testid={item.testId}
                >
                  {item.label}
                </AccountNavLink>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
          data-testid="logout-button"
        >
          <ArrowRightOnRectangle className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-[#524a45] transition hover:bg-primary/5 hover:text-primary",
        {
          "border-primary/20 bg-primary/5 text-primary": active,
        }
      )}
      data-testid={dataTestId}
      aria-current={active ? "page" : undefined}
    >
      <span>{children}</span>
      <ChevronDown
        aria-hidden
        size={18}
        className={clx("-rotate-90 text-[#b1a6a0]", {
          "text-primary": active,
        })}
      />
    </LocalizedClientLink>
  )
}

export default AccountNav

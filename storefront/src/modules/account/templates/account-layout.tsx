import React from "react"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  if (!customer) {
    return (
      <div className="flex-1" data-testid="account-page">
        {children}
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background py-8 small:py-16" data-testid="account-page">
      <div className="content-container mx-auto w-full max-w-5xl px-4 small:px-6">
        <div className="grid grid-cols-1 gap-6 rounded-xl border border-primary/15 bg-white px-4 py-6 shadow-sm small:grid-cols-[230px_1fr] small:gap-12 small:px-10 small:py-12 small:shadow-md">
          <div className="small:border-r small:border-primary/10 small:pr-6">
            {customer && <AccountNav customer={customer} />}
          </div>
          <div className="small:pl-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout

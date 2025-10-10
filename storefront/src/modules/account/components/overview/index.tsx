import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  const profileCompletion = getProfileCompletion(customer)
  const addressesCount = customer?.addresses?.length || 0

  return (
    <div data-testid="overview-page-wrapper" className="flex flex-col gap-6">
      <section className="rounded-xl border border-primary/15 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 small:flex-row small:items-center small:justify-between small:gap-6">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[#90857f]">
              Account overview
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#3f3a36]">
              <span
                data-testid="welcome-message"
                data-value={customer?.first_name}
              >
                Hello {customer?.first_name}
              </span>
            </h1>
            <p className="mt-2 text-sm text-[#6f6660]">
              Keep an eye on your profile details and recent activity here.
            </p>
          </div>
          <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-[#3f3a36]">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[#90857f]">
              Signed in as
            </p>
            <span
              className="mt-1 block font-medium"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 small:grid-cols-2">
        <div className="rounded-xl border border-primary/15 bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#90857f]">
              Profile completion
            </p>
            <h3 className="text-base font-semibold text-[#3f3a36]">
              Basics up to date
            </h3>
            <p className="text-xs text-[#7b6f68]">
              Keep your details current for faster checkout and tailored updates.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span
              className="text-3xl font-semibold text-[#3f3a36]"
              data-testid="customer-profile-completion"
              data-value={profileCompletion}
            >
              {profileCompletion}%
            </span>
            <LocalizedClientLink
              href="/account/profile"
              className="text-xs font-medium text-primary"
            >
              Edit profile
            </LocalizedClientLink>
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#90857f]">
              Saved addresses
            </p>
            <h3 className="text-base font-semibold text-[#3f3a36]">
              Delivery made easy
            </h3>
            <p className="text-xs text-[#7b6f68]">
              Store frequently used locations for smooth deliveries every time.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span
              className="text-3xl font-semibold text-[#3f3a36]"
              data-testid="addresses-count"
              data-value={addressesCount}
            >
              {addressesCount}
            </span>
            <LocalizedClientLink
              href="/account/addresses"
              className="text-xs font-medium text-primary"
            >
              Manage addresses
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-primary/15 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 small:flex-row small:items-center small:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#90857f]">
              Recent orders
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#3f3a36]">
              Latest purchases at a glance
            </h3>
          </div>
          <LocalizedClientLink
            href="/account/orders"
            className="text-xs font-medium text-primary"
          >
            View all orders
          </LocalizedClientLink>
        </div>
        <ul className="mt-5 flex flex-col gap-3" data-testid="orders-wrapper">
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => {
              return (
                <li
                  key={order.id}
                  data-testid="order-wrapper"
                  data-value={order.id}
                >
                  <LocalizedClientLink
                    href={`/account/orders/details/${order.id}`}
                    className="flex items-center justify-between rounded-lg border border-primary/15 px-4 py-3 text-sm text-[#534c46] transition hover:bg-primary/5"
                  >
                    <div className="flex w-full flex-col gap-2 small:grid small:grid-cols-3 small:gap-y-0 small:gap-x-6">
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-[0.28em] text-[#90857f]">
                          Placed
                        </p>
                        <span
                          className="mt-1 block font-medium text-[#3f3a36]"
                          data-testid="order-created-date"
                        >
                          {new Date(order.created_at).toDateString()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-[0.28em] text-[#90857f]">
                          Order
                        </p>
                        <span
                          className="mt-1 block text-[#6f6660]"
                          data-testid="order-id"
                          data-value={order.display_id}
                        >
                          #{order.display_id}
                        </span>
                      </div>
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-[0.28em] text-[#90857f]">
                          Total
                        </p>
                        <span
                          className="mt-1 block font-medium text-[#3f3a36]"
                          data-testid="order-amount"
                        >
                          {convertToLocale({
                            amount: order.total,
                            currency_code: order.currency_code,
                          })}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      aria-hidden
                      size={18}
                      className="-rotate-90 text-primary"
                    />
                  </LocalizedClientLink>
                </li>
              )
            })
          ) : (
            <span
              className="rounded-md border border-dashed border-primary/30 px-4 py-6 text-center text-sm text-[#7b6f68]"
              data-testid="no-orders-message"
            >
              No recent orders
            </span>
          )}
        </ul>
      </section>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Item from "@modules/order/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LineItemPrice from "@modules/common/components/line-item-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemsProps = {
  items: HttpTypes.StoreCartLineItem[] | HttpTypes.StoreOrderLineItem[] | null
}

const Items = ({ items }: ItemsProps) => {
  const sortedItems =
    items
      ?.slice()
      .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1)) ?? []

  if (!sortedItems.length) {
    return <ItemsSkeleton />
  }

  return (
    <div className="flex flex-col gap-6" data-testid="products-list">
      <div className="flex flex-col gap-4 lg:hidden">
        {sortedItems.map((item) => (
          <MobileOrderItem key={item.id} item={item} />
        ))}
      </div>

      <div className="hidden lg:block">
        <Divider className="!mb-0" />
        <Table>
          <Table.Body data-testid="products-table">
            {sortedItems.map((item) => (
              <Item key={item.id} item={item} />
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

const MobileOrderItem = ({
  item,
}: {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
}) => {
  const thumbnail =
    item.thumbnail ||
    item.variant?.product?.thumbnail ||
    item.variant?.product?.images?.[0]?.url ||
    undefined

  return (
    <article
      className="flex flex-col gap-4 rounded-3xl border border-[#F0E6DD] bg-white p-4 shadow-[0_12px_40px_rgba(34,28,24,0.05)] sm:flex-row sm:items-center sm:gap-6"
      data-testid="product-card"
    >
      <div className="flex gap-4 sm:flex-1 sm:gap-5">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F8F3EE]">
          <Thumbnail
            thumbnail={thumbnail}
            images={item.variant?.product?.images}
            size="square"
            className="!w-20 !p-2 rounded-xl bg-transparent shadow-none"
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <Text className="text-base font-semibold uppercase tracking-[0.12em] text-[#3b2f2f] sm:text-lg">
            {item.title}
          </Text>

          {item.variant && (
            <div className="text-sm text-[#6b5b5b]">
              <LineItemOptions variant={item.variant} data-testid="product-variant" />
            </div>
          )}

          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8c7b6f]">
            Quantity:{" "}
            <span className="text-[#3b2f2f]" data-testid="product-quantity">
              {item.quantity}
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-end justify-between gap-4 border-t border-[#F0E6DD] pt-4 sm:w-auto sm:flex-col sm:items-end sm:border-none sm:pt-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8c7b6f]">
          Unit price
          <div className="text-sm font-normal normal-case tracking-normal text-[#3b2f2f]">
            <LineItemUnitPrice item={item} style="tight" />
          </div>
        </div>

        <div className="text-right">
          <LineItemPrice item={item} style="tight" />
        </div>
      </div>
    </article>
  )
}

const MobileOrderItemSkeleton = () => (
  <div className="flex flex-col gap-4 rounded-3xl border border-[#F0E6DD] bg-white p-4 shadow-[0_12px_40px_rgba(34,28,24,0.05)] sm:flex-row sm:items-center sm:gap-6">
    <div className="flex gap-4 sm:flex-1 sm:gap-5">
      <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F8F3EE]">
        <div className="h-16 w-16 rounded-xl bg-[#E2D6CB] animate-pulse" />
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-4 w-40 rounded-full bg-[#E8DCD2] animate-pulse" />
        <div className="h-3 w-32 rounded-full bg-[#E8DCD2] animate-pulse" />
        <div className="h-3 w-24 rounded-full bg-[#F0E6DD] animate-pulse" />
      </div>
    </div>
    <div className="flex w-full items-end justify-between gap-4 border-t border-[#F0E6DD] pt-4 sm:w-auto sm:flex-col sm:items-end sm:border-none sm:pt-0">
      <div className="h-4 w-28 rounded-full bg-[#E8DCD2] animate-pulse" />
      <div className="h-6 w-16 rounded-full bg-[#DCCEC2] animate-pulse" />
    </div>
  </div>
)

const ItemsSkeleton = () => (
  <div className="flex flex-col gap-6" data-testid="products-loading">
    <div className="flex flex-col gap-4 lg:hidden">
      {repeat(3).map((i) => (
        <MobileOrderItemSkeleton key={`mobile-skeleton-${i}`} />
      ))}
    </div>

    <div className="hidden lg:block">
      <Divider className="!mb-0" />
      <Table>
        <Table.Body>
          {repeat(5).map((i) => (
            <SkeletonLineItem key={`desktop-skeleton-${i}`} />
          ))}
        </Table.Body>
      </Table>
    </div>
  </div>
)

export const OrderItemsSkeleton = ItemsSkeleton

export default Items

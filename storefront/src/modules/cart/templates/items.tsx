import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import MobileItem from "@modules/cart/components/item/mobile"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  items?: HttpTypes.StoreCartLineItem[]
}

const ItemsTemplate = ({ items }: ItemsTemplateProps) => {
  return (
    <div className="w-full rounded-[32px] border border-[#E8DCD2] bg-white/95 px-4 py-6 shadow-[0px_24px_48px_rgba(68,59,51,0.08)] sm:px-8 sm:py-8">
      <div className="flex flex-col gap-2 border-b border-[#EDE1D8] pb-4">
        <span className="uppercase text-[11px] font-semibold tracking-[0.28em] text-[#B7A598]">
          Items
        </span>
        <Heading className="text-[24px] leading-[32px] font-semibold text-[#221C18]">
          Shopping bag
        </Heading>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:hidden">
        {items
          ? items
              .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
              .map((item) => <MobileItem key={item.id} item={item} />)
          : repeat(3).map((i) => (
              <div
                key={`mobile-skeleton-${i}`}
                className="flex flex-col gap-4 rounded-2xl border border-[#EDE1D8] bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="h-20 w-20 rounded-2xl bg-gray-200/80 animate-pulse" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-2/3 rounded bg-gray-200/80 animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-gray-200/70 animate-pulse" />
                  </div>
                </div>
                <div className="h-10 rounded-lg bg-gray-200/60 animate-pulse" />
                <div className="h-10 rounded-lg bg-gray-200/60 animate-pulse" />
              </div>
            ))}
      </div>

      <div className="mt-4 hidden -mx-2 overflow-x-auto sm:mx-0 sm:block">
        <Table className="min-w-[540px] sm:min-w-0">
          <Table.Header className="border-t-0">
            <Table.Row className="uppercase tracking-[0.24em] text-[10px] text-[#8C7B6F]">
              <Table.HeaderCell className="!pl-0">Item</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell>Quantity</Table.HeaderCell>
              <Table.HeaderCell className="hidden small:table-cell">
                Price
              </Table.HeaderCell>
              <Table.HeaderCell className="!pr-0 text-right">
                Total
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="items-table">
            {items
              ? items
                  .sort((a, b) => {
                    return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                  })
                  .map((item) => {
                    return <Item key={item.id} item={item} />
                  })
              : repeat(5).map((i) => {
                  return <SkeletonLineItem key={i} />
                })}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export default ItemsTemplate

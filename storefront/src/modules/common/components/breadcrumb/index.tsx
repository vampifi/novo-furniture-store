import LocalizedClientLink from "@modules/common/components/localized-client-link"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

export type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  if (!items?.length) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={cx("text-xs sm:text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-[#8C7C71]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const content = item.href && !isLast ? (
            <LocalizedClientLink
              href={item.href}
              className="transition-colors hover:text-[#4C4038]"
            >
              {item.label}
            </LocalizedClientLink>
          ) : (
            <span className={cx("truncate", isLast && "text-[#3F3A36] font-medium")}>{
              item.label
            }</span>
          )

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {content}
              {!isLast && <span className="text-[#C2B4A9]">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb

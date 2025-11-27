import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { StorefrontBlogPost } from "@lib/data/blog"

const formatDate = (value?: string | null) => {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

type BlogCardProps = {
  post: StorefrontBlogPost
  href: string
  className?: string
}

const BlogCard = ({ post, href, className }: BlogCardProps) => {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-ui-border-base bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${className ?? ""}`}
    >
      {post.cover_image ? (
        <LocalizedClientLink href={href} className="relative block h-60 w-full overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        </LocalizedClientLink>
      ) : (
        <div className="h-60 w-full bg-ui-bg-muted" />
      )}

      <div className="flex flex-1 flex-col gap-3 px-6 pb-6 pt-5">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.32em] text-ui-fg-subtle">
          {post.tags?.slice(0, 3).map((tag) => (
            <span key={`${post.id}-${tag}`} className="rounded-full bg-ui-bg-subtle px-3 py-1 text-[0.6rem] tracking-[0.25em] text-ui-fg-subtle">
              {tag}
            </span>
          ))}
          {post.published_at && (
            <span className="text-[0.6rem] tracking-[0.35em] text-ui-fg-muted">
              {formatDate(post.published_at)}
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold leading-tight text-[#2d221c]">
          <LocalizedClientLink href={href} className="hover:text-primary">
            {post.title}
          </LocalizedClientLink>
        </h3>

        {post.excerpt && (
          <p className="text-sm leading-relaxed text-[#5b4a4a] line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs uppercase tracking-[0.28em] text-ui-fg-muted">
          <span>{post.author_name ?? "Editorial"}</span>
          {post.reading_time_minutes && (
            <span>{post.reading_time_minutes} min read</span>
          )}
        </div>
      </div>
    </article>
  )
}

export default BlogCard

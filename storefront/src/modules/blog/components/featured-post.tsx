import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { StorefrontBlogPost } from "@lib/data/blog"

const FeaturedPost = ({
  post,
  href,
}: {
  post: StorefrontBlogPost
  href: string
}) => {
  return (
    <article className="relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl bg-[#f6efe9] shadow-lg md:flex-row">
      <div className="relative h-64 w-full overflow-hidden md:h-auto md:flex-1">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition duration-700 ease-out hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-ui-bg-muted" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-transparent md:hidden" />
        <div className="absolute left-6 top-6 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#3b2f2f]">
          Featured
        </div>
        {post.published_at && (
          <div className="absolute right-6 top-6 rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.35em] text-[#3b2f2f]">
            {new Date(post.published_at).toLocaleDateString("en-GB", {
              month: "short",
              day: "numeric",
            })}
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-4 px-8 py-10 md:px-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b5b]">
            {post.tags?.slice(0, 2).join(" · ") || "Editorial"}
          </p>
          <h2 className="text-3xl font-semibold text-[#2d221c] md:text-4xl">
            {post.title}
          </h2>
        </div>

        {post.excerpt && (
          <p className="text-base leading-relaxed text-[#5b4a4a] md:text-lg">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#6b5b5b]">
          <span>{post.author_name ?? "Editorial Team"}</span>
          {post.reading_time_minutes && (
            <span>{post.reading_time_minutes} min read</span>
          )}
        </div>

        <LocalizedClientLink
          href={href}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow hover:bg-primary/90"
        >
          Read article
        </LocalizedClientLink>
      </div>
    </article>
  )
}

export default FeaturedPost

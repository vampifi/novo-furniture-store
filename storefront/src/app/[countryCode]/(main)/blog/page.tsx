import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getPublishedPosts } from "@lib/data/blog"
import BlogCard from "@modules/blog/components/blog-card"
import FeaturedPost from "@modules/blog/components/featured-post"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Inspiration & guides | Novo Furniture Blog",
  description:
    "Design notes, styling tips, and material know-how from the Novo Furniture editorial team.",
}

type BlogPageProps = {
  params: { countryCode: string }
}

const BlogListing = async ({ params: { countryCode } }: BlogPageProps) => {
  const { posts } = await getPublishedPosts({ limit: 12 })

  if (!posts.length) {
    return notFound()
  }

  const [featured, ...rest] = posts

  const buildHref = (slug: string) => `/blog/${slug}`

  const secondaryPosts = rest.slice(0, 2)
  const remainingPosts = rest.slice(2)

  return (
    <section className="bg-[#f8f3ee]/80 pb-12 pt-6 sm:py-10">
      <div className="content-container space-y-10">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-[#6b5b5b]">
            STORIES & GUIDES
          </p>
          <h1 className="text-4xl font-semibold text-[#2d221c] md:text-5xl">
            The Novo Journal
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[#5b4a4a] md:text-lg">
            Design notes from Novo stylists, makers, and sourcing partners to help you craft rooms
            with warmth, story, and staying power.
          </p>
        </div>

        <FeaturedPost post={featured} href={buildHref(featured.slug)} />

        {secondaryPosts.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {secondaryPosts.map((post) => (
              <BlogCard key={post.id} post={post} href={buildHref(post.slug)} />
            ))}
          </div>
        )}

        {remainingPosts.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#2d221c]">
                Latest articles
              </h2>
              <LocalizedClientLink
                href={`/search?query=blog`}
                className="text-sm font-semibold uppercase tracking-[0.35em] text-primary hover:text-primary/80"
              >
                Browse more
              </LocalizedClientLink>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {remainingPosts.map((post) => (
                <BlogCard key={post.id} post={post} href={buildHref(post.slug)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const BlogPage = (props: BlogPageProps) => (
  <Suspense fallback={<div className="content-container py-20 text-center text-sm text-ui-fg-muted">Loading articles…</div>}>
    <BlogListing {...props} />
  </Suspense>
)

export default BlogPage

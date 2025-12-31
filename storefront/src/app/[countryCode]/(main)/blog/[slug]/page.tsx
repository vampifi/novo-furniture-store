import { Metadata } from "next"
import Script from "next/script"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getPostBySlug, getPublishedPosts } from "@lib/data/blog"
import ArticleContent from "@modules/blog/components/article-content"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { resolveMediaUrl } from "@lib/util/media"

type PageProps = {
  params: { slug: string; countryCode: string }
}

export async function generateStaticParams() {
  const { posts } = await getPublishedPosts({ limit: 20 })
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params: { slug },
}: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Article not found",
    }
  }

  const title = post.meta_title ?? `${post.title} | Novo Journal`
  const description = post.meta_description ?? post.excerpt ?? undefined
  const ogImage = resolveMediaUrl(post.og_image ?? post.cover_image ?? undefined)

  return {
    title,
    description,
    alternates: post.canonical_url
      ? {
          canonical: post.canonical_url,
        }
      : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      url: post.canonical_url ?? undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

const BlogArticle = async ({ params: { slug, countryCode } }: PageProps) => {
  const post = await getPostBySlug(slug)

  if (!post) {
    return notFound()
  }

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null
  const ogImage = resolveMediaUrl(post.og_image ?? post.cover_image ?? undefined) ?? null
  const canonical = post.canonical_url ?? undefined
  const updatedIso = post.updated_at ?? post.published_at ?? undefined
  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: updatedIso,
    author: {
      "@type": "Person",
      name: post.author_name ?? "Editorial Team",
    },
    mainEntityOfPage: canonical ?? `/blog/${post.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Novo Furniture",
    },
  }

  if (ogImage) {
    structuredData.image = [ogImage]
  }

  if (canonical) {
    structuredData.url = canonical
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonical ?? `/blog/${post.slug}`,
      },
    ],
  }

  return (
    <article className="bg-[#f8f3ee]/80 py-8 sm:py-12">
      <div className="content-container space-y-8 md:space-y-12">
        <div className="space-y-3 text-center">
          <LocalizedClientLink
            href={`/blog`}
            className="text-xs font-semibold uppercase tracking-[0.35em] text-primary"
          >
            Back to articles
          </LocalizedClientLink>
          <h1 className="text-4xl font-semibold text-[#2d221c] md:text-5xl">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.28em] text-[#6b5b5b]">
            <span>{post.author_name ?? "Editorial Team"}</span>
            {publishedDate && (
              <>
                <span className="h-1 w-1 rounded-full bg-[#c2b6af]" aria-hidden />
                <span>{publishedDate}</span>
              </>
            )}
            {post.reading_time_minutes && (
              <>
                <span className="h-1 w-1 rounded-full bg-[#c2b6af]" aria-hidden />
                <span>{post.reading_time_minutes} min read</span>
              </>
            )}
          </div>
          {post.tags && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {post.tags.map((tag) => (
                <span
                  key={`${post.id}-${tag}`}
                  className="rounded-full bg-white px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-[#8d7a73]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {resolveMediaUrl(post.cover_image) && (
          <div className="overflow-hidden rounded-[32px] shadow-xl">
            <img
              src={resolveMediaUrl(post.cover_image)}
              alt={post.title}
              className="h-[420px] w-full object-cover md:h-[520px]"
            />
          </div>
        )}

        <div className="mx-auto max-w-4xl rounded-[32px] border border-[#e5d8cf] bg-white px-6 py-10 md:px-12 md:py-14">
          {post.content ? (
            <ArticleContent content={post.content} />
          ) : (
            <p className="text-[#5b4a4a]">This article is being crafted.</p>
          )}
        </div>
      </div>
      <Script id={`article-json-ld-${post.id}`} type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>
      <Script id={`breadcrumb-json-ld-${post.id}`} type="application/ld+json">
        {JSON.stringify(breadcrumbJsonLd)}
      </Script>
    </article>
  )
}

const BlogArticlePage = (props: PageProps) => (
  <Suspense
    fallback={
      <div className="content-container py-20 text-center text-sm text-ui-fg-muted">
        Loading article…
      </div>
    }
  >
    {/* @ts-expect-error Async Server Component */}
    <BlogArticle {...props} />
  </Suspense>
)

export default BlogArticlePage

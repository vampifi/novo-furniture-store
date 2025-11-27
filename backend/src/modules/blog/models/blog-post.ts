import { model } from "@medusajs/framework/utils"

export const BLOG_POST_STATUS = ["draft", "published"] as const

export const BlogPost = model
  .define("blog_post", {
    id: model.id({ prefix: "bpost" }).primaryKey(),
    title: model.text(),
    slug: model.text().searchable(),
    excerpt: model.text().nullable(),
    cover_image: model.text().nullable(),
    author_name: model.text().nullable(),
    content: model.text(),
    status: model.enum(BLOG_POST_STATUS).default("draft"),
    published_at: model.dateTime().nullable(),
    is_featured: model.boolean().default(false),
    reading_time_minutes: model.number().nullable(),
    meta_title: model.text().nullable(),
    meta_description: model.text().nullable(),
    canonical_url: model.text().nullable(),
    og_image: model.text().nullable(),
    tags: model.json().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_blog_post_slug",
      unique: true,
      on: ["slug"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_blog_post_status",
      on: ["status"],
    },
    {
      name: "IDX_blog_post_published_at",
      on: ["published_at"],
    },
  ])

export type BlogPostStatus = (typeof BLOG_POST_STATUS)[number]

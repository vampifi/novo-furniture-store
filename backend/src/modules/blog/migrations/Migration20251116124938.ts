import { Migration } from '@mikro-orm/migrations';

export class Migration20251116124938 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "blog_post" ("id" text not null, "title" text not null, "slug" text not null, "excerpt" text null, "cover_image" text null, "author_name" text null, "content" text not null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "published_at" timestamptz null, "is_featured" boolean not null default false, "reading_time_minutes" integer null, "meta_title" text null, "meta_description" text null, "canonical_url" text null, "og_image" text null, "tags" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_deleted_at" ON "blog_post" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_blog_post_slug" ON "blog_post" (slug) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_status" ON "blog_post" (status) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_published_at" ON "blog_post" (published_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "blog_post" cascade;`);
  }

}

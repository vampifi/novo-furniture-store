'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BookOpen } from "@medusajs/icons"
import {
  Badge,
  Button,
  Heading,
  Input,
  Switch,
  Textarea,
  toast,
} from "@medusajs/ui"

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  cover_image?: string | null
  author_name?: string | null
  status: "draft" | "published"
  published_at?: string | null
  is_featured?: boolean
  tags?: string[] | null
  reading_time_minutes?: number | null
  updated_at?: string
  meta_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  og_image?: string | null
}

type AdminResponse<T> = {
  posts?: T[]
  post?: T
  count?: number
  offset?: number
  limit?: number
}

type BlogFormState = {
  id?: string
  title: string
  slug: string
  excerpt: string
  cover_image: string
  author_name: string
  content: string
  status: "draft" | "published"
  is_featured: boolean
  tags: string
  meta_title: string
  meta_description: string
  canonical_url: string
  og_image: string
}

const blankForm: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  cover_image: "",
  author_name: "",
  content: "",
  status: "draft",
  is_featured: false,
  tags: "",
  meta_title: "",
  meta_description: "",
  canonical_url: "",
  og_image: "",
}

const request = async <T,>(path: string, init?: RequestInit) => {
  const res = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    const message = payload?.message || `Request failed (${res.status})`
    throw new Error(message)
  }

  return (res.status === 204 ? null : ((await res.json()) as T)) as T
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "—"
  }
}

type BlogPostDetail = BlogPost & {
  content?: string | null
}

const slugifyPreview = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

type FormatActionId =
  | "bold"
  | "italic"
  | "heading"
  | "quote"
  | "bullet"
  | "numbered"
  | "link"
  | "code"
  | "divider"

const formatActions: {
  id: FormatActionId
  label: string
  tooltip: string
}[] = [
  { id: "heading", label: "H2", tooltip: "Insert section heading" },
  { id: "bold", label: "B", tooltip: "Bold" },
  { id: "italic", label: "I", tooltip: "Italic" },
  { id: "quote", label: "“”", tooltip: "Quote block" },
  { id: "bullet", label: "•", tooltip: "Bulleted list" },
  { id: "numbered", label: "1.", tooltip: "Numbered list" },
  { id: "link", label: "🔗", tooltip: "Insert link" },
  { id: "code", label: "{ }", tooltip: "Code snippet" },
  { id: "divider", label: "—", tooltip: "Divider" },
]

const asSinglePost = (value?: BlogPost | BlogPost[] | null) => {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? value[0] ?? null : value
}

const BlogAdminRoute = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<BlogFormState>(blankForm)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingField, setUploadingField] = useState<"cover_image" | "og_image" | null>(
    null
  )
  const [fileTargetField, setFileTargetField] = useState<"cover_image" | "og_image" | null>(
    null
  )
  const [listDrafts, setListDrafts] = useState({
    bullet: "",
    numbered: "",
  })
  const slugPreview = useMemo(() => {
    const explicitSlug = form.slug.trim()
    if (explicitSlug.length) {
      return explicitSlug
    }

    const fromTitle = form.title.trim()
    return fromTitle.length ? slugifyPreview(fromTitle) : ""
  }, [form.slug, form.title])

  const loadPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await request<AdminResponse<BlogPost>>(
        `/admin/blog-posts?ts=${Date.now()}`
      )
      setPosts(data.posts ?? [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load blog posts."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleInputChange = (
    key: keyof BlogFormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleListDraftChange = (
    type: "bullet" | "numbered",
    value: string
  ) => {
    setListDrafts((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  const handleFileSelection = (field: "cover_image" | "og_image") => {
    setFileTargetField(field)
    fileInputRef.current?.click()
  }

  const uploadSelectedFile = async (file: File, field: "cover_image" | "og_image") => {
    setUploadingField(field)
    try {
      const formData = new FormData()
      formData.append("files", file)

      const res = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.message || `Upload failed (${res.status})`)
      }

      const payload = (await res.json().catch(() => ({}))) as { files?: { url?: string }[] }
      const url = payload?.files?.[0]?.url

      if (!url) {
        throw new Error("Upload succeeded but no URL was returned.")
      }

      handleInputChange(field, url)
      toast.success("Image uploaded.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      toast.error(message)
    } finally {
      setUploadingField(null)
      setFileTargetField(null)
    }
  }

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const target = fileTargetField

    // reset so selecting same file twice still triggers change
    event.target.value = ""

    if (!file || !target) {
      return
    }

    await uploadSelectedFile(file, target)
  }

  const handleInsertList = (type: "bullet" | "numbered") => {
    const raw = listDrafts[type]
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    if (!lines.length) {
      toast.warning("Add at least one item before inserting the list.")
      return
    }

    mutateContent((value, selection) => {
      const before = value.slice(0, selection.start)
      const after = value.slice(selection.end)
      const prefix = before.endsWith("\n") || before.length === 0 ? "" : "\n\n"
      const formatted = lines
        .map((line, index) =>
          type === "bullet" ? `- ${line}` : `${index + 1}. ${line}`
        )
        .join("\n")
      const block = `${prefix}${formatted}\n\n`
      const nextValue = `${before}${block}${after}`
      const caret = before.length + block.length

      return {
        value: nextValue,
        selection: { start: caret, end: caret },
      }
    })

    setListDrafts((prev) => ({
      ...prev,
      [type]: "",
    }))
  }

  const mutateContent = (
    mutate: (
      value: string,
      selection: { start: number; end: number }
    ) => { value: string; selection?: { start: number; end: number } }
  ) => {
    const textarea = contentRef.current
    if (!textarea) {
      return
    }

    const selection = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    }
    const payload = mutate(form.content, selection)
    setForm((prev) => ({
      ...prev,
      content: payload.value,
    }))

    if (payload.selection) {
      requestAnimationFrame(() => {
        const node = contentRef.current
        if (!node) {
          return
        }
        node.focus()
        node.setSelectionRange(payload.selection!.start, payload.selection!.end)
      })
    }
  }

  const handleFormatAction = (id: FormatActionId) => {
    mutateContent((value, selection) => {
      const before = value.slice(0, selection.start)
      const after = value.slice(selection.end)
      const selected =
        selection.start === selection.end
          ? ""
          : value.slice(selection.start, selection.end)

      const wrapSelection = (
        prefix: string,
        suffix: string,
        placeholder: string
      ) => {
        const content = selected || placeholder
        const nextValue = `${before}${prefix}${content}${suffix}${after}`
        const start = before.length + prefix.length
        const end = start + content.length
        return { value: nextValue, selection: { start, end } }
      }

      switch (id) {
        case "bold":
          return wrapSelection("**", "**", "Bold text")
        case "italic":
          return wrapSelection("_", "_", "Italic text")
        case "heading": {
          const content = selected || "Section title"
          const prefix = before.endsWith("\n") || before.length === 0 ? "" : "\n\n"
          const block = `${prefix}## ${content}\n\n`
          const start = before.length + prefix.length + 3
          return {
            value: `${before}${block}${after}`,
            selection: {
              start,
              end: start + content.length,
            },
          }
        }
        case "quote": {
          const content = selected || "Quoted insight"
          const prefix = before.endsWith("\n") || before.length === 0 ? "" : "\n\n"
          const quote = content
            .split("\n")
            .map((line) => `> ${line.trim()}`)
            .join("\n")
          const insertion = `${prefix}${quote}\n\n`
          const start = before.length + prefix.length + 2
          return {
            value: `${before}${insertion}${after}`,
            selection: { start, end: start + content.length },
          }
        }
        case "bullet": {
          const content = selected || "List item"
          const prefix = before.endsWith("\n") || before.length === 0 ? "" : "\n"
          const lines = content.split("\n").map((line) =>
            line.startsWith("- ") ? line : `- ${line.trim().length ? line.trim() : "List item"}`
          )
          const formatted = lines.join("\n")
          const insertion = `${prefix}${formatted}\n`
          const start = before.length + prefix.length + 2
          return {
            value: `${before}${insertion}${after}`,
            selection: { start, end: start + formatted.length },
          }
        }
        case "numbered": {
          const content = selected || "First step"
          const prefix = before.endsWith("\n") || before.length === 0 ? "" : "\n"
          const lines = content.split("\n").map((line, index) => {
            const clean = line.replace(/^\d+\.\s*/, "").trim()
            return `${index + 1}. ${clean.length ? clean : "List item"}`
          })
          const formatted = lines.join("\n")
          const insertion = `${prefix}${formatted}\n`
          const start = before.length + prefix.length + 3
          return {
            value: `${before}${insertion}${after}`,
            selection: { start, end: start + formatted.length },
          }
        }
        case "link": {
          const content = selected || "Link text"
          const placeholder = "https://"
          const nextValue = `${before}[${content}](${placeholder})${after}`
          const start = before.length + content.length + 3
          return {
            value: nextValue,
            selection: {
              start,
              end: start + placeholder.length,
            },
          }
        }
        case "code": {
          const content = selected || "const example = true"
          const snippet = `\n\n\`\`\`\n${content}\n\`\`\`\n\n`
          const start = before.length + 5
          return {
            value: `${before}${snippet}${after}`,
            selection: { start, end: start + content.length },
          }
        }
        case "divider": {
          const divider = `\n\n---\n\n`
          return {
            value: `${before}${divider}${after}`,
            selection: {
              start: before.length + divider.length,
              end: before.length + divider.length,
            },
          }
        }
        default:
          return { value, selection }
      }
    })
  }

  const handleEdit = async (post: BlogPost) => {
    try {
      const response = await request<{ post: BlogPostDetail }>(
        `/admin/blog-posts/${post.id}`
      )
      const record = asSinglePost(response.post)

      if (!record) {
        throw new Error("Unable to load this article.")
      }
      setForm({
        id: record.id,
        title: record.title,
        slug: record.slug,
        excerpt: record.excerpt ?? "",
        cover_image: record.cover_image ?? "",
        author_name: record.author_name ?? "",
        content: record.content ?? "",
        status: record.status,
        is_featured: Boolean(record.is_featured),
        tags: (record.tags ?? []).join(", "),
        meta_title: record.meta_title ?? "",
        meta_description: record.meta_description ?? "",
        canonical_url: record.canonical_url ?? "",
        og_image: record.og_image ?? "",
      })
      setFormMode("edit")
      setFormOpen(true)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to load article details."
      )
    }
  }

  const resetForm = () => {
    setForm(blankForm)
    setFormMode("create")
    setFormOpen(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt.trim() || undefined,
        cover_image: form.cover_image.trim() || undefined,
        author_name: form.author_name.trim() || undefined,
        content: form.content.trim(),
        status: form.status,
        is_featured: form.is_featured,
        meta_title: form.meta_title.trim() || undefined,
        meta_description: form.meta_description.trim() || undefined,
        canonical_url: form.canonical_url.trim() || undefined,
        og_image: form.og_image.trim() || undefined,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : undefined,
      }

      if (!payload.content?.length) {
        throw new Error("Content is required.")
      }

      if (formMode === "create") {
        await request("/admin/blog-posts", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Blog post created")
      } else if (form.id) {
        await request(`/admin/blog-posts/${form.id}`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Blog post updated")
      }

      resetForm()
      await loadPosts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublishToggle = async (
    post: BlogPost,
    action: "publish" | "unpublish"
  ) => {
    setPublishingId(post.id)
    try {
      const response = await request<{ post: BlogPost | BlogPost[] }>(
        `/admin/blog-posts/${post.id}/publish`,
        {
          method: "POST",
          body: JSON.stringify({ action }),
        }
      )
      toast.success(
        action === "publish"
          ? `"${post.title}" published`
          : `"${post.title}" moved to draft`
      )
      await loadPosts()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update publish state"
      )
    } finally {
      setPublishingId(null)
    }
  }

  const handleDelete = async (post: BlogPost) => {
    const confirmed = window.confirm(
      `Delete "${post.title}"? This cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {
      await request(`/admin/blog-posts/${post.id}`, {
        method: "DELETE",
      })
      toast.success(`Deleted "${post.title}"`)
      await loadPosts()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete the post"
      )
    }
  }

  const activePosts = useMemo(() => {
    return [...posts].sort(
      (a, b) =>
        new Date(b.updated_at ?? b.published_at ?? 0).getTime() -
        new Date(a.updated_at ?? a.published_at ?? 0).getTime()
    )
  }, [posts])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <div className="space-y-1">
        <Heading level="h1" className="text-3xl">
          Blog posts
        </Heading>
        <p className="text-sm text-ui-fg-subtle">
          Draft, schedule, and publish long-form content for the storefront blog.
        </p>
      </div>

      <div className="rounded-2xl border border-ui-border-base bg-ui-bg-component p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-ui-fg-base">
              {formMode === "create" ? "Write something new" : "Edit article"}
            </p>
            <p className="text-sm text-ui-fg-subtle">
              {formMode === "create"
                ? "Capture the details for a new blog entry."
                : "Update content, imagery, tags, or publishing state."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {formMode === "edit" && (
              <Button
                size="small"
                variant="secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel edit
              </Button>
            )}
            <Button
              size="small"
              onClick={() => setFormOpen((prev) => !prev)}
              variant={formOpen ? "secondary" : "primary"}
            >
              {formOpen ? "Hide form" : "New article"}
            </Button>
          </div>
        </div>

        {formOpen && (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                  Title
                </label>
                <Input
                  required
                  value={form.title}
                  onChange={(event) =>
                    handleInputChange("title", event.target.value)
                  }
                  placeholder="Example: Layered linen guide"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                  Slug
                </label>
                <Input
                  value={form.slug}
                  onChange={(event) =>
                    handleInputChange("slug", event.target.value)
                  }
                  placeholder="layered-linen-guide"
                />
                {slugPreview && (
                  <p className="text-[0.65rem] text-ui-fg-muted">
                    Permalink: <span className="font-mono">/blog/{slugPreview}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                  Cover image URL
                </label>
                <div className="flex gap-2">
                  <Input
                    value={form.cover_image}
                    onChange={(event) =>
                      handleInputChange("cover_image", event.target.value)
                    }
                    placeholder="https://"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => handleFileSelection("cover_image")}
                    disabled={uploadingField === "cover_image"}
                  >
                    {uploadingField === "cover_image" ? "Uploading…" : "Upload"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                  Author
                </label>
                <Input
                  value={form.author_name}
                  onChange={(event) =>
                    handleInputChange("author_name", event.target.value)
                  }
                  placeholder="Editorial team"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                Excerpt
              </label>
              <Textarea
                value={form.excerpt}
                onChange={(event) =>
                  handleInputChange("excerpt", event.target.value)
                }
                rows={3}
                placeholder="Short teaser shown on listing pages..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
                <label className="font-semibold text-ui-fg-muted">
                  Content
                </label>
                <span className="text-[0.6rem] text-ui-fg-subtle">
                  Supports Markdown (headings, bold, links, lists)
                </span>
              </div>
              <div className="rounded-2xl border border-ui-border-base bg-ui-bg-field shadow-inner">
                <div className="flex flex-wrap gap-1 border-b border-ui-border-base/70 px-3 py-2">
                  {formatActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleFormatAction(action.id)}
                      className="rounded-full border border-transparent px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-ui-fg-subtle transition hover:border-ui-border-strong hover:bg-ui-bg-base hover:text-ui-fg-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-base/40"
                      title={action.tooltip}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  ref={contentRef}
                  required
                  value={form.content}
                  onChange={(event) =>
                    handleInputChange("content", event.target.value)
                  }
                  rows={10}
                  className="rounded-b-2xl border-none bg-transparent px-4 py-4"
                  placeholder="Layer multiple short paragraphs, add subheadings, quotes, or lists…"
                />
                <div className="border-t border-ui-border-base/70 px-4 py-3 text-[0.75rem] text-ui-fg-subtle space-y-3">
                  <p>
                    Tip: Use the toolbar or Markdown shortcuts like <code># Heading</code>,{" "}
                    <code>**bold**</code>, <code>- list item</code> to keep long-form content structured.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-dashed border-ui-border-base/70 p-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-ui-fg-subtle">
                        Quick unordered list
                      </p>
                      <Textarea
                        rows={3}
                        value={listDrafts.bullet}
                        onChange={(event) =>
                          handleListDraftChange("bullet", event.target.value)
                        }
                        placeholder="One idea per line..."
                      />
                      <Button
                        type="button"
                        size="small"
                        variant="secondary"
                        onClick={() => handleInsertList("bullet")}
                      >
                        Insert bullet list
                      </Button>
                    </div>
                    <div className="space-y-2 rounded-xl border border-dashed border-ui-border-base/70 p-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-ui-fg-subtle">
                        Quick ordered list
                      </p>
                      <Textarea
                        rows={3}
                        value={listDrafts.numbered}
                        onChange={(event) =>
                          handleListDraftChange("numbered", event.target.value)
                        }
                        placeholder="Steps in sequence..."
                      />
                      <Button
                        type="button"
                        size="small"
                        variant="secondary"
                        onClick={() => handleInsertList("numbered")}
                      >
                        Insert numbered list
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                  Tags
                </label>
                <Input
                  value={form.tags}
                  onChange={(event) =>
                    handleInputChange("tags", event.target.value)
                  }
                  placeholder="linen, styling, care"
                />
                <p className="text-[0.7rem] text-ui-fg-muted">
                  Separate tags with commas.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                  Status
                </label>
                <select
                  className="w-full rounded-lg border border-ui-border-base bg-transparent px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(event) =>
                    handleInputChange(
                      "status",
                      event.target.value as BlogFormState["status"]
                    )
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-ui-border-base px-4 py-3">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_featured", Boolean(checked))
                  }
                />
                <div>
                  <p className="text-sm font-semibold text-ui-fg-base">
                    Feature this post
                  </p>
                  <p className="text-xs text-ui-fg-muted">
                    Highlights the article on the storefront hero section.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-ui-border-base bg-ui-bg-field px-5 py-6">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-ui-fg-base">SEO &amp; sharing</p>
                <p className="text-xs text-ui-fg-muted">
                  Customize metadata for search engines and social platforms.
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                    Meta title
                  </label>
                  <Input
                    value={form.meta_title}
                    onChange={(event) =>
                      handleInputChange("meta_title", event.target.value)
                    }
                    placeholder={form.title || "Textured layers for autumn"}
                  />
                  <p className="text-[0.65rem] text-ui-fg-muted">
                    Aim for 50–60 characters.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                    Canonical URL
                  </label>
                  <Input
                    value={form.canonical_url}
                    onChange={(event) =>
                      handleInputChange("canonical_url", event.target.value)
                    }
                    placeholder="https://example.com/journal/layered-linen"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                    Meta description
                  </label>
                  <Textarea
                    value={form.meta_description}
                    onChange={(event) =>
                      handleInputChange("meta_description", event.target.value)
                    }
                    rows={3}
                    placeholder="Tease the article in 1–2 sentences for search results."
                  />
                  <p className="text-[0.65rem] text-ui-fg-muted">
                    Ideal length: 120–160 characters.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-ui-fg-muted">
                    Social image URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={form.og_image}
                      onChange={(event) =>
                        handleInputChange("og_image", event.target.value)
                      }
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={() => handleFileSelection("og_image")}
                      disabled={uploadingField === "og_image"}
                    >
                      {uploadingField === "og_image" ? "Uploading…" : "Upload"}
                    </Button>
                  </div>
                  <p className="text-[0.65rem] text-ui-fg-muted">
                    Optional override for Open Graph and Twitter cards.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : formMode === "create"
                  ? "Publish draft"
                  : "Update post"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading level="h2" className="text-2xl">
            Recent posts
          </Heading>
          <p className="text-sm text-ui-fg-subtle">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-ui-border-base p-10 text-center text-sm text-ui-fg-muted">
            Loading blog posts…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-ui-border-base bg-ui-bg-component p-6 text-sm text-ui-fg-danger">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ui-border-base bg-ui-bg-field px-10 py-16 text-center">
            <p className="text-sm text-ui-fg-muted">
              No articles yet. Use “New article” to publish your first story.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ui-border-base bg-ui-bg-component shadow-sm">
            <table className="min-w-full divide-y divide-ui-border-base text-sm">
              <thead className="bg-ui-bg-subtle text-xs uppercase tracking-[0.3em] text-ui-fg-muted">
                <tr>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Published</th>
                  <th className="px-6 py-3 text-left">Tags</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ui-border-base">
                {activePosts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ui-fg-base">
                        {post.title}
                      </div>
                      <div className="text-xs text-ui-fg-muted">{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        color={post.status === "published" ? "green" : "orange"}
                        size="small"
                      >
                        {post.status}
                      </Badge>
                      {post.is_featured && (
                        <Badge color="blue" size="small" className="ml-2">
                          Featured
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ui-fg-subtle">
                      {post.published_at
                        ? formatDate(post.published_at)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-ui-fg-muted">
                      {post.tags?.join(", ") || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() =>
                            handlePublishToggle(
                              post,
                              post.status === "published"
                                ? "unpublish"
                                : "publish"
                            )
                          }
                          disabled={publishingId === post.id}
                        >
                          {post.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handleEdit(post)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => handleDelete(post)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Blog",
  icon: BookOpen,
})

export default BlogAdminRoute

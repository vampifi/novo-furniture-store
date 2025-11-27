import { Fragment } from "react"

type ArticleContentProps = {
  content: string
}

type ContentBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; lines: string[] }

const formatInline = (text: string) => {
  const tokens = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)

  return tokens
    .filter((token) => token.length)
    .map((token, index) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return (
          <strong key={`bold-${index}`} className="font-semibold text-[#2d221c]">
            {token.slice(2, -2)}
          </strong>
        )
      }

      if (token.startsWith("_") && token.endsWith("_")) {
        return (
          <em key={`italic-${index}`} className="text-[#5b4a4a]">
            {token.slice(1, -1)}
          </em>
        )
      }

      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code
            key={`code-${index}`}
            className="rounded-md bg-[#f3ede7] px-1.5 py-0.5 font-mono text-[0.8rem] text-[#3b2f2f]"
          >
            {token.slice(1, -1)}
          </code>
        )
      }

      if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
        const match = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (match) {
          return (
            <a
              key={`link-${index}`}
              href={match[2]}
              className="font-semibold text-primary underline decoration-dotted underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              {match[1]}
            </a>
          )
        }
      }

      return <Fragment key={`text-${index}`}>{token}</Fragment>
    })
}

const parseBlocks = (content: string) => {
  const lines = content.split(/\r?\n/)
  const blocks: ContentBlock[] = []

  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let quote: string[] | null = null
  let code: string[] | null = null

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() })
      paragraph = []
    }
  }

  const flushList = () => {
    if (list && list.items.length) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items })
    }
    list = null
  }

  const flushQuote = () => {
    if (quote && quote.length) {
      blocks.push({ type: "quote", lines: quote })
    }
    quote = null
  }

  const flushCode = () => {
    if (code) {
      blocks.push({ type: "code", lines: code })
    }
    code = null
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (trimmed.startsWith("```")) {
      if (code) {
        flushCode()
      } else {
        flushParagraph()
        flushList()
        flushQuote()
        code = []
      }
      return
    }

    if (code) {
      code.push(line)
      return
    }

    if (!trimmed.length) {
      flushParagraph()
      flushList()
      flushQuote()
      return
    }

    if (/^#{1,3}\s/.test(trimmed)) {
      flushParagraph()
      flushList()
      flushQuote()
      const level = Math.min(trimmed.match(/^#+/)?.[0].length ?? 1, 3) as 1 | 2 | 3
      const text = trimmed.replace(/^#{1,3}\s*/, "")
      blocks.push({ type: "heading", level, text })
      return
    }

    if (trimmed.startsWith(">")) {
      flushParagraph()
      flushList()
      if (!quote) {
        quote = []
      }
      quote.push(trimmed.replace(/^>\s?/, ""))
      return
    } else {
      flushQuote()
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      if (!list || !list.ordered) {
        flushList()
        list = { ordered: true, items: [] }
      }
      list!.items.push(orderedMatch[2])
      return
    }

    const bulletMatch = trimmed.match(/^[-*+]\s+(.*)$/)
    if (bulletMatch) {
      flushParagraph()
      if (!list || list.ordered) {
        flushList()
        list = { ordered: false, items: [] }
      }
      list!.items.push(bulletMatch[1])
      return
    }

    flushList()
    paragraph.push(trimmed)
  })

  flushParagraph()
  flushList()
  flushQuote()
  flushCode()

  return blocks
}

const ArticleContent = ({ content }: ArticleContentProps) => {
  const blocks = parseBlocks(content)

  return (
    <div className="space-y-8">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const levelStyles =
              block.level === 1
                ? "text-3xl md:text-4xl"
                : block.level === 2
                ? "text-2xl md:text-3xl"
                : "text-xl md:text-2xl"
            return (
              <h2
                key={`heading-${index}`}
                className={`${levelStyles} font-semibold text-[#2d221c] tracking-tight`}
              >
                {formatInline(block.text)}
              </h2>
            )
          }
          case "quote":
            return (
              <blockquote
                key={`quote-${index}`}
                className="rounded-3xl border-l-4 border-[#c2b6af] bg-[#faf5ef] px-6 py-4 text-base italic text-[#6b5b5b]"
              >
                {block.lines.map((line, lineIndex) => (
                  <p key={`quote-line-${lineIndex}`} className="leading-relaxed">
                    {formatInline(line)}
                  </p>
                ))}
              </blockquote>
            )
          case "list":
            return (
              <ul
                key={`list-${index}`}
                className={`space-y-2 pl-6 text-[#4a3c3c] ${
                  block.ordered ? "list-decimal" : "list-disc"
                }`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`item-${itemIndex}`}>{formatInline(item)}</li>
                ))}
              </ul>
            )
          case "code":
            return (
              <pre
                key={`code-${index}`}
                className="overflow-x-auto rounded-3xl bg-[#1b1612] px-4 py-4 text-sm text-white"
              >
                <code className="font-mono leading-relaxed">
                  {block.lines.join("\n")}
                </code>
              </pre>
            )
          default:
            return (
              <p
                key={`paragraph-${index}`}
                className="leading-8 text-[#4a3c3c] md:text-lg"
              >
                {formatInline(block.text)}
              </p>
            )
        }
      })}
    </div>
  )
}

export default ArticleContent

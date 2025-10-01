"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { HiOutlineSearch } from "react-icons/hi"

type SearchPageInputProps = {
  initialValue: string
}

const SearchPageInput = ({ initialValue }: SearchPageInputProps) => {
  const router = useRouter()
  const params = useParams()
  const countryCode = Array.isArray(params?.countryCode)
    ? params.countryCode[0]
    : (params?.countryCode as string | undefined)

  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    const basePath = countryCode ? `/${countryCode}/results` : "/results"
    router.push(`${basePath}/${encodeURIComponent(trimmed)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="flex w-full flex-1 items-center gap-3 rounded-full border border-[#E4D5C8] bg-[#FBF3ED] px-4 py-2 text-[#352F2B] shadow-[0_6px_18px_rgba(31,26,23,0.1)] transition focus-within:border-[#CBB6A8] focus-within:shadow-[0_12px_28px_rgba(31,26,23,0.12)] sm:px-5">
        <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-[#7A6B61] shadow-inner aspect-square sm:h-10 sm:w-10">
          <HiOutlineSearch className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </span>
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search for furniture, lighting, decor..."
          className="flex-1 bg-transparent text-sm font-medium text-[#352F2B] placeholder:text-[#95887F] focus:outline-none"
          aria-label="Search products on page"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-11 w-full items-center justify-center rounded-full border border-transparent bg-[#3F3C3D] px-6 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#2e2b2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3F3C3D] sm:h-12 sm:w-auto"
      >
        Search
      </button>
    </form>
  )
}

export default SearchPageInput

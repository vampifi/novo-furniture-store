"use client"

import { FormEvent, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { HiOutlineSearch } from "react-icons/hi"

const SearchBar = () => {
  const router = useRouter()
  const params = useParams()
  const countryCode = Array.isArray(params?.countryCode)
    ? params?.countryCode[0]
    : (params?.countryCode as string | undefined)

  const [searchValue, setSearchValue] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = searchValue.trim()
    const basePath = countryCode ? `/${countryCode}/search` : "/search"

    if (!trimmed) {
      router.push(basePath)
      return
    }

    const searchParams = new URLSearchParams({ q: trimmed })
    router.push(`${basePath}?${searchParams.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden h-12 w-full max-w-3xl items-center overflow-hidden rounded-full bg-white/90 pl-6 pr-3 shadow-inner ring-1 ring-white/40 focus-within:ring-2 focus-within:ring-primary md:flex"
    >
      <input
        type="text"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Search"
        className="flex-1 bg-transparent text-sm text-[#3b2f2f] placeholder:text-[#a08f8f] focus:outline-none"
        aria-label="Search products"
      />
      <button
        type="submit"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
        aria-label="Search"
      >
        <HiOutlineSearch className="h-5 w-5" />
      </button>
    </form>
  )
}

export default SearchBar

"use client"

import { InstantSearch } from "react-instantsearch-hooks-web"
import { useRouter } from "next/navigation"
import { MagnifyingGlassMini } from "@medusajs/icons"

import { SEARCH_INDEX_NAME, searchClient } from "@lib/search-client"
import Hit from "@modules/search/components/hit"
import Hits from "@modules/search/components/hits"
import SearchBox from "@modules/search/components/search-box"
import { useEffect, useRef } from "react"

export default function SearchModal() {
  const router = useRouter()
  const searchRef = useRef(null)

  // close modal on outside click
  const handleOutsideClick = (event: MouseEvent) => {
    if (event.target === searchRef.current) {
      router.back()
    }
  }

  useEffect(() => {
    window.addEventListener("click", handleOutsideClick)
    // cleanup
    return () => {
      window.removeEventListener("click", handleOutsideClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // disable scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  // on escape key press, close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.back()
      }
    }
    window.addEventListener("keydown", handleEsc)

    // cleanup
    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative z-[75]">
      <div
        className="fixed inset-0 h-screen w-screen bg-[#1F1A17]/55 backdrop-blur-sm"
        role="presentation"
        onClick={() => router.back()}
      />
      <div
        className="fixed inset-0 overflow-y-auto px-4 py-10 sm:py-16"
        ref={searchRef}
        onClick={() => router.back()}
      >
        <div
          className="mx-auto flex w-full max-w-3xl flex-col gap-6"
          onClick={(event) => event.stopPropagation()}
        >
          <InstantSearch
            indexName={SEARCH_INDEX_NAME}
            searchClient={searchClient}
          >
            <div
              className="flex h-fit w-full flex-col gap-5"
              data-testid="search-modal-container"
            >
              <div className="rounded-3xl border border-[#E4D5C8] bg-white/97 px-6 py-6 shadow-[0_18px_38px_rgba(31,26,23,0.16)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F6EDE6] text-[#6F6157] shadow-inner aspect-square sm:h-11 sm:w-11">
                      <MagnifyingGlassMini className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <div className="flex-1">
                      <SearchBox />
                    </div>
                  </div>
              </div>
              <div className="rounded-3xl border border-[#E4D5C8] bg-[#FAF6F3]/95 p-5 shadow-[0_16px_34px_rgba(31,26,23,0.12)]">
                <Hits hitComponent={Hit} />
              </div>
            </div>
          </InstantSearch>
        </div>
      </div>
    </div>
  )
}

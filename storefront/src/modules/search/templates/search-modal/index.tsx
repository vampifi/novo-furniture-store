"use client"

import { InstantSearch } from "react-instantsearch-hooks-web"
import { useRouter } from "next/navigation"
import { HiOutlineX } from "react-icons/hi"

import { SEARCH_INDEX_NAME, searchClient } from "@lib/search-client"
import Hit from "@modules/search/components/hit"
import Hits from "@modules/search/components/hits"
import SearchBox from "@modules/search/components/search-box"
import { useEffect, useRef } from "react"

export default function SearchModal() {
  const router = useRouter()
  const searchRef = useRef(null)

  const handleClose = () => {
    router.push("/")
  }

  // close modal on outside click
  const handleOutsideClick = (event: MouseEvent) => {
    if (event.target === searchRef.current) {
      handleClose()
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
        handleClose()
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
        onClick={handleClose}
      />
      <div
        className="fixed inset-0 overflow-y-auto px-4 py-10 sm:py-16"
        ref={searchRef}
        onClick={handleClose}
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
              <div className="rounded-3xl border border-[#E4D5C8] bg-white/95 px-5 py-5 shadow-[0_18px_32px_rgba(31,26,23,0.12)] sm:px-6 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-[#3F3A36] sm:text-lg">
                      Search products
                    </h2>
                    <p className="mt-1 text-xs text-[#8C7C71] sm:text-sm">
                      Start typing to discover pieces you’ll love.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close search and return home"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E4D5C8] bg-white text-[#5C4F46] shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#FFF7F1] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6F6157] sm:h-10 sm:w-10"
                  >
                    <HiOutlineX className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 sm:mt-5">
                  <SearchBox />
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

import { MagnifyingGlassMini, XMarkMini } from "@medusajs/icons"
import { FormEvent } from "react"

import SearchBoxWrapper, {
  ControlledSearchBoxProps,
} from "../search-box-wrapper"

const ControlledSearchBox = ({
  inputRef,
  onChange,
  onReset,
  onSubmit,
  placeholder,
  value,
  ...props
}: ControlledSearchBoxProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (onSubmit) {
      onSubmit(event)
    }

    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  const handleReset = (event: FormEvent) => {
    event.preventDefault()
    event.stopPropagation()

    onReset(event)

    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div {...props} className="w-full">
      <form action="" noValidate onSubmit={handleSubmit} onReset={handleReset}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B4A299] sm:left-4">
            <MagnifyingGlassMini className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <input
            ref={inputRef}
            data-testid="search-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={placeholder}
            spellCheck={false}
            type="search"
            value={value}
            onChange={onChange}
            className="w-full rounded-xl border border-[#E4D5C8] bg-[#FDF9F5] pl-10 pr-12 py-3 text-sm text-[#3F3A36] placeholder:text-[#9B8C82] focus:border-[#C9B4A3] focus:outline-none focus:ring-2 focus:ring-[#E7D6C7]/70 sm:rounded-2xl sm:pl-12 sm:pr-14 sm:py-3.5 sm:text-base"
          />
          {value && (
            <button
              onClick={handleReset}
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#E4D5C8] bg-white text-[#6B5B4F] shadow-sm transition-colors duration-150 hover:bg-[#F3E9E0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6F6157] sm:right-3 sm:h-10 sm:w-10"
            >
              <XMarkMini className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const SearchBox = () => {
  return (
    <SearchBoxWrapper>
      {(props) => {
        return (
          <>
            <ControlledSearchBox {...props} />
          </>
        )
      }}
    </SearchBoxWrapper>
  )
}

export default SearchBox

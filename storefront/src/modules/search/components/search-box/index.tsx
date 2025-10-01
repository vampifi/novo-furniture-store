import { XMarkMini } from "@medusajs/icons"
import { FormEvent } from "react"
import { useRouter } from "next/navigation"

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
        <div className="flex items-center justify-between gap-3">
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
            className="txt-compact-large h-6 flex-1 bg-transparent text-white placeholder:text-white/60 placeholder:transition-colors focus:outline-none"
          />
          {value && (
            <button
              onClick={handleReset}
              type="button"
              className="items-center justify-center gap-x-2 px-2 txt-compact-large flex text-white/70 transition hover:text-white focus:outline-none"
            >
              <XMarkMini />
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const SearchBox = () => {
  const router = useRouter()

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

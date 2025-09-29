export type PriceRangeOption = {
  value: string
  label: string
  min?: number
  max?: number
}

export type ColorFilterOption = {
  id: string
  label: string
  count?: number
  value?: string
}

export const PRICE_RANGE_FILTERS: PriceRangeOption[] = [
  { value: "0-500", label: "Under £500", min: 0, max: 500 },
  { value: "500-1000", label: "£500 - £1,000", min: 500, max: 1000 },
  { value: "1000-2000", label: "£1,000 - £2,000", min: 1000, max: 2000 },
  { value: "2000+", label: "£2,000 and up", min: 2000 },
]

export const DEFAULT_PAGE_SIZE = 12

export const COLOR_FILTERS: ColorFilterOption[] = [
  { id: "black", label: "Black", value: "black", count: 54 },
  { id: "natural", label: "Natural", value: "natural", count: 278 },
  { id: "grey", label: "Grey", value: "grey", count: 87 },
  { id: "green", label: "Green", value: "green", count: 103 },
  { id: "white", label: "White", value: "white", count: 91 },
  { id: "rich-green", label: "Rich Green", value: "rich green", count: 22 },
  { id: "brown", label: "Brown", value: "brown", count: 41 },
  { id: "light-wood", label: "Light Wood", value: "light wood", count: 19 },
  { id: "orange", label: "Orange", value: "orange", count: 23 },
  { id: "blue", label: "Blue", value: "blue", count: 37 },
  { id: "dark-wood", label: "Dark Wood", value: "dark wood", count: 12 },
  { id: "purple", label: "Purple", value: "purple", count: 11 },
  { id: "chocolate-stripe", label: "Chocolate Stripe", value: "chocolate stripe", count: 7 },
  { id: "medium-wood", label: "Medium Wood", value: "medium wood", count: 22 },
  { id: "bright-orange", label: "Bright Orange", value: "bright orange", count: 6 },
  { id: "clear", label: "Clear", value: "clear", count: 6 },
  { id: "muted-gold", label: "Muted Gold", value: "muted gold", count: 6 },
  { id: "pink", label: "Pink", value: "pink", count: 27 },
  { id: "velvet-ink", label: "Velvet Ink", value: "velvet ink", count: 6 },
  { id: "cream-black", label: "Cream/Black", value: "cream black", count: 6 },
  { id: "aubergine", label: "Aubergine", value: "aubergine", count: 4 },
  { id: "speckled-sand-boucle", label: "Speckled Sand Boucle", value: "speckled sand boucle", count: 4 },
  { id: "yellow", label: "Yellow", value: "yellow", count: 6 },
  { id: "cow-print", label: "Cow Print", value: "cow print", count: 3 },
  { id: "red", label: "Red", value: "red", count: 4 },
  { id: "burnt-orange-natural", label: "Burnt Orange/Natural", value: "burnt orange natural", count: 2 },
  { id: "contrast-piping", label: "Contrast Piping", value: "contrast piping", count: 2 },
  { id: "dark-rust", label: "Dark Rust", value: "dark rust", count: 2 },
  { id: "forest-green", label: "Forest Green", value: "forest green", count: 2 },
  { id: "glass-black", label: "Glass/Black", value: "glass black", count: 2 },
  { id: "marble", label: "Marble", value: "marble", count: 2 },
  { id: "oatmeal-white", label: "Oatmeal/White", value: "oatmeal white", count: 2 },
  { id: "off-white", label: "Off White", value: "off white", count: 2 },
  { id: "rust-cream", label: "Rust/Cream", value: "rust cream", count: 2 },
  { id: "burnt-orange", label: "Burnt Orange", value: "burnt orange", count: 1 },
  { id: "champagne", label: "Champagne", value: "champagne", count: 1 },
  { id: "chenille-ecru", label: "Chenille Ecru", value: "chenille ecru", count: 1 },
  { id: "chenille-grey", label: "Chenille Grey", value: "chenille grey", count: 1 },
  { id: "chenille-smoke-grey", label: "Chenille Smoke Grey", value: "chenille smoke grey", count: 1 },
  { id: "concrete", label: "Concrete", value: "concrete", count: 1 },
  { id: "cream-linen", label: "Cream Linen", value: "cream linen", count: 1 },
  { id: "cream-linen-black", label: "Cream Linen / Black", value: "cream linen black", count: 1 },
  { id: "ivory-grey", label: "Ivory/Grey", value: "ivory grey", count: 1 },
  { id: "pebble-grey", label: "Pebble Grey", value: "pebble grey", count: 1 },
  { id: "raspberry", label: "Raspberry", value: "raspberry", count: 1 },
  { id: "royal-blue", label: "Royal Blue", value: "royal blue", count: 1 },
  { id: "silver", label: "Silver", value: "silver", count: 1 },
  { id: "teddy-cream", label: "Teddy Cream", value: "teddy cream", count: 1 },
  { id: "white-fleece", label: "White Fleece", value: "white fleece", count: 1 },
]

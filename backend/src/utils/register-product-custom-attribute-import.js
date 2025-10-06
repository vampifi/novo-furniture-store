import { CSVNormalizer as FrameworkCSVNormalizer } from "@medusajs/framework/utils"
import { CSVNormalizer as UtilsCSVNormalizer } from "@medusajs/utils"

const ATTRIBUTE_PREFIX = /^attribute\s+(\d+)\s+(key|value|category id|label|type|visible)$/i
export const IMPORT_ATTRIBUTE_METADATA_KEY = "__import_attributes"

const targets = [
  { name: "framework", normalizer: FrameworkCSVNormalizer },
  { name: "utils", normalizer: UtilsCSVNormalizer },
]

targets.forEach(({ name, normalizer }) => {
  if (!normalizer || typeof normalizer.preProcess !== "function") {
    return
  }

  if (normalizer.__customAttributesExtended) {
    return
  }

  const originalPreProcess = normalizer.preProcess.bind(normalizer)

  console.log(
    `[custom-attributes] extending ${name} CSV normalizer to support attribute columns`
  )

  normalizer.preProcess = function (row, rowNumber) {
    const sanitizedRow = {}
    const attributeMap = {}

    for (const [rawKey, rawValue] of Object.entries(row)) {
      const normalizedKey = String(rawKey ?? "").trim()
      const match = normalizedKey.match(ATTRIBUTE_PREFIX)

      if (match) {
        const index = match[1]
        const field = match[2].toLowerCase()

        if (!attributeMap[index]) {
          attributeMap[index] = {}
        }

        const cleanedValue = typeof rawValue === "string" ? rawValue.trim() : rawValue

        switch (field) {
          case "key":
            attributeMap[index].key = cleanedValue
            break
          case "value":
            attributeMap[index].value = cleanedValue
            break
          case "category id":
            attributeMap[index].categoryId = cleanedValue
            break
          case "label":
            attributeMap[index].label = cleanedValue
            break
          case "type":
            attributeMap[index].type = cleanedValue
            break
          case "visible":
            attributeMap[index].visible = cleanedValue
            break
          default:
            break
        }
        continue
      }

      sanitizedRow[rawKey] = rawValue
    }

    const normalized = originalPreProcess(sanitizedRow, rowNumber)

    const attributes = Object.values(attributeMap)
      .map((attribute) => {
        const key = attribute.key?.toString().trim()
        const value = attribute.value?.toString().trim()
        const categoryId = attribute.categoryId?.toString().trim()

        if (!key || !value || !categoryId) {
          return null
        }

        const isVisible = attribute.visible
          ? attribute.visible.toString().toLowerCase() !== "false"
          : true

        return {
          key,
          value,
          category_id: categoryId,
          label: attribute.label?.toString().trim() || key,
          type: attribute.type?.toString().trim() || "text",
          is_visible: isVisible,
        }
      })
      .filter(Boolean)

    if (attributes.length) {
      console.log(
        `[custom-attributes] row ${rowNumber} extracted attributes: ${JSON.stringify(attributes)}`
      )
      const existingMetadata = normalized.metadata || {}
      let currentAttributes = []

      const currentSerialized = existingMetadata[IMPORT_ATTRIBUTE_METADATA_KEY]
      if (typeof currentSerialized === "string") {
        try {
          const parsed = JSON.parse(currentSerialized)
          if (Array.isArray(parsed)) {
            currentAttributes = parsed
          }
        } catch (error) {}
      }

     const mergedAttributes = [...currentAttributes, ...attributes]
      existingMetadata[IMPORT_ATTRIBUTE_METADATA_KEY] = JSON.stringify(mergedAttributes)
      const cache =
        globalThis.__customAttributeImportCache ||
        (globalThis.__customAttributeImportCache = new Map())

     const baseKey =
       normalized.handle ||
       normalized.product_handle ||
       normalized.title ||
       normalized.product_title ||
        sanitizedRow["Product Handle"] ||
        sanitizedRow["product handle"] ||
        sanitizedRow["product_handle"] ||
        sanitizedRow["Handle"] ||
        sanitizedRow["handle"] ||
        `row-${rowNumber}`

      const cacheKey = `handle:${baseKey}`
      cache.set(cacheKey, mergedAttributes)
      console.log(
        `[custom-attributes] cached attributes under key ${cacheKey}`
      )
      existingMetadata.__import_attributes_cache_key = cacheKey
      normalized.metadata = existingMetadata
    } else {
      console.log(
        `[custom-attributes] row ${rowNumber} contains no custom attributes`
      )
    }

    return normalized
  }

  Object.defineProperty(normalizer, "__customAttributesExtended", {
    value: true,
    enumerable: false,
    configurable: false,
  })
})

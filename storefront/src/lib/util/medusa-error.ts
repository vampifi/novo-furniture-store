export const extractMedusaErrorMessage = (error: any): string => {
  if (error instanceof Error && !("response" in error)) {
    return error.message || "An unknown error occurred."
  }

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)
    console.error("Headers:", error.response.headers)

    // Extracting the error message from the response data
    const data = error.response.data
    const message =
      (typeof data === "string" ? data : data?.message) ||
      "The server responded with an error."

    if (message.includes("is not stocked at location")) {
      return "One or more items in your cart aren’t available for the selected shipping location. Please remove the unavailable item or choose a different region/shipping method before placing the order."
    }

    const formattedMessage =
      message.charAt(0).toUpperCase() + message.slice(1) + "."

    return formattedMessage
  } else if (error.request) {
    // The request was made but no response was received
    return "No response received: " + error.request
  } else {
    // Something happened in setting up the request that triggered an Error
    const message =
      error?.message || "Error setting up the request: unknown error."
    return message.startsWith("Error setting up")
      ? message
      : "Error setting up the request: " + message
  }
}

export default function medusaError(error: any): never {
  throw new Error(extractMedusaErrorMessage(error))
}

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { defineWidgetConfig } from "@medusajs/admin-sdk"

const TARGET_TRANSLATION = "Welcome to NOVO"
const NAMESPACE = "translation"
const KEYS = ["login.title", "login.hint"]

const LoginTitleOverride = () => {
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = i18n.language || "en"
    const resources: Record<string, string> = {
      "login.title": TARGET_TRANSLATION,
      "login.hint": "Sign in to your NOVO dashboard",
    }

    let needsUpdate = false

    KEYS.forEach((key) => {
      const existing = i18n.getResource(lang, NAMESPACE, key)
      if (existing !== resources[key]) {
        needsUpdate = true
      }
    })

    if (!needsUpdate) {
      return
    }

    i18n.addResourceBundle(
      lang,
      NAMESPACE,
      {
        login: {
          title: resources["login.title"],
          hint: resources["login.hint"],
        },
      },
      true,
      true
    )

    i18n.changeLanguage(lang)
  }, [i18n])

  return null
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginTitleOverride

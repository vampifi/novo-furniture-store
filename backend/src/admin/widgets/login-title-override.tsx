'use client'
import { useTranslation } from "react-i18next"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const TARGET_TRANSLATION = "Welcome to NOVO"
const NAMESPACE = "translation"
const KEYS = ["login.title", "login.hint"]

const LoginTitleOverride = () => {
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = i18n.language || "en"
    const resources = {
      login: {
        title: TARGET_TRANSLATION,
        hint: "Sign in to your NOVO dashboard",
      },
    }

    const existingValues = KEYS.map((key) => {
      if (typeof i18n.t !== "function") {
        return ""
      }

      return i18n.t(key, { lng: lang, defaultValue: "" })
    })

    const desiredValues = [resources.login.title, resources.login.hint]

    const needsUpdate = desiredValues.some(
      (value, index) => value !== existingValues[index]
    )

    if (!needsUpdate) {
      return
    }

    if (typeof i18n.addResourceBundle === "function") {
      i18n.addResourceBundle(lang, NAMESPACE, resources, true, true)
    } else if (typeof i18n.addResource === "function") {
      Object.entries(resources.login).forEach(([key, value]) => {
        i18n.addResource(lang, NAMESPACE, `login.${key}`, value)
      })
    }

    if (typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(lang)
    }
  }, [i18n])

  return null
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginTitleOverride

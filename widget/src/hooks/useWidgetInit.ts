import { useEffect, useState } from "react"
import { initWidget } from "../sdk/widgetClient"
import type { WidgetInitResponse } from "../sdk/widgetClient"

let widgetInitPromise: Promise<WidgetInitResponse> | null = null

function resolveWidgetToken() {
  return window.__CHAT_WIDGET_CONFIG__?.token || import.meta.env.VITE_WIDGET_TOKEN || "test-token-123"
}

export function useWidgetInit() {
  const [data, setData] = useState<WidgetInitResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const token = resolveWidgetToken()

  useEffect(() => {
    let cancelled = false

    window.__CHAT_WIDGET__ = window.__CHAT_WIDGET__ || {}
    if (!widgetInitPromise) {
      window.__CHAT_WIDGET__.initialized = true
      widgetInitPromise = initWidget(token)
    }

    widgetInitPromise
      .then((res) => {
        if (!cancelled) {
          setData(res)
        }
      })
      .catch((err) => {
        console.error("Widget init failed:", err)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return { data, loading, token }
}

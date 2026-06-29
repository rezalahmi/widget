import { useEffect, useState } from "react"
import { initWidget } from "../sdk/widgetClient"
import type { WidgetInitResponse } from "../sdk/widgetClient"
import {
  configureVisitorTracker,
  startVisitorTracker,
  trackWidgetEvent,
  VisitorEventType,
} from "../sdk/eventTracker"

let widgetInitPromise: Promise<WidgetInitResponse> | null = null

function resolveWidgetToken() {
  return window.__CHAT_WIDGET_CONFIG__?.token || import.meta.env.VITE_WIDGET_TOKEN || ""
}

export function useWidgetInit() {
  const initialToken = resolveWidgetToken()
  const [data, setData] = useState<WidgetInitResponse | null>(null)
  const [loading, setLoading] = useState(Boolean(initialToken))
  const [error, setError] = useState<string | null>(
    initialToken ? null : "Widget token is missing.",
  )

  useEffect(() => {
    const token = resolveWidgetToken()

    if (!token) {
      console.warn("No widget token found. Init aborted.")
      return
    }

    let cancelled = false

    if (!widgetInitPromise) {
      window.__CHAT_WIDGET__ = window.__CHAT_WIDGET__ || {}
      window.__CHAT_WIDGET__.initialized = true

      widgetInitPromise = initWidget(token).then((res) => {
        configureVisitorTracker({ token, visitorKey: res.visitor.visitor_key })
        trackWidgetEvent(VisitorEventType.WIDGET_INIT, "widget_initialized", {
          enabled: res.widget?.enabled,
          auto_open: res.widget?.auto_open,
          primary_color: res.widget?.theme?.primary_color,
          position: res.widget?.theme?.position,
        })
        startVisitorTracker()
        return res
      })
    }

    widgetInitPromise
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        console.error("Widget init failed:", err)
        if (!cancelled) {
          setError(err?.message || "Failed to initialize widget")
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}

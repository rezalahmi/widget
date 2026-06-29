import { useEffect, useState } from "react"
import { initWidget } from "../sdk/widgetClient"
import type { WidgetInitResponse } from "../sdk/widgetClient"

export function useWidgetInit() {
  const [data, setData] = useState<WidgetInitResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("🔍 useWidgetInit: Effect Started")

    // 1. تلاش برای خواندن از window (حالت embed)
    const config = (window as any).__CHAT_WIDGET_CONFIG__
    
    // 2. تلاش برای خواندن از env یا fallback (حالت dev)
    const token =
      config?.token ||
      import.meta.env.VITE_WIDGET_TOKEN || 
      "test-token-123"

    console.log("🔑 Resolved Token:", token)

    if (!token) {
      console.warn("⚠️ No token found. Init aborted.")
      setLoading(false)
      return
    }

    console.log("🚀 Calling initWidget API...")
    
    initWidget(token)
      .then((res) => {
        console.log("✅ Init Success:", res)
        setData(res)
      })
      .catch((err) => {
        console.error("❌ Init Failed:", err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { data, loading }
}

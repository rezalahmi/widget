//widget\src\hooks\useWidgetInit.ts
//این فایل‌ها به فرانت‌اند می‌گن: "وقتی ویجت لود شد، برو سرور رو چک کن. اگر موفق بود، اون ردیاب مخفی رو روشن کن".
import { useEffect, useState } from "react"
import { initWidget } from "../sdk/widgetClient"
import type { WidgetInitResponse } from "../sdk/widgetClient"
import { VisitorTracker } from "../tracker/visitorTracker"

// 1. اضافه کردن تایپ به window
declare global {
  interface Window {
    __CHAT_WIDGET_CONFIG__?: {
      token?: string
    }
    __CHAT_WIDGET__?: {
      tracker?: VisitorTracker
    }
  }
}

export function useWidgetInit() {
  const [data, setData] = useState<WidgetInitResponse | null>(null)
  const [loading, setLoading] = useState(true)
  // 2. اضافه کردن استیت ارور
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("🔍 useWidgetInit: Effect Started")

    const config = window.__CHAT_WIDGET_CONFIG__

    // 3. حذف fallback خطرناک
    const token =
      config?.token ||
      import.meta.env.VITE_WIDGET_TOKEN

    // 4. حالا این اگر واقعاً توکن نباشد کار می‌کند
    if (!token) {
      console.warn("⚠️ No token found. Init aborted.")
      setError("Widget token is missing.")
      setLoading(false)
      return
    }

    let isMounted = true // 5. جلوگیری از آپدیت استیت در کامپوننت Unmount شده
    let trackerInstance: VisitorTracker | null = null

    console.log("🚀 Calling initWidget API with token:", token)

    initWidget(token)
      .then((res) => {
        if (!isMounted) return
        
        console.log("✅ Init Success:", res)
        setData(res)

        if (res?.visitor_key) {
          trackerInstance = new VisitorTracker({
            visitorKey: res.visitor_key, // اصلاح شد
            widgetToken: token
          })

          trackerInstance.start()

          window.__CHAT_WIDGET__ = window.__CHAT_WIDGET__ || {}
          window.__CHAT_WIDGET__.tracker = trackerInstance
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.error("❌ Init Failed:", err)
        setError(err?.message || "Failed to initialize widget")
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    // 6. تابع پاک‌سازی (Cleanup)
    return () => {
      isMounted = false
      if (trackerInstance && typeof trackerInstance.stop === 'function') {
        console.log("🧹 Cleaning up tracker...")
        trackerInstance.stop()
      }
    }
  }, []) // توجه: اگر توکن داینامیک باشد باید در Dependency array قرار گیرد

  return { data, loading, error } // 7. برگرداندن error به کامپوننت
}

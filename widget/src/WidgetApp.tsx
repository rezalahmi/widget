//widget\src\WidgetApp.tsx
//این فایل‌ها به فرانت‌اند می‌گن: "وقتی ویجت لود شد، برو سرور رو چک کن. اگر موفق بود، اون ردیاب مخفی رو روشن کن".
import { useState } from "react"
import FloatingButton from "./components/FloatingButton"
import ChatWindow from "./components/ChatWindow"
import { useWidgetInit } from "./hooks/useWidgetInit"
import { trackWidgetEvent, VisitorEventType } from "./sdk/eventTracker"

export default function WidgetApp() {
  const [open, setOpen] = useState(false)
  const { data, loading } = useWidgetInit()

  console.log("WidgetApp", { loading, data })

  const handleToggle = () => {
    setOpen((current) => {
      const next = !current
      if (next) {
        trackWidgetEvent(VisitorEventType.CHAT_OPEN, "floating_button")
      }
      return next
    })
  }

  return (
    <>
      {open && <ChatWindow onClose={() => setOpen(false)} />}
      <FloatingButton onClick={handleToggle} />
    </>
  )
}

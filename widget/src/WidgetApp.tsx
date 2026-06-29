//widget\src\WidgetApp.tsx
//این فایل‌ها به فرانت‌اند می‌گن: "وقتی ویجت لود شد، برو سرور رو چک کن. اگر موفق بود، اون ردیاب مخفی رو روشن کن".
import { useState } from "react"
import FloatingButton from "./components/FloatingButton"
import ChatWindow from "./components/ChatWindow"
import { useWidgetInit } from "./hooks/useWidgetInit"

export default function WidgetApp() {
  const [open, setOpen] = useState(false)
  const { data, loading } = useWidgetInit()

  console.log("WidgetApp", { loading, data })

  return (
    <>
      {open && <ChatWindow onClose={() => setOpen(false)} />}
      <FloatingButton onClick={() => setOpen(!open)} />
    </>
  )
}

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

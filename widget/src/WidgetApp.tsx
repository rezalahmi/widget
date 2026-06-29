import { useState } from "react"
import FloatingButton from "./components/FloatingButton"
import ChatWindow from "./components/ChatWindow"
import { useWidgetInit } from "./hooks/useWidgetInit"
import { trackWidgetEvent, VisitorEventType } from "./sdk/eventTracker"
import { getStoredChatSessionId, openWidgetChat } from "./sdk/widgetClient"

export default function WidgetApp() {
  const [open, setOpen] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | null>(() => getStoredChatSessionId())
  const { data, loading, token } = useWidgetInit()

  console.log("WidgetApp", { loading, data, chatSessionId })

  const handleToggle = () => {
    if (open) {
      setOpen(false)
      return
    }

    setOpen(true)
    trackWidgetEvent(VisitorEventType.CHAT_OPEN, "floating_button")

    if (chatSessionId) return

    const visitorKey = data?.visitor.visitor_key
    if (!visitorKey) {
      console.warn("Chat open skipped because visitor is not initialized yet.")
      return
    }

    openWidgetChat(token, {
      visitor_key: visitorKey,
      url: window.location.href,
    })
      .then((res) => {
        setChatSessionId(res.session_id)
      })
      .catch((err) => {
        console.error("Chat open failed:", err)
      })
  }

  return (
    <>
      {open && (
        <ChatWindow
          sessionId={chatSessionId}
          token={token}
          onClose={() => setOpen(false)}
        />
      )}
      <FloatingButton disabled={loading || !data} onClick={handleToggle} />
    </>
  )
}

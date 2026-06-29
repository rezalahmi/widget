import { type FormEvent, useState } from "react"
import { trackWidgetEvent, VisitorEventType } from "../sdk/eventTracker"

type Props = {
  onClose: () => void
}

export default function ChatWindow({ onClose }: Props) {
  const [message, setMessage] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    trackWidgetEvent(VisitorEventType.CHAT_MESSAGE, "user_message", {
      message_length: trimmedMessage.length,
    })
    setMessage("")
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        right: "20px",
        width: "320px",
        height: "420px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#2563eb",
          color: "white",
          padding: "12px",
          fontWeight: "bold",
        }}
      >
        AI Assistant
        <button
          onClick={onClose}
          style={{
            float: "right",
            border: "none",
            background: "transparent",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: "10px",
          overflowY: "auto",
          fontSize: "14px",
        }}
      >
        👋 سلام! چطور می‌تونم کمکت کنم؟
      </div>

      <div
        style={{
          borderTop: "1px solid #eee",
          padding: "10px",
        }}
      >
        <form onSubmit={handleSubmit}>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="پیام خود را بنویسید..."
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
          />
        </form>
      </div>
    </div>
  )
}

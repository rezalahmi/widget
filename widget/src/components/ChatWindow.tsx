import { type FormEvent, useRef, useState } from "react"
import { type ChatCitation, sendWidgetChatMessage } from "../sdk/chatStream"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: ChatCitation[]
}

type Props = {
  sessionId: string | null
  token: string
  onClose: () => void
}

export default function ChatWindow({ sessionId, token, onClose }: Props) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 سلام! چطور می‌تونم کمکت کنم؟",
    },
  ])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [waitingForFirstChunk, setWaitingForFirstChunk] = useState(false)
  const firstChunkReceived = useRef(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage || !sessionId || waitingForFirstChunk || streamingMessageId) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage,
    }
    const assistantMessageId = crypto.randomUUID()

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ])
    setMessage("")
    setStreamingMessageId(assistantMessageId)
    setWaitingForFirstChunk(true)
    firstChunkReceived.current = false

    sendWidgetChatMessage({
      token,
      sessionId,
      content: trimmedMessage,
      onChunk: (content) => {
        if (!firstChunkReceived.current) {
          firstChunkReceived.current = true
          setWaitingForFirstChunk(false)
        }

        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? { ...item, content: item.content + content }
              : item,
          ),
        )
      },
      onCitations: (citations) => {
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId ? { ...item, citations } : item,
          ),
        )
      },
      onDone: () => {
        setStreamingMessageId(null)
        setWaitingForFirstChunk(false)
      },
    })
      .catch((err) => {
        console.error("Chat message failed:", err)
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content: "ارسال پیام با خطا روبه‌رو شد. لطفا دوباره تلاش کنید.",
                }
              : item,
          ),
        )
      })
      .finally(() => {
        setWaitingForFirstChunk(false)
        setStreamingMessageId(null)
      })
  }

  const inputDisabled = !sessionId || waitingForFirstChunk || Boolean(streamingMessageId)

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        right: "20px",
        width: "340px",
        height: "460px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 9999,
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "#2563eb",
          color: "white",
          padding: "12px",
          fontWeight: "bold",
          direction: "ltr",
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
          background: "#f8fafc",
        }}
      >
        {messages.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: item.role === "user" ? "flex-start" : "flex-end",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                borderRadius: "10px",
                padding: "9px 10px",
                background: item.role === "user" ? "#2563eb" : "white",
                color: item.role === "user" ? "white" : "#111827",
                boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {item.content || (item.id === streamingMessageId ? "در حال نوشتن..." : "")}
              {item.citations?.length ? <CitationList citations={item.citations} /> : null}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: "1px solid #eee",
          padding: "10px",
          display: "flex",
          gap: "8px",
          direction: "rtl",
        }}
      >
        <input
          value={message}
          disabled={inputDisabled}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={sessionId ? "پیام خود را بنویسید..." : "در حال آماده‌سازی گفتگو..."}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxSizing: "border-box",
          }}
        />
        <button
          disabled={inputDisabled || !message.trim()}
          type="submit"
          style={{
            border: "none",
            borderRadius: "6px",
            background: inputDisabled || !message.trim() ? "#94a3b8" : "#2563eb",
            color: "white",
            padding: "0 12px",
            cursor: inputDisabled || !message.trim() ? "not-allowed" : "pointer",
          }}
        >
          ارسال
        </button>
      </form>
    </div>
  )
}

function CitationList({ citations }: { citations: ChatCitation[] }) {
  return (
    <div
      style={{
        borderTop: "1px solid #e5e7eb",
        marginTop: "10px",
        paddingTop: "8px",
      }}
    >
      <div
        style={{
          color: "#475569",
          fontSize: "12px",
          fontWeight: 700,
          marginBottom: "6px",
        }}
      >
        منابع
      </div>
      {citations.map((citation) => (
        <div
          key={`${citation.file_id}-${citation.index}-${citation.chunk_index}`}
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "flex-start",
            color: "#334155",
            fontSize: "12px",
            marginTop: "5px",
          }}
        >
          <span
            style={{
              background: "#e0ecff",
              color: "#1d4ed8",
              borderRadius: "999px",
              minWidth: "20px",
              height: "20px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              direction: "ltr",
            }}
          >
            {citation.index}
          </span>
          <span>
            {citation.file_name}
            {citation.page_number ? `، صفحه ${citation.page_number}` : ""}
            {citation.slide_number ? `، اسلاید ${citation.slide_number}` : ""}
            {citation.sheet ? `، شیت ${citation.sheet}` : ""}
          </span>
        </div>
      ))}
    </div>
  )
}

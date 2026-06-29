type Props = {
  onClose: () => void
}

export default function ChatWindow({ onClose }: Props) {
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
        zIndex: 9999
      }}
    >
      
      <div
        style={{
          background: "#2563eb",
          color: "white",
          padding: "12px",
          fontWeight: "bold"
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
            cursor: "pointer"
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
          fontSize: "14px"
        }}
      >
        👋 سلام! چطور می‌تونم کمکت کنم؟
      </div>

      <div
        style={{
          borderTop: "1px solid #eee",
          padding: "10px"
        }}
      >
        <input
          placeholder="پیام خود را بنویسید..."
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ddd"
          }}
        />
      </div>

    </div>
  )
}

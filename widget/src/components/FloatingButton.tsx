//widget\src\components\FloatingButton.tsx
//همون دکمه گرد پایین سمت راست صفحه است که آیکون 💬 داره.
type Props = {
  onClick: () => void
}

export default function FloatingButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        border: "none",
        background: "#2563eb",
        color: "white",
        fontSize: "24px",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 9999
      }}
    >
      💬
    </button>
  )
}

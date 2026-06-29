//widget\src\main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import WidgetApp from "./WidgetApp"

function mountWidget() {
  // ساخت container
  const host = document.createElement("div")
  host.id = "chat-widget-host"
  document.body.appendChild(host)

  // ساخت shadow root
  const shadow = host.attachShadow({ mode: "open" })

  // ساخت mount point داخل shadow
  const mountPoint = document.createElement("div")
  shadow.appendChild(mountPoint)

  ReactDOM.createRoot(mountPoint).render(
    <React.StrictMode>
      <WidgetApp />
    </React.StrictMode>
  )
}

// اجرای خودکار
mountWidget()

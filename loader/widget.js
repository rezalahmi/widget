(function () {
  const script = document.currentScript
  const token = script.getAttribute("data-token")

  if (!token) {
    console.error("Widget token missing")
    return
  }

  // inject global config
  window.__CHAT_WIDGET_CONFIG__ = {
    token: token
  }

  // load built widget file
  const s = document.createElement("script")
  s.src = "http://localhost:5173/src/main.tsx"
  s.type = "module"
  document.body.appendChild(s)
})()

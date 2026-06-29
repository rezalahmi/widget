export function getVisitorKey() {

  const cookie = document.cookie
    .split("; ")
    .find(c => c.startsWith("widget_visitor="))

  if (cookie) {
    return cookie.split("=")[1]
  }

  const key = crypto.randomUUID()

  document.cookie = `widget_visitor=${key}; path=/; max-age=31536000`

  return key
}

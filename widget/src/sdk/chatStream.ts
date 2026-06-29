export type ChatCitation = {
  index: number
  file_id: string
  file_name: string
  page_number?: number | null
  chunk_index?: number | null
  score?: number | null
  sheet?: string | null
  row?: number | null
  slide_number?: number | null
}

type StreamEvent =
  | { type: "chunk"; content: string }
  | { type: "citations"; citations: ChatCitation[] }
  | { type: "done"; usage?: Record<string, unknown> }

type SendMessageOptions = {
  token: string
  sessionId: string
  content: string
  onChunk: (content: string) => void
  onCitations?: (citations: ChatCitation[]) => void
  onDone?: () => void
}

const API_BASE = "http://185.155.9.107:8080/api/v1/widget"

export async function sendWidgetChatMessage({
  token,
  sessionId,
  content,
  onChunk,
  onCitations,
  onDone,
}: SendMessageOptions) {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-widget-token": token,
    },
    body: JSON.stringify({ content }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Widget chat message failed: ${res.status} ${res.statusText} ${errorBody}`)
  }

  if (!res.body) {
    throw new Error("Widget chat message stream is empty.")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parsed = drainStreamEvents(buffer)
    buffer = parsed.remaining
    parsed.events.forEach((event) => handleStreamEvent(event, onChunk, onCitations, onDone))
  }

  buffer += decoder.decode()
  const parsed = drainStreamEvents(buffer, true)
  parsed.events.forEach((event) => handleStreamEvent(event, onChunk, onCitations, onDone))
}

function handleStreamEvent(
  event: StreamEvent,
  onChunk: (content: string) => void,
  onCitations?: (citations: ChatCitation[]) => void,
  onDone?: () => void,
) {
  if (event.type === "chunk") {
    onChunk(event.content)
    return
  }

  if (event.type === "citations") {
    onCitations?.(event.citations)
    return
  }

  if (event.type === "done") {
    onDone?.()
  }
}

function drainStreamEvents(buffer: string, flush = false) {
  const events: StreamEvent[] = []
  let remaining = buffer

  while (true) {
    const currentStart = remaining.indexOf("data:")
    if (currentStart === -1) {
      return { events, remaining: flush ? "" : remaining }
    }

    if (currentStart > 0) {
      remaining = remaining.slice(currentStart)
    }

    const nextStart = remaining.indexOf("data:", 5)
    const eventEnd = findSseEventEnd(remaining)

    if (eventEnd !== -1 && (nextStart === -1 || eventEnd < nextStart)) {
      const event = parseStreamEvent(remaining.slice(5, eventEnd))
      if (event) events.push(event)
      remaining = remaining.slice(eventEnd).trimStart()
      continue
    }

    if (nextStart === -1) {
      if (!flush) return { events, remaining }

      const event = parseStreamEvent(remaining.slice(5))
      if (event) events.push(event)
      return { events, remaining: "" }
    }

    const event = parseStreamEvent(remaining.slice(5, nextStart))
    if (event) events.push(event)
    remaining = remaining.slice(nextStart)
  }
}

function findSseEventEnd(value: string) {
  const unixEnd = value.indexOf("\n\n", 5)
  const windowsEnd = value.indexOf("\r\n\r\n", 5)

  if (unixEnd === -1) return windowsEnd
  if (windowsEnd === -1) return unixEnd

  return Math.min(unixEnd, windowsEnd)
}

function parseStreamEvent(raw: string): StreamEvent | null {
  const jsonText = raw.trim()
  if (!jsonText) return null

  try {
    const parsed = JSON.parse(jsonText) as Partial<StreamEvent>
    if (parsed.type === "chunk" && typeof parsed.content === "string") {
      return parsed as StreamEvent
    }
    if (parsed.type === "citations" && Array.isArray(parsed.citations)) {
      return parsed as StreamEvent
    }
    if (parsed.type === "done") {
      return parsed as StreamEvent
    }
  } catch (err) {
    console.error("Failed to parse widget chat stream event:", err, jsonText)
  }

  return null
}

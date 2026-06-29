export const VisitorEventType = {
  PAGE_VIEW: "page_view",
  SCROLL: "scroll",
  BUTTON_CLICK: "button_click",
  FORM_START: "form_start",
  FORM_SUBMIT: "form_submit",
  PRICING_VIEW: "pricing_view",
  CONTACT_VIEW: "contact_view",
  CHAT_OPEN: "chat_open",
  CHAT_MESSAGE: "chat_message",
  WIDGET_INIT: "widget_init",
} as const

export type VisitorEventType = (typeof VisitorEventType)[keyof typeof VisitorEventType]

export type WidgetEventRequest = {
  visitor_key: string
  event_type: VisitorEventType
  event_value?: string | null
  url?: string | null
  metadata?: Record<string, unknown> | null
}

export type WidgetEventResponse = {
  success: boolean
  event_type: VisitorEventType
  visitor_is_lead: boolean
  lead_id?: number | null
  trigger?: unknown | null
}

type TrackerConfig = {
  token: string
  visitorKey: string
}

const API_BASE = "http://185.155.9.107:8080/api/v1/widget"
const scrollDepths = [25, 50, 75, 100]

let config: TrackerConfig | null = null
let started = false
let lastUrl = window.location.href
const trackedFormStarts = new WeakSet<HTMLFormElement>()
let trackedVisibilityTargets = new WeakSet<Element>()
const trackedScrollDepths = new Set<number>()

export function configureVisitorTracker(nextConfig: TrackerConfig) {
  config = nextConfig
}

export function startVisitorTracker() {
  if (started) return

  started = true
  trackWidgetEvent(VisitorEventType.PAGE_VIEW, document.title || undefined, {
    referrer: document.referrer || null,
  })
  detectUrlBasedViews()
  setupUrlTracking()
  setupScrollTracking()
  setupClickTracking()
  setupFormTracking()
  setupSectionVisibilityTracking()
}

export async function trackWidgetEvent(
  eventType: VisitorEventType,
  eventValue?: string | null,
  metadata?: Record<string, unknown> | null,
): Promise<WidgetEventResponse | null> {
  if (!config) return null

  const payload: WidgetEventRequest = {
    visitor_key: config.visitorKey,
    event_type: eventType,
    event_value: eventValue ?? null,
    url: window.location.href,
    metadata: metadata ?? null,
  }

  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-widget-token": config.token,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Widget event failed: ${res.status} ${res.statusText} ${errorBody}`)
    }

    return res.json()
  } catch (err) {
    console.error("Widget event tracking failed:", err)
    return null
  }
}

function setupUrlTracking() {
  const originalPushState = window.history.pushState
  const originalReplaceState = window.history.replaceState

  window.history.pushState = function pushState(...args) {
    const result = originalPushState.apply(this, args)
    handlePossiblePageChange()
    return result
  }

  window.history.replaceState = function replaceState(...args) {
    const result = originalReplaceState.apply(this, args)
    handlePossiblePageChange()
    return result
  }

  window.addEventListener("popstate", handlePossiblePageChange)
  window.addEventListener("hashchange", handlePossiblePageChange)
}

function handlePossiblePageChange() {
  window.setTimeout(() => {
    if (window.location.href === lastUrl) return

    lastUrl = window.location.href
    trackedScrollDepths.clear()
    trackedVisibilityTargets = new WeakSet<Element>()
    trackWidgetEvent(VisitorEventType.PAGE_VIEW, document.title || undefined)
    detectUrlBasedViews()
    setupSectionVisibilityTracking()
  }, 0)
}

function setupScrollTracking() {
  let ticking = false

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return
      ticking = true

      window.requestAnimationFrame(() => {
        ticking = false
        const depth = getScrollDepth()
        const reachedDepth = scrollDepths.findLast(
          (candidate) => depth >= candidate && !trackedScrollDepths.has(candidate),
        )

        if (!reachedDepth) return

        trackedScrollDepths.add(reachedDepth)
        trackWidgetEvent(VisitorEventType.SCROLL, `${reachedDepth}%`, {
          scroll_depth: reachedDepth,
          scroll_y: Math.round(window.scrollY),
        })
      })
    },
    { passive: true },
  )
}

function setupClickTracking() {
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const clickable = target.closest(
        "button, a, input[type='button'], input[type='submit'], [role='button']",
      )
      if (!clickable) return
      if (clickable.closest("#chat-widget-host")) return

      trackWidgetEvent(VisitorEventType.BUTTON_CLICK, getElementLabel(clickable), {
        tag: clickable.tagName.toLowerCase(),
        id: clickable.id || null,
        classes: clickable.className || null,
        href: clickable instanceof HTMLAnchorElement ? clickable.href : null,
      })
    },
    true,
  )
}

function setupFormTracking() {
  document.addEventListener(
    "focusin",
    (event) => {
      const form = findEventForm(event)
      if (!form || trackedFormStarts.has(form)) return

      trackedFormStarts.add(form)
      trackWidgetEvent(VisitorEventType.FORM_START, getElementLabel(form), getFormMetadata(form))
    },
    true,
  )

  document.addEventListener(
    "submit",
    (event) => {
      const form = findEventForm(event)
      if (!form) return

      trackWidgetEvent(VisitorEventType.FORM_SUBMIT, getElementLabel(form), getFormMetadata(form))
    },
    true,
  )
}

function setupSectionVisibilityTracking() {
  if (!("IntersectionObserver" in window)) return

  const candidates = Array.from(
    document.querySelectorAll("section, main, article, [id], [class], a[href]"),
  ).filter((element) => {
    if (trackedVisibilityTargets.has(element)) return false

    const signature = getElementSignature(element)
    return signature.includes("pricing") || signature.includes("contact")
  })

  if (!candidates.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        const element = entry.target
        trackedVisibilityTargets.add(element)
        observer.unobserve(element)

        const signature = getElementSignature(element)
        if (signature.includes("pricing")) {
          trackWidgetEvent(VisitorEventType.PRICING_VIEW, getElementLabel(element))
        }
        if (signature.includes("contact")) {
          trackWidgetEvent(VisitorEventType.CONTACT_VIEW, getElementLabel(element))
        }
      })
    },
    { threshold: 0.4 },
  )

  candidates.forEach((element) => observer.observe(element))
}

function detectUrlBasedViews() {
  const url = window.location.href.toLowerCase()
  if (url.includes("pricing")) {
    trackWidgetEvent(VisitorEventType.PRICING_VIEW, "url_match")
  }
  if (url.includes("contact")) {
    trackWidgetEvent(VisitorEventType.CONTACT_VIEW, "url_match")
  }
}

function findEventForm(event: Event): HTMLFormElement | null {
  const target = event.target
  if (!(target instanceof Element)) return null

  return target.closest("form")
}

function getFormMetadata(form: HTMLFormElement): Record<string, unknown> {
  return {
    id: form.id || null,
    name: form.getAttribute("name"),
    action: form.action || null,
    method: form.method || null,
  }
}

function getElementLabel(element: Element): string | null {
  const label =
    element.getAttribute("data-track") ||
    element.getAttribute("aria-label") ||
    element.getAttribute("name") ||
    element.getAttribute("id") ||
    element.textContent?.trim().replace(/\s+/g, " ")

  return label ? label.slice(0, 255) : null
}

function getElementSignature(element: Element): string {
  return [
    element.id,
    typeof element.className === "string" ? element.className : "",
    element.getAttribute("href"),
    element.getAttribute("aria-label"),
    element.getAttribute("data-track"),
    element.textContent?.slice(0, 300),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function getScrollDepth() {
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
  )
  const viewportBottom = window.scrollY + window.innerHeight

  if (documentHeight <= window.innerHeight) return 100

  return Math.min(100, Math.round((viewportBottom / documentHeight) * 100))
}

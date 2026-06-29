// src/tracker/visitorTracker.ts
//این کلاس مثل یک دوربین مخفی کار می‌کنه. وقتی استارت شد،
//  منتظر می‌مونه کاربر اسکرول کنه، روی دکمه‌هایی که خاصی دارن کلیک کنه، یا توی فرم‌ها چیزی بنویسه و همه رو پشت سر هم برای سرور می‌فرسته.
export type WidgetEventType =
  | "page_view"
  | "scroll"
  | "button_click"
  | "form_start"
  | "form_submit"
  | "pricing_view"
  | "contact_view"
  | "chat_open"
  | "chat_message"
  | "widget_init"

type WidgetEventRequest = {
  visitor_key: string
  event_type: WidgetEventType
  event_value?: string | null
  url?: string | null
  metadata?: Record<string, unknown> | null
}

type VisitorTrackerConfig = {
  visitorKey: string
  widgetToken: string
  endpoint?: string
}

export class VisitorTracker {
  private visitorKey: string
  private widgetToken: string
  private endpoint: string
  private sentScrollLevels = new Set<number>()

  constructor(config: VisitorTrackerConfig) {
    this.visitorKey = config.visitorKey
    this.widgetToken = config.widgetToken
    this.endpoint =
      config.endpoint || "http://185.155.9.107:8080/api/v1/widget/events"
  }

  track(event: Omit<WidgetEventRequest, "visitor_key">) {
    const payload: WidgetEventRequest = {
      visitor_key: this.visitorKey,
      url: window.location.href,
      ...event
    }

    fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-widget-token": this.widgetToken
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch((error) => {
      console.error("Widget event failed:", error)
    })
  }

  trackWidgetInit() {
    this.track({
      event_type: "widget_init"
    })
  }

  trackPageView() {
    this.track({
      event_type: "page_view"
    })
  }

  trackPricingViewIfNeeded() {
    const path = window.location.pathname.toLowerCase()

    if (path.includes("pricing") || path.includes("plans")) {
      this.track({
        event_type: "pricing_view"
      })
    }
  }

  startScrollTracking() {
    window.addEventListener("scroll", () => {
      const pageHeight = document.documentElement.scrollHeight
      const visibleHeight = window.innerHeight
      const currentScroll = window.scrollY

      if (pageHeight <= visibleHeight) return

      const percent = ((currentScroll + visibleHeight) / pageHeight) * 100
      const levels = [25, 50, 75, 90]

      for (const level of levels) {
        if (percent >= level && !this.sentScrollLevels.has(level)) {
          this.sentScrollLevels.add(level)

          this.track({
            event_type: "scroll",
            event_value: String(level),
            metadata: {
              percent: level
            }
          })
        }
      }
    })
  }

  startButtonTracking() {
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null
      const element = target?.closest("[data-widget-track]")

      if (!element) return

      const eventType = element.getAttribute(
        "data-widget-track"
      ) as WidgetEventType | null

      const allowedEvents: WidgetEventType[] = [
        "button_click",
        "contact_view",
        "chat_open"
      ]

      if (!eventType || !allowedEvents.includes(eventType)) return

      this.track({
        event_type: eventType,
        event_value: element.getAttribute("data-widget-value"),
        metadata: {
          text: element.textContent?.trim().slice(0, 120) || null
        }
      })
    })
  }

  startFormTracking() {
    const startedForms = new WeakSet<HTMLFormElement>()

    document.addEventListener("focusin", (event) => {
      const target = event.target as HTMLElement | null
      const form = target?.closest("form")

      if (!form || startedForms.has(form)) return

      startedForms.add(form)

      this.track({
        event_type: "form_start",
        event_value: form.getAttribute("id") || form.getAttribute("name")
      })
    })

    document.addEventListener("submit", (event) => {
      const form = event.target as HTMLFormElement

      this.track({
        event_type: "form_submit",
        event_value: form.getAttribute("id") || form.getAttribute("name")
      })
    })
  }

  start() {
    this.trackWidgetInit()
    this.trackPageView()
    this.trackPricingViewIfNeeded()
    this.startScrollTracking()
    this.startButtonTracking()
    this.startFormTracking()
  }
}

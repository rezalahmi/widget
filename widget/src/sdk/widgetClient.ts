export type WidgetInitResponse = {
  visitor: {
    id: string
    visitor_key: string
    session_count: number
    first_seen_at: string
    last_seen_at: string
  }
  widget: {
    enabled: boolean
    auto_open: boolean
    theme: {
      primary_color: string
      position: string
    }
  }
}

const API_BASE = "http://185.155.9.107:8080/api/v1/widget"
const CHAT_SESSION_STORAGE_KEY = "widget_chat_session_id"

export type WidgetChatOpenRequest = {
    visitor_key: string
    channel?: string
    platform?: string
    url?: string | null
}

export type WidgetChatOpenResponse = {
    session_id: string
    status: string
}

export async function initWidget(token: string): Promise<WidgetInitResponse> {
    let visitorKey = localStorage.getItem("widget_visitor_key");
    if (!visitorKey) {
    // ساخت یک شناسه موقت مثلا با فرمت vst_random
    visitorKey = "vst_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("widget_visitor_key", visitorKey);
    }  
    const res = await fetch(`${API_BASE}/init`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "x-widget-token": token, // توکن اینجا قرار می‌گیرد
        },
        body: JSON.stringify({
        visitor_key: visitorKey,
        url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        language: navigator.language,
        metadata: {
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        new_session: true,
        }),
    })

    if (!res.ok) {
        throw new Error(`Widget init failed: ${res.statusText}`)
    }

    return res.json()
}

export async function openWidgetChat(
    token: string,
    request: WidgetChatOpenRequest,
): Promise<WidgetChatOpenResponse> {
    const res = await fetch(`${API_BASE}/chat/open`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "x-widget-token": token,
        },
        body: JSON.stringify({
        channel: "widget",
        platform: "web",
        url: window.location.href,
        ...request,
        }),
    })

    if (!res.ok) {
        const errorBody = await res.text()
        throw new Error(`Widget chat open failed: ${res.status} ${res.statusText} ${errorBody}`)
    }

    const data: WidgetChatOpenResponse = await res.json()
    sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, data.session_id)
    window.__CHAT_WIDGET__ = window.__CHAT_WIDGET__ || {}
    window.__CHAT_WIDGET__.chatSessionId = data.session_id

    return data
}

export function getStoredChatSessionId() {
    return sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)
}

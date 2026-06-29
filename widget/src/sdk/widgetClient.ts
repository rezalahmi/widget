//widget\src\sdk\widgetClient.ts
//این فایل یک شناسه (ID) از حافظه مرورگر می‌گیره (یا می‌سازه)، بعد اطلاعاتی مثل آدرس سایت،
//  زبان مرورگر، اندازه صفحه و... رو جمع می‌کنه و با یک درخواست POST به سرور شما می‌فرسته تا کاربر رو بشناسونه.
export type WidgetInitResponse = {
  visitor_key: string
  widget: {
    name: string
    primary_color: string
    position: "left" | "right"
  }
}





const API_BASE = "http://185.155.9.107:8080/api/v1/widget"

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

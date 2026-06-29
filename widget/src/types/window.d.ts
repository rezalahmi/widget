//widget\src\types\window.d.ts
export {}

declare global {
  interface Window {
    __CHAT_WIDGET_CONFIG__?: {
      token?: string
    }
    __CHAT_WIDGET__?: {
      initialized?: boolean
    }
  }
}


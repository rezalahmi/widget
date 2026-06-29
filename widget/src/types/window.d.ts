//widget\src\types\window.d.ts
export {}

declare global {
  interface Window {
    __CHAT_WIDGET__?: {
      initialized?: boolean
    }
  }
}


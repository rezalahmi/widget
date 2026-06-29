export {}

declare global {
  interface Window {
    __CHAT_WIDGET__?: {
      initialized?: boolean
    }
  }
}


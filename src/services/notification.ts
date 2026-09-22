/**
 * Browser notification service.
 *
 * Thin wrapper over the Notifications API: feature detection, permission
 * state, permission request and actual notification display. The app never
 * touches `window.Notification` directly so unsupported browsers degrade
 * gracefully (see utils/reminders).
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export interface ReminderPayload {
  title: string
  body: string
  /** Clicking the notification (or in-app toast) invokes this hook. */
  onClick?: () => void
}

export const NotificationService = {
  /** Whether the current browser supports the Notifications API. */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  },

  /** Current permission state; 'unsupported' when the API is missing. */
  getPermission(): NotificationPermissionState {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission as NotificationPermissionState
  },

  /**
   * Ask the user for notification permission. Must be called from a user
   * gesture. Resolves with the resulting permission state.
   */
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return 'unsupported'
    // Older Safari uses the callback form; promise form is wrapped for those.
    if (!('requestPermission' in Notification) || typeof Notification.requestPermission !== 'function') {
      return Notification.permission as NotificationPermissionState
    }
    const result = await Notification.requestPermission()
    return result as NotificationPermissionState
  },

  /**
   * Show a browser notification. Returns false when it could not be shown
   * (unsupported / permission missing), so callers can fall back.
   */
  show(payload: ReminderPayload): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') return false
    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: payload.title + payload.body,
        requireInteraction: true,
      })
      if (payload.onClick) {
        notification.onclick = () => {
          window.focus()
          payload.onClick?.()
          notification.close()
        }
      }
      return true
    } catch {
      return false
    }
  },
}

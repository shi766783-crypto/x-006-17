import { ref } from 'vue'

export type NotificationPermissionState = NotificationPermission | 'unsupported'

const supported = typeof window !== 'undefined' && 'Notification' in window

/** Reactive mirror of Notification.permission ('unsupported' when the API is missing). */
const permission = ref<NotificationPermissionState>(
  supported ? Notification.permission : 'unsupported',
)

/** Ask the user for notification permission. Must be called from a user gesture. */
async function requestPermission(): Promise<NotificationPermissionState> {
  if (!supported) return permission.value
  try {
    permission.value = await Notification.requestPermission()
  } catch {
    // Older browsers only expose the callback-based API; re-read the property instead.
    permission.value = Notification.permission
  }
  return permission.value
}

/** Re-read the permission, e.g. after the user changed it in the browser settings. */
function refreshPermission(): void {
  if (supported) permission.value = Notification.permission
}

/**
 * Show a browser notification. Returns false when notifications are unavailable
 * (unsupported / permission not granted / constructor threw) so callers can
 * fall back to an in-app reminder.
 */
function notify(title: string, body: string, tag?: string): boolean {
  if (!supported || Notification.permission !== 'granted') return false
  try {
    new Notification(title, {
      body,
      tag,
      icon: `${import.meta.env.BASE_URL}favicon.svg`,
    })
    return true
  } catch {
    return false
  }
}

export function useNotifications() {
  return {
    supported,
    permission,
    requestPermission,
    refreshPermission,
    notify,
  }
}

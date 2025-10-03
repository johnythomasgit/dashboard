export type NotificationPermissionState = 'default' | 'denied' | 'granted'

export async function ensureNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const res = await Notification.requestPermission()
    return res
  } catch {
    return 'denied'
  }
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, options)
  } catch {
    // Ignore
  }
}



import { ref } from 'vue'
import { useFamilyStore } from '../stores/useFamilyStore'
import type { DoseStatus, TodayDose } from '../types'
import { timeToMinutes, todayStr } from '../utils/date'
import { useNotifications } from './useNotifications'

export interface InAppReminder {
  /** `${planId}|${date}|${time}` — also used as the notification tag. */
  key: string
  planId: string
  time: string
  memberName: string
  medicineName: string
  dosage: string
}

/** In-app fallback reminders currently shown (browser notification unavailable). */
const inAppReminders = ref<InAppReminder[]>([])

/** Doses already reminded today, to avoid firing twice. */
const remindedKeys = new Set<string>()

let timer: number | null = null
let lastCheckDate = todayStr()

function keyOf(planId: string, time: string): string {
  return `${planId}|${todayStr()}|${time}`
}

/**
 * Due-time reminder engine. Polls today's doses and fires a browser
 * notification at each scheduled time, degrading to an in-app reminder
 * when notifications are denied or unsupported.
 *
 * Module-level singleton: call `start()` once from the app root.
 */
export function useMedicationReminders() {
  const store = useFamilyStore()
  const notifications = useNotifications()

  function dismiss(key: string) {
    inAppReminders.value = inAppReminders.value.filter((r) => r.key !== key)
  }

  function mark(reminder: InAppReminder, status: DoseStatus) {
    store.logDose(reminder.planId, reminder.time, status)
    dismiss(reminder.key)
  }

  function fire(dose: TodayDose, key: string) {
    const dosageText = dose.dosage ? `（剂量：${dose.dosage}）` : ''
    const sent = notifications.notify(
      '💊 服药提醒',
      `${dose.time} ${dose.memberName} 该服用 ${dose.medicineName} 了${dosageText}`,
      key,
    )
    if (sent) return
    // Fallback: in-app reminder when notifications are denied or unsupported.
    if (!inAppReminders.value.some((r) => r.key === key)) {
      inAppReminders.value.push({
        key,
        planId: dose.planId,
        time: dose.time,
        memberName: dose.memberName,
        medicineName: dose.medicineName,
        dosage: dose.dosage,
      })
    }
  }

  function check() {
    const today = todayStr()
    if (today !== lastCheckDate) {
      // Day rolled over: reset so tomorrow's doses can fire again.
      remindedKeys.clear()
      inAppReminders.value = []
      lastCheckDate = today
    }

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    for (const dose of store.todayDoses) {
      if (dose.status !== 'pending') continue
      if (timeToMinutes(dose.time) > nowMinutes) continue
      const key = keyOf(dose.planId, dose.time)
      if (remindedKeys.has(key)) continue
      remindedKeys.add(key)
      fire(dose, key)
    }

    // Drop reminders whose dose was already handled elsewhere (e.g. the list).
    inAppReminders.value = inAppReminders.value.filter((r) => {
      const dose = store.todayDoses.find(
        (d) => d.planId === r.planId && d.time === r.time,
      )
      return dose?.status === 'pending'
    })
  }

  /** Start polling. Idempotent; safe to call from the app root setup. */
  function start() {
    if (timer !== null) return
    // Pre-mark doses already past (beyond the current minute) so opening the
    // app late in the day doesn't fire a burst of stale reminders.
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    for (const dose of store.todayDoses) {
      if (timeToMinutes(dose.time) < nowMinutes) {
        remindedKeys.add(keyOf(dose.planId, dose.time))
      }
    }
    check()
    // 15s granularity: due doses fire within seconds of their scheduled time.
    timer = window.setInterval(check, 15000)
  }

  return {
    inAppReminders,
    dismiss,
    mark,
    start,
  }
}

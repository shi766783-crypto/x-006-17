import { reactive, readonly } from 'vue'
import { NotificationService } from '../services/notification'
import { useFamilyStore } from '../stores/useFamilyStore'
import type { TodayDose } from '../types'
import { timeToMinutes, todayStr } from './date'

/**
 * Medication reminder scheduler.
 *
 * Runs while the app is open and ticks every CHECK_INTERVAL. For every
 * pending dose whose scheduled time falls inside the alert window it:
 *   1. shows a browser notification when permission is granted, and
 *   2. always pushes an in-app toast (visible in the app) — this is the
 *      automatic fallback when notifications are unsupported / denied /
 *      not yet requested.
 *
 * Each dose is alerted at most once per day. The scheduler is a module-level
 * singleton so the ticker survives component remounts.
 */

const CHECK_INTERVAL = 20_000
/** A dose remains alertable for this long after its scheduled time. */
const ALERT_GRACE_MINUTES = 5
const MAX_TOASTS = 5

export interface ReminderToast {
  id: string
  title: string
  body: string
  planId: string
  time: string
}

interface ReminderState {
  /** Live browser-notification permission state, refreshed on ticks. */
  permission: ReturnType<typeof NotificationService.getPermission>
  toasts: ReminderToast[]
  /** Fired keys `${date}|${planId}|${time}` already alerted today. */
  alerted: Set<string>
  running: boolean
}

const state = reactive<ReminderState>({
  permission: NotificationService.getPermission(),
  toasts: [],
  alerted: new Set<string>(),
  running: false,
})

let timer: ReturnType<typeof setInterval> | null = null
let ticking = false
/** Registered by App.vue so reminders can jump to the medication view. */
let goToMedication: (() => void) | null = null

function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function currentDate(): string {
  return todayStr()
}

function pushToast(dose: TodayDose) {
  state.toasts.unshift({
    id: `${dose.planId}|${dose.time}|${Date.now()}`,
    title: `服药提醒：${dose.medicineName}`,
    body: `${dose.memberName}，${dose.time} 该服药了${dose.dosage ? `（${dose.dosage}）` : ''}`,
    planId: dose.planId,
    time: dose.time,
  })
  if (state.toasts.length > MAX_TOASTS) state.toasts.length = MAX_TOASTS
}

function fire(dose: TodayDose) {
  const payload = {
    title: `服药提醒：${dose.medicineName}`,
    body: `${dose.memberName}，${dose.time} 该服药了${dose.dosage ? `（${dose.dosage}）` : ''}`,
    onClick: () => goToMedication?.(),
  }
  // Browser notification first; in-app toast is always queued as well so the
  // reminder is visible inside the app (and doubles as the fallback).
  NotificationService.show(payload)
  pushToast(dose)
}

function check() {
  if (ticking) return
  ticking = true
  try {
    // Pick up permission changes the user made via browser chrome.
    state.permission = NotificationService.getPermission()

    const date = currentDate()
    const todayKeyPrefix = date + '|'
    // Drop remembered keys from previous days.
    for (const key of state.alerted) {
      if (!key.startsWith(todayKeyPrefix)) state.alerted.delete(key)
    }

    const now = nowMinutes()
    for (const dose of useFamilyStore().todayDoses) {
      if (dose.status !== 'pending') continue
      if (now - timeToMinutes(dose.time) > ALERT_GRACE_MINUTES) continue
      if (timeToMinutes(dose.time) > now) continue
      const key = `${date}|${dose.planId}|${dose.time}`
      if (state.alerted.has(key)) continue
      state.alerted.add(key)
      fire(dose)
    }
  } finally {
    ticking = false
  }
}

function start() {
  if (state.running) return
  state.running = true
  state.permission = NotificationService.getPermission()
  // Run shortly after mount (not synchronously inside setup), then on a tick.
  setTimeout(check, 1_500)
  timer = setInterval(check, CHECK_INTERVAL)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  state.running = false
}

function dismissToast(id: string) {
  const index = state.toasts.findIndex((t) => t.id === id)
  if (index !== -1) state.toasts.splice(index, 1)
}

function clearToasts() {
  state.toasts.splice(0)
}

/** Trigger the permission prompt from a user gesture; updates local state. */
async function enableNotifications() {
  state.permission = await NotificationService.requestPermission()
  return state.permission
}

/** Send a one-off test notification (or in-app toast when not granted). */
function sendTestReminder() {
  const dose: TodayDose = {
    planId: '__test__',
    memberId: '',
    memberName: '测试成员',
    medicineName: '示例药品',
    dosage: '1粒',
    time: new Date().toTimeString().slice(0, 5),
    status: 'pending',
  }
  fire(dose)
}

function registerNavigator(fn: () => void) {
  goToMedication = fn
}

export function useReminders() {
  return {
    state: readonly(state),
    start,
    stop,
    enableNotifications,
    sendTestReminder,
    dismissToast,
    clearToasts,
    registerNavigator,
  }
}

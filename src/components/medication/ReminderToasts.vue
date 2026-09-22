<script setup lang="ts">
import { useReminders } from '../../utils/reminders'

const { state, dismissToast, clearToasts, registerNavigator } = useReminders()

const emit = defineEmits<{ (e: 'navigate'): void }>()

registerNavigator(() => emit('navigate'))
</script>

<template>
  <div v-if="state.toasts.length" class="toast-host" role="status" aria-live="polite">
    <div v-for="toast in state.toasts" :key="toast.id" class="toast">
      <div class="toast-icon">⏰</div>
      <div class="toast-body" @click="emit('navigate')">
        <div class="toast-title">{{ toast.title }}</div>
        <div class="toast-text">{{ toast.body }}</div>
      </div>
      <button type="button" class="toast-close" aria-label="关闭提醒" @click="dismissToast(toast.id)">×</button>
    </div>
    <button v-if="state.toasts.length > 1" type="button" class="toast-clear" @click="clearToasts">
      全部关闭
    </button>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  width: min(340px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
  border-left: 4px solid var(--accent-color);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  padding: 12px 14px;
  animation: toast-in 0.25s ease;
}
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.toast-icon {
  font-size: 20px;
  line-height: 1.4;
}
.toast-body {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}
.toast-title {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
}
.toast-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.toast-close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0 2px;
}
.toast-clear {
  align-self: flex-end;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-secondary);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}
</style>

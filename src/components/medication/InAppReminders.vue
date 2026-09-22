<script setup lang="ts">
import { useMedicationReminders } from '../../composables/useMedicationReminders'

const { inAppReminders, dismiss, mark } = useMedicationReminders()
</script>

<template>
  <Teleport to="body">
    <div class="reminder-stack" aria-live="polite">
      <div v-for="r in inAppReminders" :key="r.key" class="reminder-toast">
        <div class="reminder-icon">💊</div>
        <div class="reminder-body">
          <div class="reminder-title">服药提醒 · {{ r.time }}</div>
          <div class="reminder-text">
            {{ r.memberName }} 该服用 {{ r.medicineName }} 了<template v-if="r.dosage">（剂量：{{ r.dosage }}）</template>
          </div>
          <div class="reminder-actions">
            <button type="button" class="btn btn-sm btn-primary" @click="mark(r, 'taken')">已服用</button>
            <button type="button" class="btn btn-sm btn-ghost" @click="mark(r, 'skipped')">跳过</button>
          </div>
        </div>
        <button type="button" class="reminder-close" aria-label="稍后" @click="dismiss(r.key)">×</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.reminder-stack {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1100;
  max-width: min(360px, calc(100vw - 40px));
}
.reminder-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--warning-color);
  border-radius: var(--radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  padding: 14px 16px;
  animation: reminder-in 0.25s ease-out;
}
@keyframes reminder-in {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.reminder-icon {
  font-size: 24px;
  line-height: 1.2;
}
.reminder-body {
  flex: 1;
  min-width: 0;
}
.reminder-title {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 14px;
}
.reminder-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.reminder-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.reminder-close {
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
}
.reminder-close:hover {
  color: var(--text-primary);
}
</style>

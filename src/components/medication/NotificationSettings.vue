<script setup lang="ts">
import { ref } from 'vue'
import { useReminders } from '../../utils/reminders'

const { state, enableNotifications, sendTestReminder } = useReminders()

const requesting = ref(false)

async function onEnable() {
  requesting.value = true
  try {
    await enableNotifications()
  } finally {
    requesting.value = false
  }
}
</script>

<template>
  <section class="card notify-card">
    <div class="notify-main">
      <span class="notify-icon">🔔</span>
      <div class="notify-text">
        <div class="notify-title">到点服药通知</div>

        <!-- Granted: browser notifications on -->
        <p v-if="state.permission === 'granted'" class="notify-desc">
          已开启浏览器通知，每次服药时间到达时会自动弹窗提醒（需保持本页面打开）。
        </p>

        <!-- Not asked yet: first-use prompt -->
        <p v-else-if="state.permission === 'default'" class="notify-desc">
          开启后，到点会通过浏览器弹窗提醒服药。当前将先使用应用内提醒。
        </p>

        <!-- Denied: in-app fallback + re-enable guidance -->
        <p v-else-if="state.permission === 'denied'" class="notify-desc">
          浏览器通知权限已被关闭，现在仅使用应用内提醒。可点击下方按钮重新开启；若浏览器不再弹出授权框，请点击地址栏左侧的锁形图标，在「通知」中改为允许。
        </p>

        <!-- Unsupported: in-app fallback only -->
        <p v-else class="notify-desc">
          当前浏览器不支持系统通知，将使用应用内提醒。服药时间到达时请保持本页面打开。
        </p>
      </div>
    </div>

    <div class="notify-actions">
      <span
        class="notify-badge"
        :class="{
          on: state.permission === 'granted',
          off: state.permission === 'denied' || state.permission === 'unsupported',
        }"
      >
        {{
          state.permission === 'granted'
            ? '浏览器通知已开启'
            : state.permission === 'denied'
              ? '应用内提醒'
              : state.permission === 'unsupported'
                ? '应用内提醒（不支持系统通知）'
                : '应用内提醒'
        }}
      </span>

      <button
        v-if="state.permission !== 'granted' && state.permission !== 'unsupported'"
        type="button"
        class="btn btn-sm btn-primary"
        :disabled="requesting"
        @click="onEnable"
      >
        {{ requesting ? '申请中…' : state.permission === 'denied' ? '重新开启通知' : '开启浏览器通知' }}
      </button>

      <button
        v-if="state.permission === 'granted'"
        type="button"
        class="btn btn-sm btn-ghost"
        @click="sendTestReminder"
      >
        发送测试提醒
      </button>
    </div>
  </section>
</template>

<style scoped>
.notify-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.notify-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 240px;
}
.notify-icon {
  font-size: 22px;
  line-height: 1.5;
}
.notify-title {
  font-weight: 700;
  color: var(--text-primary);
}
.notify-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 2px 0 0;
}
.notify-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.notify-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--accent-bg);
  color: var(--accent-color);
  white-space: nowrap;
}
.notify-badge.on {
  background: #eafaf1;
  color: var(--success-color);
}
.notify-badge.off {
  background: #fef5e7;
  color: var(--warning-color);
}
</style>

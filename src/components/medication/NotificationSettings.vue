<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNotifications } from '../../composables/useNotifications'

const { permission, requestPermission, refreshPermission } = useNotifications()
const showHelp = ref(false)

const status = computed(() => {
  switch (permission.value) {
    case 'granted':
      return {
        icon: '🔔',
        title: '浏览器通知已开启',
        desc: '每次服药时间到达时，将弹出系统通知提醒你。',
      }
    case 'denied':
      return {
        icon: '🔕',
        title: '通知权限已被拒绝',
        desc: '浏览器已阻止通知，到点将改为应用内提醒。可重新开启以接收系统通知。',
      }
    case 'unsupported':
      return {
        icon: '🔕',
        title: '当前浏览器不支持通知',
        desc: '到点将使用应用内提醒，保持本页面打开即可收到。',
      }
    default:
      return {
        icon: '⏰',
        title: '开启到点服药提醒',
        desc: '授权浏览器通知后，即使在使用其他页面，到点也会弹出系统提醒。',
      }
  }
})

async function onEnable() {
  if (permission.value === 'default') {
    const result = await requestPermission()
    // The user dismissed/blocked the prompt: show how to undo it later.
    if (result === 'denied') showHelp.value = true
  } else if (permission.value === 'denied') {
    // Browsers won't re-prompt after a denial; guide the user to settings.
    showHelp.value = !showHelp.value
  }
}

function onRecheck() {
  refreshPermission()
  if (permission.value === 'granted') showHelp.value = false
}
</script>

<template>
  <section class="card notify-card" :class="`notify-${permission}`">
    <div class="notify-icon">{{ status.icon }}</div>
    <div class="notify-info">
      <div class="notify-title">{{ status.title }}</div>
      <div class="notify-desc">{{ status.desc }}</div>
      <template v-if="showHelp && permission === 'denied'">
        <ol class="notify-steps">
          <li>点击浏览器地址栏左侧的 🔒（或 ⓘ）图标</li>
          <li>打开「网站设置」，找到「通知」权限</li>
          <li>改为「允许」后回到本页，点击下方按钮重新检测</li>
        </ol>
        <button type="button" class="btn btn-sm btn-ghost" @click="onRecheck">我已开启，重新检测</button>
      </template>
    </div>
    <button
      v-if="permission === 'default'"
      type="button"
      class="btn btn-primary"
      @click="onEnable"
    >
      开启浏览器通知
    </button>
    <button
      v-else-if="permission === 'denied'"
      type="button"
      class="btn btn-info"
      @click="onEnable"
    >
      重新开启通知
    </button>
  </section>
</template>

<style scoped>
.notify-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.notify-icon {
  font-size: 26px;
  line-height: 1.3;
}
.notify-info {
  flex: 1;
  min-width: 0;
}
.notify-title {
  font-weight: 700;
  color: var(--text-primary);
}
.notify-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.notify-granted {
  border-left: 4px solid var(--success-color);
}
.notify-default {
  border-left: 4px solid var(--accent-color);
}
.notify-denied,
.notify-unsupported {
  border-left: 4px solid var(--warning-color);
}
.notify-steps {
  margin: 10px 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}
.notify-steps li {
  margin-bottom: 4px;
}
</style>

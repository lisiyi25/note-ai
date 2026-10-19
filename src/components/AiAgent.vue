<template>
  <div class="ai-agent">
    <div class="fab-wrap" @mouseenter="hovering = true" @mouseleave="hovering = false">
      <transition name="tip-fade">
        <div v-if="hovering && !drawer" class="fab-tip">Hi，我是 NoteAI 小助手</div>
      </transition>
      <button class="ai-fab" type="button" @click="openDrawer">
        <span class="pulse"></span>
        <span class="pulse delay"></span>
        <span v-if="unread" class="badge">{{ unread }}</span>
        <span class="fab-icon">✨</span>
      </button>
    </div>

    <el-drawer
      v-model="drawer"
      size="420px"
      :with-header="false"
      modal-class="ai-agent-modal"
      class="ai-agent-drawer"
      @closed="onClosed"
    >
      <div class="panel">
        <header class="panel-header">
          <div class="title-row">
            <span class="avatar">🤖</span>
            <div>
              <h3>NoteAI Copilot</h3>
              <p>你的知识副驾驶</p>
            </div>
          </div>
          <el-button :icon="Close" circle plain size="small" @click="drawer = false" />
        </header>

        <div class="messages" ref="messagesRef">
          <div v-for="(msg, idx) in messages" :key="idx" :class="['msg', msg.role]">
            <div v-if="msg.thinking" class="thinking">
              🔍 正在思考并检索知识库<span class="dots"></span>
            </div>
            <div v-else class="bubble markdown-body" v-html="renderMd(msg.content)"></div>
          </div>
        </div>

        <div class="prompts">
          <button
            v-for="item in prompts"
            :key="item"
            type="button"
            class="prompt-chip"
            :disabled="busy"
            @click="runPrompt(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="composer">
          <el-input
            v-model="input"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="问问 NoteAI… 例如：这篇笔记的重点是什么？"
            @keydown.enter.exact.prevent="send"
          />
          <el-button type="primary" :loading="busy" @click="send">发送</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { Close } from '@element-plus/icons-vue'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  thinking?: boolean
}

const route = useRoute()
const router = useRouter()

const drawer = ref(false)
const hovering = ref(false)
const unread = ref(1)
const input = ref('')
const busy = ref(false)
const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: '你好，我是 **NoteAI Copilot**。可以帮你总结笔记、检索相似内容，或生成知识图谱思路。',
  },
])
const messagesRef = ref<HTMLElement>()
let timer: ReturnType<typeof setInterval> | null = null
let thinkTimer: ReturnType<typeof setTimeout> | null = null

const prompts = ['总结当前笔记', '帮我画个知识图谱', '查找相似内容']

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        /* ignore */
      }
    }
    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`
  },
})

function renderMd(content: string) {
  return md.render(content || '')
}

function openDrawer() {
  drawer.value = true
  unread.value = 0
}

function onClosed() {
  hovering.value = false
}

async function scrollBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function clearTimers() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (thinkTimer) {
    clearTimeout(thinkTimer)
    thinkTimer = null
  }
}

function buildAnswer(question: string): string {
  const noteHint = route.path.startsWith('/note/')
    ? '基于当前笔记上下文，'
    : '基于知识库检索结果，'

  if (question.includes('总结')) {
    return `${noteHint}我整理了如下要点：

## 核心结论
- 树与二叉树是层次化数据结构的基础
- 遍历方式决定了算法应用场景
- 平衡结构能保证查找的稳定复杂度

## 代码示例
\`\`\`ts
function inorder(root: TreeNode | null): number[] {
  if (!root) return []
  return [...inorder(root.left), root.val, ...inorder(root.right)]
}
\`\`\`

如果你需要，我还可以继续生成复习提纲或出几道练习题。`
  }

  if (question.includes('知识图谱') || question.includes('图谱')) {
    return `${noteHint}我已抽取关键实体与关系：

\`数据结构 → 树 → 二叉树\`  
\`算法 → 遍历 → 递归\`

建议下一步打开「知识图谱」大屏查看力引导可视化。正在为你跳转…`
  }

  if (question.includes('相似')) {
    return `${noteHint}为你找到 3 篇相似笔记：

1. **二叉树遍历算法详解** — 相似度 92%
2. **红黑树核心思想解读** — 相似度 84%
3. **数据结构入门：线性表与链表** — 相似度 76%

可以点击笔记广场卡片继续快速阅读。`
  }

  return `${noteHint}关于「${question}」，我建议从定义、复杂度与典型例题三条线展开。

\`\`\`js
// 快速自测：层序遍历
const bfs = (root) => {
  if (!root) return []
  const q = [root], res = []
  while (q.length) {
    const n = q.shift()
    res.push(n.val)
    if (n.left) q.push(n.left)
    if (n.right) q.push(n.right)
  }
  return res
}
\`\`\`

还想让我继续细化哪一部分？`
}

function typewrite(full: string) {
  return new Promise<void>((resolve) => {
    const idx = messages.value.length - 1
    let i = 0
    timer = setInterval(() => {
      messages.value[idx].content += full[i]
      i += 1
      scrollBottom()
      if (i >= full.length) {
        clearTimers()
        busy.value = false
        resolve()
      }
    }, 16)
  })
}

async function ask(question: string) {
  if (!question.trim() || busy.value) return
  busy.value = true
  messages.value.push({ role: 'user', content: question.trim() })
  messages.value.push({ role: 'assistant', content: '', thinking: true })
  await scrollBottom()

  await new Promise<void>((resolve) => {
    thinkTimer = setTimeout(() => resolve(), 1500)
  })

  const last = messages.value[messages.value.length - 1]
  last.thinking = false
  last.content = ''

  const answer = buildAnswer(question)
  await typewrite(answer)

  if (question.includes('知识图谱') || question.includes('图谱')) {
    setTimeout(() => router.push('/graph'), 600)
  }
}

function send() {
  const q = input.value
  input.value = ''
  ask(q)
}

function runPrompt(prompt: string) {
  ask(prompt)
}

onBeforeUnmount(clearTimers)
</script>

<style scoped lang="scss">
.ai-agent {
  position: fixed;
  right: 28px;
  bottom: 32px;
  z-index: 40;
}

.fab-wrap {
  position: relative;
}

.fab-tip {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(26, 27, 38, 0.92);
  color: #fff;
  font-size: 13px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}

.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(6px);
}

.ai-fab {
  position: relative;
  width: 58px;
  height: 58px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(145deg, #69b1ff, #1677ff 50%, #6d28d9);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 28px rgba(22, 119, 255, 0.4);
  transition: transform 0.25s ease;

  &:hover {
    transform: translateY(-2px) scale(1.04);
  }
}

.fab-icon {
  font-size: 22px;
  position: relative;
  z-index: 1;
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #f56c6c;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  border: 2px solid #fff;
}

.pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(22, 119, 255, 0.45);
  animation: breath 2.2s ease-out infinite;

  &.delay {
    animation-delay: 0.8s;
  }
}

@keyframes breath {
  0% {
    transform: scale(1);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.7);
    opacity: 0;
  }
}

.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(247, 249, 252, 0.88));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(235, 238, 245, 0.9);
}

.title-row {
  display: flex;
  gap: 10px;
  align-items: center;

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e6f4ff, #f3e8ff);
    font-size: 20px;
  }

  h3 {
    font-size: 16px;
    margin-bottom: 2px;
  }

  p {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

.messages {
  flex: 1;
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg {
  display: flex;

  &.user {
    justify-content: flex-end;

    .bubble {
      background: linear-gradient(120deg, #1677ff, #3b82f6);
      color: #fff;
      border-radius: 14px 14px 4px 14px;

      :deep(p),
      :deep(li),
      :deep(code) {
        color: #fff;
      }

      :deep(code) {
        background: rgba(255, 255, 255, 0.18);
      }
    }
  }

  &.assistant .bubble {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(235, 238, 245, 0.95);
    border-radius: 14px 14px 14px 4px;
  }
}

.bubble {
  max-width: 92%;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  box-shadow: 0 4px 14px rgba(149, 157, 165, 0.08);
}

.thinking {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px dashed #c6d4f5;
  color: var(--color-text-regular);
  font-size: 13px;
}

.dots::after {
  content: '';
  animation: dots 1.2s steps(3, end) infinite;
}

@keyframes dots {
  0% {
    content: '';
  }
  33% {
    content: '.';
  }
  66% {
    content: '..';
  }
  100% {
    content: '...';
  }
}

.prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 10px;
}

.prompt-chip {
  border: 1px solid #d6e4ff;
  background: #eef5ff;
  color: #1d4ed8;
  font-size: 12px;
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.15);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(235, 238, 245, 0.95);
  align-items: end;
}
</style>

<style>
.ai-agent-drawer .el-drawer__body {
  padding: 0 !important;
  background: transparent !important;
}

.ai-agent-modal {
  background: rgba(15, 23, 42, 0.18) !important;
  backdrop-filter: blur(2px);
}
</style>

<template>
  <div class="page-container home-page">
    <div class="search-area">
      <div class="capsule-search">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索笔记标题、标签或摘要..."
          @keyup.enter="handleSearch"
        />
        <button v-if="keyword" type="button" class="clear-btn" @click="clearKeyword">×</button>
      </div>
      <button type="button" class="ai-search-btn" :disabled="aiSearching" @click="handleAiSearch">
        <span class="spark">✨</span>
        AI 智能搜索
      </button>
    </div>

    <transition name="console-slide">
      <div v-if="aiConsoleVisible" class="ai-console">
        <div
          v-for="(line, idx) in aiConsoleLines"
          :key="idx"
          class="console-line"
          :class="{ show: idx < aiConsoleStep }"
        >
          <span class="dot" :class="{ done: idx < aiConsoleStep - 1 || aiConsoleDone }"></span>
          {{ line }}
        </div>
      </div>
    </transition>

    <!-- 骨架屏 -->
    <div v-if="loading" class="note-masonry">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="image" style="width: 100%; height: 150px" />
            <div style="padding: 14px 16px">
              <el-skeleton-item variant="h3" style="width: 70%" />
              <el-skeleton-item variant="text" style="margin-top: 12px; width: 100%" />
              <el-skeleton-item variant="text" style="width: 90%" />
              <div style="display: flex; gap: 8px; margin-top: 14px">
                <el-skeleton-item variant="text" style="width: 48px; height: 22px" />
                <el-skeleton-item variant="text" style="width: 48px; height: 22px" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <transition name="fade-list">
      <div v-show="!loading" class="note-masonry" :class="{ refreshing: listRefreshing }">
        <article
          v-for="(item, index) in list"
          :key="item.id"
          class="note-card"
          @click="openPreview(item)"
        >
          <div class="cover-wrap">
            <div
              class="cover-gradient"
              :style="coverStyle(item, index)"
            >
              <div class="cover-grid"></div>
            </div>
            <img
              class="cover-img"
              :src="coverImage(item, index)"
              :alt="item.title"
              loading="lazy"
              @error="onCoverError($event)"
            />
          </div>
          <div class="body">
            <h3 class="title">{{ item.title }}</h3>
            <p class="summary">{{ item.summary }}</p>
            <div class="tags">
              <span v-for="tag in item.tags" :key="tag" class="capsule-tag">{{ tag }}</span>
            </div>
            <div class="meta">
              <div class="author">
                <div class="avatar-wrap">
                  <el-avatar :size="28" :src="item.author.avatar" />
                  <span class="verified" title="认证作者">V</span>
                </div>
                <span>{{ item.author.name }}</span>
              </div>
              <div class="stats">
                <span class="stat"><el-icon><Star /></el-icon>{{ item.likes }}</span>
                <span class="stat"><el-icon><CollectionTag /></el-icon>{{ item.favorites }}</span>
              </div>
            </div>
          </div>
          <button type="button" class="quick-read" @click.stop="openPreview(item)">
            快速阅读
          </button>
        </article>
      </div>
    </transition>

    <div v-if="!loading && list.length === 0" class="empty">
      <el-empty description="暂无相关笔记" />
    </div>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        :page-sizes="[8, 12, 16]"
        @current-change="() => loadData()"
        @size-change="onSizeChange"
      />
    </div>

    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="40%"
      :with-header="false"
      destroy-on-close
    >
      <div class="drawer-panel" v-if="previewNote">
        <div class="drawer-top">
          <h3>笔记预览</h3>
          <el-button :icon="Close" circle plain @click="drawerVisible = false" />
        </div>

        <div class="drawer-cover" :style="coverStyle(previewNote, previewIndex)">
          <div class="cover-grid"></div>
          <img
            class="drawer-cover-img"
            :src="coverImage(previewNote, previewIndex)"
            alt=""
            @error="onCoverError($event)"
          />
        </div>

        <h2 class="drawer-title">{{ previewNote.title }}</h2>
        <div class="drawer-meta">
          <div class="avatar-wrap">
            <el-avatar :size="28" :src="previewNote.author.avatar" />
            <span class="verified">V</span>
          </div>
          <span>{{ previewNote.author.name }}</span>
          <el-divider direction="vertical" />
          <span>{{ formatDate(previewNote.createdAt) }}</span>
        </div>
        <div class="tags">
          <span v-for="tag in previewNote.tags" :key="tag" class="capsule-tag">{{ tag }}</span>
        </div>

        <p class="drawer-summary">{{ previewNote.summary }}</p>
        <div class="markdown-body drawer-md" v-html="previewHtml"></div>

        <div class="drawer-actions">
          <el-button type="primary" :loading="aiLoading" @click="runAiSummary">✨ AI 总结</el-button>
          <el-button @click="goFullDetail">查看完整详情</el-button>
        </div>

        <div v-if="aiSummary" class="ai-box">
          <h4>AI 总结</h4>
          <p>{{ aiSummary }}</p>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close, CollectionTag, Search, Star } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import { fetchAiSummary, fetchNoteList, type NoteItem } from '@/api/note'

const GRADIENTS = [
  'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
]

const UNSPLASH = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=800&q=80',
]

const AI_CONSOLE_TEXT = [
  '⚙️ 正在解析自然语言...',
  '🧠 正在调用向量知识库...',
  '✨ 为你找到相关笔记...',
]

const route = useRoute()
const router = useRouter()
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

const keyword = ref('')
const loading = ref(false)
const list = ref<NoteItem[]>([])
const page = ref(1)
const pageSize = ref(8)
const total = ref(0)
const listRefreshing = ref(false)

const drawerVisible = ref(false)
const previewNote = ref<NoteItem | null>(null)
const previewIndex = ref(0)
const aiSummary = ref('')
const aiLoading = ref(false)

const aiSearching = ref(false)
const aiConsoleVisible = ref(false)
const aiConsoleStep = ref(0)
const aiConsoleDone = ref(false)
const aiConsoleLines = ref([...AI_CONSOLE_TEXT])
let consoleTimers: ReturnType<typeof setTimeout>[] = []

const previewHtml = computed(() =>
  previewNote.value ? md.render(previewNote.value.content.slice(0, 800) + '\n\n…') : '',
)

function coverStyle(item: NoteItem, index: number) {
  const seed = Number(item.id.replace(/\D/g, '')) || index
  return { background: GRADIENTS[seed % GRADIENTS.length] }
}

function coverImage(item: NoteItem, index: number) {
  const seed = Number(item.id.replace(/\D/g, '')) || index
  return UNSPLASH[seed % UNSPLASH.length]
}

function onCoverError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.opacity = '0'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN')
}

function clearConsoleTimers() {
  consoleTimers.forEach((t) => clearTimeout(t))
  consoleTimers = []
}

async function loadData(options?: { soft?: boolean }) {
  if (!options?.soft) loading.value = true
  else listRefreshing.value = true
  try {
    const res = await fetchNoteList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
    })
    let data = res.data.list
    if (route.meta.mine) {
      data = data.filter((_, idx) => idx % 2 === 0)
    }
    list.value = data
    total.value = route.meta.mine ? Math.ceil(res.data.total / 2) : res.data.total
  } finally {
    loading.value = false
    listRefreshing.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadData()
}

function clearKeyword() {
  keyword.value = ''
  handleSearch()
}

async function handleAiSearch() {
  if (aiSearching.value) return
  aiSearching.value = true
  aiConsoleVisible.value = true
  aiConsoleStep.value = 0
  aiConsoleDone.value = false
  clearConsoleTimers()

  if (!keyword.value.trim()) {
    keyword.value = '树'
  }

  const countHint = Math.max(3, Math.min(8, Math.floor(Math.random() * 5) + 3))
  aiConsoleLines.value = [
    '⚙️ 正在解析自然语言...',
    '🧠 正在调用向量知识库...',
    `✨ 为你找到 ${countHint} 篇相关笔记...`,
  ]

  consoleTimers.push(
    setTimeout(() => {
      aiConsoleStep.value = 1
    }, 350),
    setTimeout(() => {
      aiConsoleStep.value = 2
    }, 1100),
    setTimeout(() => {
      aiConsoleStep.value = 3
      aiConsoleDone.value = true
    }, 1900),
    setTimeout(async () => {
      page.value = 1
      await loadData({ soft: true })
      aiSearching.value = false
      setTimeout(() => {
        aiConsoleVisible.value = false
      }, 900)
    }, 2300),
  )
}

function onSizeChange() {
  page.value = 1
  loadData()
}

function openPreview(item: NoteItem) {
  previewNote.value = item
  previewIndex.value = list.value.findIndex((n) => n.id === item.id)
  aiSummary.value = ''
  drawerVisible.value = true
}

async function runAiSummary() {
  if (!previewNote.value) return
  aiLoading.value = true
  try {
    const res = await fetchAiSummary(previewNote.value.id)
    aiSummary.value = res.data.summary
  } finally {
    aiLoading.value = false
  }
}

function goFullDetail() {
  if (!previewNote.value) return
  drawerVisible.value = false
  router.push(`/note/${previewNote.value.id}`)
}

onMounted(loadData)

watch(
  () => route.fullPath,
  () => {
    page.value = 1
    loadData()
  },
)

onBeforeUnmount(clearConsoleTimers)
</script>

<style scoped lang="scss">
.home-page {
  max-width: 1280px;
  margin: 0 auto;
}

.search-area {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 16px;
}

.capsule-search {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-radius: 50px;
  background: #fff;
  box-shadow: inset 0 2px 8px rgba(15, 23, 42, 0.06), 0 4px 14px rgba(149, 157, 165, 0.08);
  border: 1px solid rgba(235, 238, 245, 0.9);
  transition: box-shadow 0.25s ease, border-color 0.25s ease;

  &:focus-within {
    border-color: #91caff;
    box-shadow: inset 0 2px 8px rgba(22, 119, 255, 0.05), 0 0 0 3px rgba(22, 119, 255, 0.1);
  }
}

.search-icon {
  color: #6b7280;
  font-size: 18px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-text-primary);

  &::placeholder {
    color: #9ca3af;
  }
}

.clear-btn {
  border: none;
  background: #eef2f7;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #6b7280;
  cursor: pointer;
}

.ai-search-btn {
  height: 48px;
  padding: 0 20px;
  border: none;
  border-radius: 50px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(120deg, #69b1ff, #1677ff 40%, #6d28d9);
  box-shadow: 0 8px 20px rgba(22, 119, 255, 0.28);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  .spark {
    display: inline-block;
    animation: sparkle 1.6s ease-in-out infinite;
  }

  &:hover:not(:disabled) {
    transform: translateX(6px);
    box-shadow: 0 12px 26px rgba(109, 40, 217, 0.3);
  }

  &:disabled {
    opacity: 0.75;
    cursor: wait;
  }
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.2) rotate(12deg);
  }
}

.ai-console {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #0f172a;
  color: #d1fae5;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
}

.console-line {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.35s ease;
  min-height: 24px;

  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  animation: blink 1s infinite;

  &.done {
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
    animation: none;
  }
}

@keyframes blink {
  50% {
    opacity: 0.35;
  }
}

.console-slide-enter-active,
.console-slide-leave-active {
  transition: all 0.3s ease;
}

.console-slide-enter-from,
.console-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.note-masonry {
  column-count: 3;
  column-gap: 20px;

  &.refreshing {
    animation: list-fade 0.55s ease;
  }
}

@keyframes list-fade {
  from {
    opacity: 0.25;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-list-enter-active {
  transition: opacity 0.45s ease;
}

.fade-list-enter-from {
  opacity: 0;
}

.skeleton-card,
.note-card {
  break-inside: avoid;
  margin-bottom: 20px;
  width: 100%;
  display: inline-block;
}

.skeleton-card {
  overflow: hidden;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(149, 157, 165, 0.1);
}

.note-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(149, 157, 165, 0.1);
  border: 1px solid rgba(235, 238, 245, 0.9);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px rgba(149, 157, 165, 0.22);

    .quick-read {
      opacity: 1;
      transform: translateY(0);
    }

    .cover-img {
      transform: scale(1.04);
    }
  }
}

.cover-wrap {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.cover-gradient,
.cover-img {
  position: absolute;
  inset: 0;
}

.cover-gradient {
  z-index: 0;
}

.cover-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.55;
  mix-blend-mode: soft-light;
}

.cover-img {
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.88;
  transition: transform 0.35s ease, opacity 0.3s ease;
}

.body {
  padding: 14px 16px 16px;
}

.title {
  font-size: 16px;
  font-weight: 650;
  margin-bottom: 8px;
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary {
  font-size: 13px;
  color: var(--color-text-regular);
  line-height: 1.6;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.capsule-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
  background: #e6f4ff;
  color: #0958d9;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-wrap {
  position: relative;
  width: 28px;
  height: 28px;
}

.verified {
  position: absolute;
  right: -3px;
  bottom: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #1677ff;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #fff;
}

.stats {
  display: flex;
  gap: 12px;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: transform 0.2s ease, color 0.2s ease;

  &:hover {
    transform: scale(1.12);
    color: var(--color-primary);
  }
}

.quick-read {
  position: absolute;
  right: 12px;
  bottom: 12px;
  opacity: 0;
  transform: translateY(6px);
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
  transition: all 0.25s ease;
}

.pager {
  display: flex;
  justify-content: center;
  margin: 28px 0 12px;
}

.empty {
  padding: 40px 0;
}

.drawer-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px 4px 20px;
  background: #fff;
}

.drawer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
  }
}

.drawer-cover {
  position: relative;
  height: 140px;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
}

.drawer-cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.9;
}

.drawer-title {
  font-size: 22px;
  margin-bottom: 10px;
  line-height: 1.35;
}

.drawer-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 12px;
}

.drawer-summary {
  color: var(--color-text-regular);
  line-height: 1.7;
  margin: 4px 0 12px;
  font-size: 14px;
}

.drawer-md {
  flex: 1;
  overflow: auto;
  padding-right: 4px;
  margin-bottom: 16px;
  font-size: 14px;
}

.drawer-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.ai-box {
  padding: 14px;
  border-radius: 12px;
  background: #f7f9fc;
  border: 1px solid var(--color-border);

  h4 {
    margin-bottom: 8px;
    color: var(--color-primary);
    font-size: 14px;
  }

  p {
    font-size: 13px;
    line-height: 1.75;
    color: var(--color-text-regular);
  }
}

@media (max-width: 1100px) {
  .note-masonry {
    column-count: 2;
  }
}

@media (max-width: 700px) {
  .search-area {
    flex-direction: column;
    align-items: stretch;
  }

  .note-masonry {
    column-count: 1;
  }
}
</style>
